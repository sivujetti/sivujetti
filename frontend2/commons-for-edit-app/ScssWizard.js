import {mediaScopes} from '../shared-inline.js';
import {
    addOrUpdateCodeTo,
    createScssBlock,
    createSelector,
    deleteCodeFrom,
    extractBlockId,
    extractStyleGroupId,
    indent,
    stylesToBaked,
} from './ScssWizardFuncs.js';
import {generatePushID} from './utils.js';

class ScssWizard {
    // styles;
    // cachedCompiledScreenSizesCss;
    // stateId;
    /**
     */
    constructor() {
        this.stateId = -1;
    }
    /**
     * Replaces this.styles and this.cachedCompiledScreenSizesCss with $bundle.
     *
     * @param {StylesBundleWithId} bundle
     * @access public
     */
    replaceStylesState(bundle) {
        this.styles = [...bundle.styleChunks];
        this.cachedCompiledScreenSizesCss = bundle.cachedCompiledScreenSizesCss;
        this.stateId = bundle.id;
    }
    /**
     * @param {Number} stateId
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
     * @param {String} scopeSpecifier = undefined
     * @param {(style: StyleChunk) => Boolean} predicate = true
     * @returns {Array<StyleChunk>}
     * @access public
     */
    findStyles(scopeKind, scopeSpecifier = undefined, fn = (_style) => true) {
        return scopeSpecifier !== undefined
            ? this.findStylesWithSpecifier(scopeKind, scopeSpecifier, fn)
            : this.findStylesWithoutSpecifier(scopeKind, fn);
    }
    /**
     * @param {String} scopeKind
     * @param {String} scopeSpecifier
     * @param {mediaScope} mediaScopeId = 'all'
     * @param {stylesLayer} layer = 'user-styles'
     * @returns {StyleChunk|null}
     * @access public
     */
    findStyle(scopeKind, scopeSpecifier, mediaScopeId = 'all', layer = 'user-styles') {
        const lookFor = createSelector(scopeSpecifier, scopeKind);
        const found = this.styles.find(({scope, scss}) =>
            scope.kind === scopeKind && scope.media === mediaScopeId && scope.layer === layer && scss.startsWith(lookFor)
        );
        return found || null;
    }
    /**
     * @param {scssCodeInput} codeTemplate Examples 'color: red', 'ul li {\n  flex: 0 0 100%;\n}', [`.icon {`, `  width: %s;`, `  height: %s;`, `}`,]
     * @param {String} val
     * @param {String} blockId
     * @param {mediaScope} mediaScopeId = 'all'
     * @returns {StylesBundleWithId}
     * @access public
     */
    addNewUniqueScopeChunkAndReturnAllRecompiled(codeTemplate, val, blockId, mediaScopeId = 'all') {
        const updated = this.doAddFirstScssChunk(codeTemplate, val, blockId, mediaScopeId);
        return this.commitAll(updated, mediaScopeId);
    }
    /**
     * @param {Array<StyleChunk>} newUniqueScopeChunksToAdd Example [{scope: {kind: 'single-block', layer: 'user-styles', media: 'all'}, scss: '[data-block="abcdefg"] {\n  color: #ab7878;\n}'}]
     * @returns {StylesBundleWithId}
     * @access public
     */
    addManyNewUniqueScopeChunksAndReturnAllRecompiled(newUniqueScopeChunksToAdd) {
        const affectedMediaScopeIds = {};
        for (const {scope, scss} of newUniqueScopeChunksToAdd) {
            const {media, layer} = scope;
            const blockId = extractBlockId(scss);
            if (this.findStyle('single-block', blockId, media, layer, this.styles))
                throw new Error(`Unique style ${blockId}:${media}:${layer} already exist`);
            affectedMediaScopeIds[media] = 1;
        }
        const updated = [
            ...this.styles,
            ...newUniqueScopeChunksToAdd,
        ];
        return this.commitAll(updated, affectedMediaScopeIds);
    }
    /**
     * @param {scssCodeInput} codeTemplate Examples 'color: red;', '> sub-selector {\n  color: red;\n}', [`.icon {`, `  width: %s;`, `  height: %s;`, `}`,]
     * @param {String} val
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
     * @param {scssCodeInput} codeTemplate
     * @param {String} val
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
     * @param {String} initialScssCode Example: '// Your code here ...\ncolor: red;'
     * @param {styleScopeKind} scopeKind
     * @param {String} scopeSpecifier = undefined
     * @param {mediaScope} mediaScopeId = 'all'
     * @returns {StylesBundleWithId}
     * @access public
     */
    addNewDevsScssChunkAndReturnAllRecompiled(initialScssCode, scopeKind, scopeSpecifier = undefined, mediaScopeId = 'all') {
        const updated = [
            ...this.styles,
            (() => {
                if (scopeKind === 'custom-class') return {
                    scope: {kind: 'custom-class', media: mediaScopeId, layer: 'dev-styles'},
                    scss: createScssBlock(initialScssCode, `.my-class {`),
                };
                if (scopeKind === 'single-block') return this.createNewUniqueChunk(
                    createScssBlock(initialScssCode, `${createSelector(scopeSpecifier)} {`),
                    scopeSpecifier,
                    mediaScopeId,
                    'dev-styles'
                );
                return {
                    scope: {kind: 'base', media: mediaScopeId, layer: 'base-styles'},
                    scss: initialScssCode,
                };
            })()
        ];
        return this.commitAll(updated, mediaScopeId);
    }
    /**
     * @param {String} updatedScssCode Example: 'color: blue;'
     * @param {StyleChunk} currentStyle
     * @param {mediaScope} mediaScopeId = 'all'
     * @returns {StylesBundleWithId}
     * @access public
     */
    updateDevsExistingUniqueScopeChunkWithScssChunkAndReturnAllRecompiled(updatedScssCode, currentStyle, mediaScopeId = 'all') {
        const updated = this.styles.map(s =>
            s !== currentStyle ? s : {...s, scss: updatedScssCode}
        );
        return this.commitAll(updated, mediaScopeId);
    }
    /**
     * @param {'add'|'update'|'delete'} addOrUpdateOrDelete
     * @param {scssCodeInput} codeTemplate
     * @param {String} val
     * @param {StyleChunk} currentStyle
     * @param {String} blockId
     * @param {mediaScope} mediaScopeId = 'all'
     * @returns {StylesBundleWithId|null}
     * @access public
     */
    addNewUniqueScopeChunkFromExistingClassScopeChunkAndReturnAllRecompiled(addOrUpdateOrDelete, codeTemplate, val, currentStyle, blockId, mediaScopeId = 'all') {
        if (addOrUpdateOrDelete !== 'update')
            throw new Error('todo');

        // Create scss that has $val updated, removed or added
        const classChunkScss = currentStyle.scss;
        const scss1 = addOrUpdateOrDelete !== 'delete'
            ? addOrUpdateCodeTo(classChunkScss, codeTemplate, val)
            : deleteCodeFrom(classChunkScss, codeTemplate, val);
        if (!scss1) // Was 'delete', and new chunk ended up empty
            return null;
        const scss = scss1.replace(
            `data-style-group="${extractStyleGroupId(scss1)}"`,
            `data-block="${blockId}"`
        );

        // Add new unique scope chunk with updated scss
        const updated = [
            ...this.styles,
            {
                scope: {...currentStyle.scope, kind: 'single-block'},
                scss,
            }
        ];
        return this.commitAll(updated, mediaScopeId);
    }
    /**
     * @param {Array<StyleChunk>} uniqueScopeChunks
     * @param {(blockId: String, newClass: String) => any} onConverted
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
            const s = this.findStyle('single-block', blockId, media, layer, this.styles);
            if (!s) throw new Error(`Failed to locate unique style ${blockId}:${media}:${layer}`);
            styles.push(s);
            styleBlockIds.push(blockId);
            affectedMediaScopeIds[media] = 1;
        }

        // Build {[duplicateScssKey: String]: {newClass: String; newStyle: StyleChunk; converted: Array<{blockId: String; orig: StyleChunk;}>;}}
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
     * @param {String} val
     * @param {String} blockId
     * @param {mediaScope} mediaScopeId
     * @returns {StylesBundleWithId}
     * @access private
     */
    doAddFirstScssChunk(inputCodeTemplate, val, blockId, mediaScopeId) {
        if (!Array.isArray(inputCodeTemplate))
            return [
                ...this.styles,
                this.createNewUniqueChunk(
                    createScssBlock(inputCodeTemplate.replace(/%s/g, val), `${createSelector(blockId)} {`),
                    blockId,
                    mediaScopeId,
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
                    mediaScopeId,
                )
            ];
    }
    /**
     * @param {styleScopeKind} scopeKind
     * @param {(style: StyleChunk) => Boolean} predicate = true
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
     * @param {String} scopeSpecifier
     * @param {(style: StyleChunk) => Boolean} predicate = true
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
     * @param {scssCodeInput} codeTemplate
     * @param {String} val
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
     * @param {String} val
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

        const mediaScopesToUpdate = typeof mediaScopeIdOrIds === 'string' ? {[mediaScopeIdOrIds]: 1} : mediaScopeIdOrIds;
        const compiledNew = mediaScopes.map((scopeId, i) =>
            !mediaScopesToUpdate[scopeId] ? this.cachedCompiledScreenSizesCss[i] : stylesToBaked(this.styles, scopeId)
        );
        compiledNew.forEach(compiledSingleScope => {
            if (compiledSingleScope.length > 1024000) throw new Error('??');
        });
        this.cachedCompiledScreenSizesCss = compiledNew;

        this.stateId += 1;

        return {
            styleChunks: this.styles,
            cachedCompiledScreenSizesCss: this.cachedCompiledScreenSizesCss,
            id: this.stateId,
        };
    }
    /**
     * @param {String} scss
     * @param {String} blockId
     * @param {mediaScope} mediaScopeId
     * @param {stylesLayer} layer = 'user-styles'
     * @returns {StyleChunk}
     * @access private
     */
    createNewUniqueChunk(scss, blockId, mediaScopeId, layer = 'user-styles') {
        if (this.findStyle('single-block', blockId, mediaScopeId, layer, this.styles))
            throw new Error(`Unique style ${blockId}:${mediaScopeId}:${layer} already exist`);
        return {
            scope: {kind: 'single-block', media: mediaScopeId, layer},
            scss,
        };
    }
}

export default ScssWizard;
