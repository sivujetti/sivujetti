import {
    addOrUpdateCodeTo,
    createChunkIdGenerator,
    createReorderedStyles,
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
    // createChunkId;
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
        this.createChunkId = createChunkIdGenerator(this.styles);
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
     * @param {(style: StyleChunk) => boolean} fn = true
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
     * @param {stylesLayer} layer = 'user-styles'
     * @returns {StyleChunk|null}
     * @access public
     */
    findStyle(scopeKind, scopeSpecifier, layer = 'user-styles') {
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
        return this.tryToCommitAll(updated)[0];
    }
    /**
     * @param {Array<StyleChunkWithoutId>} chunksToAdd
     * @returns {StylesBundleWithId}
     * @access public
     */
    addManyNewChunksAndReturnAllRecompiled(chunksToAdd) {
        for (const {scope, scss} of chunksToAdd) {
            if (scope.kind !== 'single-block') continue;
            const {layer} = scope;
            const blockId = extractBlockId(scss);
            if (this.findStyle('single-block', blockId, layer))
                throw new Error(`Unique style ${blockId}:${layer} already exist`);
        }
        const updated = [
            ...this.styles,
            ...chunksToAdd.map(c => ({...c, id: this.createChunkId()})),
        ];
        return this.tryToCommitAll(updated)[0];
    }
    /**
     * @param {scssCodeInput} codeTemplate Examples 'color: red;', '> sub-selector {\n  color: red;\n}', [`.icon {`, `  width: %s;`, `  height: %s;`, `}`,]
     * @param {string} val
     * @param {StyleChunk} currentStyle
     * @returns {StylesBundleWithId}
     * @access public
     */
    addOrUpdateScssCodeToExistingUniqueScopeChunkAndReturnAllRecompiled(codeTemplate, val, currentStyle) {
        const updated = this.doAddOrUpdateScssCodeOfExistingUniqueScopedChunk(codeTemplate, val, currentStyle);
        return this.tryToCommitAll(updated)[0];
    }
    /**
     * @param {scssCodeInput} newScss
     * @param {StyleChunk} currentStyle
     * @returns {StylesBundleWithId}
     * @access public
     */
    replaceUniqueScopeChunkAndReturnAllRecompiled(newScss, currentStyle) {
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
        return this.tryToCommitAll(updated)[0];
    }
    /**
     * @param {StyleChunk} chunkToDelete
     * @returns {StylesBundleWithId}
     * @access public
     */
    deleteStyleChunkAndReturnAllRecompiled(chunkToDelete) {
        const updated = this.styles.filter(s => s !== chunkToDelete);
        return this.tryToCommitAll(updated)[0];
    }
    /**
     * @param {scssCodeInput} codeTemplate
     * @param {string} val
     * @param {StyleChunk} currentStyle
     * @returns {StylesBundleWithId}
     * @access public
     */
    deleteScssCodeFromExistingUniqueScopeChunkAndReturnAllRecompiled(codeTemplate, val, currentStyle) {
        const updated = this.deleteScssCodeFromExistingUniqueScopedChunk(codeTemplate, val, currentStyle);
        return this.tryToCommitAll(updated)[0];
    }
    /**
     * @param {string} initialScssCode Example: '  // Your code here ...\n  color: red;'
     * @param {styleScopeKind} scopeKind
     * @param {CustomClassStyleChunkData} data
     * @param {StyleChunk} after = null
     * @returns {StylesBundleWithId}
     * @access public
     */
    addNewDevsScssChunkAndReturnAllRecompiled(initialScssCode, scopeKind, data, after = null) {
        const newStyle = {
            scope: scopeKind === 'custom-class'
                ? {kind: 'custom-class', layer: 'dev-styles'}
                : {kind: 'base-freeform', layer: 'base-styles'},
            scss: initialScssCode,
            data,
            id: this.createChunkId(),
        };
        const updated = [...this.styles];
        updated.splice(!after ? updated.length : this.styles.indexOf(after) + 1, 0, newStyle);
        return this.tryToCommitAll(updated)[0];
    }
    /**
     * @param {{scss?: string; data?: CustomClassStyleChunkData;}} changes Example: {scss: 'color: blue;'}
     * @param {StyleChunk} currentStyle
     * @returns {[StylesBundleWithId|null, string|null]}
     * @access public
     */
    updateDevsExistingChunkWithScssChunkAndReturnAllRecompiled(changes, currentStyle) {
        const updated = this.styles.map(s =>
            s !== currentStyle ? s : {...s, ...changes}
        );
        return this.tryToCommitAll(updated);
    }
    /**
     * 
     * @param {Array<number>} newOrderedIds
     * @returns {[StylesBundleWithId|null, string|null]}
     */
    reorderDevsExistingChunksAndReturnAllRecompiled(newOrderedIds) {
        const updated = createReorderedStyles(this.styles, newOrderedIds);
        return this.tryToCommitAll(updated);
    }
    /**
     * @param {scssCodeInput} inputCodeTemplate
     * @param {string} val
     * @param {string} blockId
     * @param {'main'|string} blockTreeId
     * @returns {Array<StyleChunk>}
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
     * @param {(style: StyleChunk) => boolean} fn = true
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
     * @param {(style: StyleChunk) => boolean} fn = true
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
     * @returns {[StylesBundleWithId|null, string|null]}
     * @access private
     */
    tryToCommitAll(newStylesArr) {
        const [compiledNew, error] = stylesToBaked(
            newStylesArr,
            this.cachedCompiledCss,
            this.currentPageIdPair
        );
        if (compiledNew.length > 2048000)
            return [null, 'compiled css over 2MB'];
        if (error)
            return [null, error];

        this.styles = newStylesArr;
        this.cachedCompiledCss = compiledNew;

        this.stateId += 1;

        return [{
            styleChunks: this.styles,
            cachedCompiledCss: this.cachedCompiledCss,
            id: this.stateId,
        }, error];
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
        if (this.findStyle('single-block', blockId, layer))
            throw new Error(`Unique style ${blockId}:${layer} already exist`);
        return {
            scope: {
                kind: 'single-block',
                layer,
                ...(blockTreeId === 'main' ? {page: this.currentPageIdPair} : {}),
            },
            scss,
            id: this.createChunkId(),
        };
    }
}

export default ScssWizard;
