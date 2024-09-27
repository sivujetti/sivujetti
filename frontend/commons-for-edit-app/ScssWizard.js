import {
    addOrUpdateCodeTo,
    createScssBlock,
    createSelector,
    deleteCodeFrom,
    extractBlockId,
    indent,
    stylesToBaked,
} from './ScssWizardFuncs.js';
import {generatePushID} from './utils.js';

class ScssWizard {
    // styles;
    // cachedCompiledCss;
    // stateId;
    // currentPageIdPair;
    /**
     */
    constructor() {
        this.stateId = -1;
    }
    /**
     * Replaces this.styles and this.cachedCompiledCss with $bundle.
     *
     * @param {StylesBundleWithId} bundle
     * @access public
     */
    replaceStylesState(bundle) {
        this.styles = [...bundle.styleChunks];
        this.cachedCompiledCss = bundle.cachedCompiledCss;
        this.stateId = bundle.id;
    }
    /**
     * @param {Page} page
     * @access public
     */
    setCurrentPageInfo(page) {
        this.currentPageIdPair = `${page.id}:${page.type}`;
    }
    /**
     * @param {number} stateId
     * @returns {Array<StyleChunk>}
     * @access public
     */
    getAllStyles(stateId) {
        if (stateId !== this.stateId)
            throw new Error(`Invalid stateId ${stateId}, expected ${this.stateId}`);
        return this.styles;
    }
    /**
     * @param {styleScopeKind} scopeKind
     * @param {string} scopeSpecifier = undefined
     * @param {(style: StyleChunk) => boolean} predicate = true
     * @returns {Array<StyleChunk>}
     * @access public
     */
    findStyles(scopeKind, scopeSpecifier = undefined, fn = (_style) => true) {
        return scopeSpecifier !== undefined
            ? this.findStylesWithSpecifier(scopeKind, scopeSpecifier, fn)
            : this.findStylesWithoutSpecifier(scopeKind, fn);
    }
    /**
     * @param {string} scopeKind
     * @param {string} scopeSpecifier
     * @param {mediaScope} mediaScopeId = 'all'
     * @param {stylesLayer} layer = 'user-styles'
     * @returns {StyleChunk|null}
     * @access public
     */
    findStyle(scopeKind, scopeSpecifier, mediaScopeId = 'all', layer = 'user-styles') {
        return scopeSpecifier !== undefined
            ? this.findStyleWithSpecifier(scopeKind, scopeSpecifier, layer)
            : this.findStyleWithoutSpecifier(scopeKind, layer);
    }
    /**
     * @param {scssCodeInput} codeTemplate Examples 'color: red', 'ul li {\n  flex: 0 0 100%;\n}', [`.icon {`, `  width: %s;`, `  height: %s;`, `}`,]
     * @param {string} val
     * @param {string} blockId
     * @param {'main'|string} blockTreeId
     * @returns {StylesBundleWithId}
     * @access public
     */
    addNewUniqueScopeChunkAndReturnAllRecompiled(codeTemplate, val, blockId, blockTreeId) {
        const updated = this.doAddFirstScssChunk(codeTemplate, val, blockId, blockTreeId);
        return this.commitAll(updated);
    }
    /**
     * @param {Array<StyleChunk>} chunksToAdd
     * @returns {StylesBundleWithId}
     * @access public
     */
    addManyNewChunksAndReturnAllRecompiled(chunksToAdd) {
        for (const {scope, scss} of chunksToAdd) {
            if (scope.kind !== 'single-block') continue;
            const {layer} = scope;
            const blockId = extractBlockId(scss);
            if (this.findStyle('single-block', blockId, undefined, layer))
                throw new Error(`Unique style ${blockId}:${layer} already exist`);
        }
        const updated = [
            ...this.styles,
            ...chunksToAdd,
        ];
        return this.commitAll(updated);
    }
    /**
     * @param {scssCodeInput} codeTemplate Examples 'color: red;', '> sub-selector {\n  color: red;\n}', [`.icon {`, `  width: %s;`, `  height: %s;`, `}`,]
     * @param {string} val
     * @param {StyleChunk} currentStyle
     * @param {mediaScope} mediaScopeId = 'all'
     * @returns {StylesBundleWithId}
     * @access public
     */
    addOrUpdateScssCodeToExistingUniqueScopeChunkAndReturnAllRecompiled(codeTemplate, val, currentStyle, mediaScopeId = 'all') {
        const updated = this.doAddOrUpdateScssCodeOfExistingUniqueScopedChunk(codeTemplate, val, currentStyle);
        return this.commitAll(updated, mediaScopeId);
    }
    /**
     * @param {scssCodeInput} newScss
     * @param {StyleChunk} currentStyle
     * @param {mediaScope} mediaScopeId = 'all'
     * @returns {StylesBundleWithId}
     * @access public
     */
    replaceUniqueScopeChunkAndReturnAllRecompiled(newScss, currentStyle, mediaScopeId = 'all') {
        const updated = this.styles.map(s => {
            if (s !== currentStyle) return s;

            return {
                ...s,
                scss: [
                    `${createSelector(extractBlockId(s.scss))} {`,
                        ...(Array.isArray(newScss) ? newScss : newScss.split('\n')).map(l => indent(l, 1)),
                    '}'
                ].join('\n'),
            };
        });
        return this.commitAll(updated, mediaScopeId);
    }
    /**
     * @param {StyleChunk} chunkToDelete
     * @returns {StylesBundleWithId}
     * @access public
     */
    deleteStyleChunkAndReturnAllRecompiled(chunkToDelete) {
        const updated = this.styles.filter(s => s !== chunkToDelete);
        return this.commitAll(updated);
    }
    /**
     * @param {scssCodeInput} codeTemplate
     * @param {string} val
     * @param {StyleChunk} currentStyle
     * @param {mediaScope} mediaScopeId = 'all'
     * @returns {StylesBundleWithId}
     * @access public
     */
    deleteScssCodeFromExistingUniqueScopeChunkAndReturnAllRecompiled(codeTemplate, val, currentStyle, mediaScopeId = 'all') {
        const updated = this.deleteScssCodeFromExistingUniqueScopedChunk(codeTemplate, val, currentStyle);
        return this.commitAll(updated, mediaScopeId);
    }
    /**
     * @param {string} initialScssCode Example: '  // Your code here ...\n  color: red;'
     * @param {styleScopeKind} scopeKind
     * @param {CustomClassStyleChunkData} data
     * @returns {StylesBundleWithId}
     * @access public
     */
    addNewDevsScssChunkAndReturnAllRecompiled(initialScssCode, scopeKind, data) {
        const updated = [
            ...this.styles,
            {
                scope: scopeKind === 'custom-class'
                    ? {kind: 'custom-class', layer: 'dev-styles'}
                    : {kind: 'base-freeform', layer: 'base-styles'},
                scss: initialScssCode,
                data,
            }
        ];
        return this.commitAll(updated);
    }
    /**
     * @param {{scss?: string; data?: CustomClassStyleChunkData;}} changes Example: {scss: 'color: blue;'}
     * @param {StyleChunk} currentStyle
     * @returns {StylesBundleWithId}
     * @access public
     */
    updateDevsExistingChunkWithScssChunkAndReturnAllRecompiled(changes, currentStyle) {
        const updated = this.styles.map(s =>
            s !== currentStyle ? s : {...s, ...changes}
        );
        return this.commitAll(updated);
    }
    /**
     * @param {Array<StyleChunk>} uniqueScopeChunks
     * @param {(blockId: string, newClass: string) => any} onConverted
     * @returns {StylesBundleWithId|null}
     * @access public
     */
    convertManyUniqueScopeChunksToClassScopeChunksAndReturnAllRecompiled(uniqueScopeChunks, onConverted) {
        const affectedMediaScopeIds = {};
        const styles = [];
        const styleBlockIds = [];
        for (const {scope, scss} of uniqueScopeChunks) {
            const {media, layer} = scope;
            const blockId = extractBlockId(scss);
            const s = this.findStyle('single-block', blockId, media, layer);
            if (!s) throw new Error(`Failed to locate unique style ${blockId}:${media}:${layer}`);
            styles.push(s);
            styleBlockIds.push(blockId);
            affectedMediaScopeIds[media] = 1;
        }

        // Build {[duplicateScssKey: string]: {newClass: string; newStyle: StyleChunk; converted: Array<{blockId: string; orig: StyleChunk;}>;}}
        const mapped = this.styles.reduce((map, s) => {
            const idx = styles.indexOf(s);
            if (idx < 0) return map;

            const blockIdOfThisStyleChunk = styleBlockIds[idx];
            const ir = s.scss.replace(
                `data-block="${blockIdOfThisStyleChunk}"`,
                `data-style-group="@temp"`,
            );

            const maybeDuplicateScssSorted = ir.split('\n').sort().join('\n');
            const maybeDuplicateScssKey = [
                s.scope.media,
                s.scope.layer,
                maybeDuplicateScssSorted
            ].join('|');

            const prev = map[maybeDuplicateScssKey];
            if (!prev) {
                const newClass = generatePushID(true);
                const scss = ir.replace('@temp', newClass);
                // {hash1: {...}} ->
                // {hash1: {...}, hash2: {...}}
                return {
                    ...map,
                    [maybeDuplicateScssKey]: {
                        newClass,
                        converted: [{blockId: blockIdOfThisStyleChunk, orig: s}],
                        newStyle: {
                            scss,
                            scope: {
                                kind: 'style-group',
                                media: s.scope.media,
                                layer: s.scope.layer,
                            }
                        },
                    }
                };
            } else {
                // {..., hash2: {..., converted: [<first>]}} ->
                // {..., hash2: {..., converted: [<first>, <second>]}}
                return {
                    ...map,
                    [maybeDuplicateScssKey]: {
                        ...prev,
                        converted: [...prev.converted, {blockId: blockIdOfThisStyleChunk, orig: s}]
                    }
                };
            }
        }, {});

        const mappedArr = Object.keys(mapped).map(key => mapped[key]);
        if (!mappedArr.length)
            return null;
        const optimized = this.styles.reduce((out, s) => {
            const opt = mappedArr.find(({converted}) => converted.some(({orig}) => orig === s));
            if (!opt) return [...out, s];

            const {newClass, converted, newStyle} = opt;
            if (!out.find(({scss}) => scss === newStyle.scss)) {
                converted.forEach(({blockId}) => onConverted(blockId, newClass));
                return [...out, newStyle];
            } // else already added
            return out;
        }, []);

        return this.commitAll(optimized, affectedMediaScopeIds);
    }
    /**
     * @param {scssCodeInput} codeTemplate
     * @param {string} val
     * @param {string} blockId
     * @param {'main'|string} blockTreeId
     * @returns {StylesBundleWithId}
     * @access private
     */
    doAddFirstScssChunk(inputCodeTemplate, val, blockId, blockTreeId) {
        if (!Array.isArray(inputCodeTemplate))
            return [
                ...this.styles,
                this.createNewUniqueChunk(
                    createScssBlock(inputCodeTemplate.replace(/%s/g, val), `${createSelector(blockId)} {`),
                    blockId,
                    blockTreeId,
                )
            ];
        else
            return [
                ...this.styles,
                this.createNewUniqueChunk(
                    [
                        `${createSelector(blockId)} {`,
                            ...inputCodeTemplate.map(l => indent(l.replace('%s', val), 1)),
                        '}'
                    ].join('\n'),
                    blockId,
                    blockTreeId,
                )
            ];
    }
    /**
     * @param {styleScopeKind} scopeKind
     * @param {(style: StyleChunk) => boolean} predicate = true
     * @returns {Array<StyleChunk>}
     * @access private
     */
    findStylesWithoutSpecifier(scopeKind, fn = (_style) => true) {
        return this.styles.filter((style) =>
            style.scope.kind === scopeKind && fn(style)
        );
    }
    /**
     * @param {styleScopeKind} scopeKind
     * @param {string} scopeSpecifier
     * @param {(style: StyleChunk) => boolean} predicate = true
     * @returns {Array<StyleChunk>}
     * @access private
     */
    findStylesWithSpecifier(scopeKind, scopeSpecifier, fn = (_style) => true) {
        const lookFor = createSelector(scopeSpecifier, scopeKind);
        return this.styles.filter((style) =>
            style.scope.kind === scopeKind && style.scss.startsWith(lookFor) && fn(style)
        );
    }
    /**
     * @param {styleScopeKind} scopeKind
     * @param {stylesLayer} layer
     * @returns {StyleChunk|null}
     * @access private
     */
    findStyleWithoutSpecifier(scopeKind, layer) {
        return this.styles.find(({scope}) =>
            scope.kind === scopeKind && scope.layer === layer
        ) || null;
    }
    /**
     * @param {styleScopeKind} scopeKind
     * @param {string} scopeSpecifier
     * @param {stylesLayer} layer
     * @returns {StyleChunk|null}
     * @access private
     */
    findStyleWithSpecifier(scopeKind, scopeSpecifier, layer) {
        const lookFor = createSelector(scopeSpecifier, scopeKind);
        return this.styles.find(({scope, scss}) =>
            scope.kind === scopeKind && scope.layer === layer && scss.startsWith(lookFor)
        ) || null;
    }
    /**
     * @param {scssCodeInput} codeTemplate
     * @param {string} val
     * @param {StyleChunk} currentStyle
     * @returns {Array<StyleChunk>}
     * @access private
     */
    doAddOrUpdateScssCodeOfExistingUniqueScopedChunk(codeTemplate, val, currentStyle) {
        return this.styles.map(s => {
            if (s !== currentStyle) return s;

            const updatedScss = addOrUpdateCodeTo(s.scss, codeTemplate, val);

            return {
                ...s,
                scss: updatedScss
            };
        });
    }
    /**
     * @param {scssCodeInput} codeTemplate
     * @param {string} val
     * @param {StyleChunk} currentStyle
     * @returns {Array<StyleChunk>}
     * @access private
     */
    deleteScssCodeFromExistingUniqueScopedChunk(codeTemplate, val, currentStyle) {
        return this.styles.map(s => {
            if (s !== currentStyle) return s;

            const newScss = deleteCodeFrom(s.scss, codeTemplate, val);
            if (!newScss)
                return null;

            return {
                ...s,
                scss: newScss,
            };
        }).filter(s => s !== null);
    }
    /**
     * @param {Array<StyleChunk>} newStylesArr
     * @param {mediaScope|{[key: mediaScope]: any;}} mediaScopeIdOrIds
     * @returns {StylesBundleWithId}
     * @access private
     */
    commitAll(newStylesArr, mediaScopeIdOrIds) {
        this.styles = newStylesArr;

        const compiledNew = stylesToBaked(
            this.styles,
            this.cachedCompiledCss,
            this.currentPageIdPair
        );
        if (compiledNew.length > 1024000) throw new Error('??');

        this.cachedCompiledCss = compiledNew;

        this.stateId += 1;

        return {
            styleChunks: this.styles,
            cachedCompiledCss: this.cachedCompiledCss,
            id: this.stateId,
        };
    }
    /**
     * @param {string} scss
     * @param {string} blockId
     * @param {'main'|string} blockTreeId
     * @param {stylesLayer} layer = 'user-styles'
     * @returns {StyleChunk}
     * @access private
     */
    createNewUniqueChunk(scss, blockId, blockTreeId, layer = 'user-styles') {
        if (this.findStyle('single-block', blockId, 'all', layer))
            throw new Error(`Unique style ${blockId}:${layer} already exist`);
        return {
            scope: {
                kind: 'single-block',
                layer,
                ...(blockTreeId === 'main' ? {page: this.currentPageIdPair} : {}),
            },
            scss,
        };
    }
}

export default ScssWizard;
