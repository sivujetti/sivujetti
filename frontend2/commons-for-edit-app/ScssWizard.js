import {
    createScssBlock,
    createSelector,
    stylesToBaked,
} from './ScssWizardFuncs.js';


class ScssWizard {
    // styles;
    // compiled;
    // stateId;
    /**
     */
    constructor() {
        this.stateId = -1;
    }
    /**
     * Replaces this.styles and this.compiled with $bundle.
     *
     * @param {StylesBundleWithId} bundle
     * @access public
     */
    replaceStylesState(bundle) {
        this.styles = [...bundle.userScss];
        this.compiled = bundle.compiled;
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
     * @param {styleBlockScope} blockScope
     * @param {String} blockIdOrType
     * @param {(style: StyleChunk) => Boolean} predicate = true
     * @returns {Array<StyleChunk>}
     * @access public
     */
    findStyles(blockScope, blockIdOrType, fn = (_style) => true) {
        const lookFor = createSelector(blockIdOrType, blockScope);
        return this.styles.filter((style) =>
            style.scope.block === blockScope && style.scss.startsWith(lookFor) && fn(style)
        );
    }
    /**
     * @param {String} blockScope
     * @param {String} blockIdOrType
     * @param {mediaScope} mediaScopeId = 'all'
     * @param {stylesLayer} layer = 'user-styles'
     * @returns {StyleChunk}
     * @access public
     */
    findStyle(blockScope, blockIdOrType, mediaScopeId = 'all', layer = 'user-styles') {
        const lookFor = createSelector(blockIdOrType, blockScope);
        const found = this.styles.find(({scope, scss}) =>
            scope.block === blockScope && scope.media === mediaScopeId && scope.layer === layer && scss.startsWith(lookFor)
        );
        return found;
    }
    /**
     * @param {String} scssChunk
     * @param {StyleChunk} currentStyle
     * @param {mediaScope} mediaScopeId = 'all'
     * @returns {StylesBundleWithId}
     * @access public
     */
    tryToUpdateUniqueScopeScssChunkAndReturnAllRecompiled(scssChunk, currentStyle, mediaScopeId = 'all') {
        // todo
    }
     * @param {String} scssChunkToDelete
     * @param {StyleChunk} currentStyle
     * @param {mediaScope} mediaScopeId = 'all'
     * @returns {StylesBundleWithId}
     * @access public
     */
    tryToDeleteUniqueScopeScssChunkAndReturnAllRecompiled(scssChunkToDelete, currentStyle, mediaScopeId = 'all') {
        // todo
    }
    /**
     * @param {String} newScssChunk Examples: 'color: red', 'ul li {\n  flex: 0 0 100%;\n}'
     * @param {String} blockId
     * @param {mediaScope} mediaScopeId = 'all'
     * @returns {StylesBundleWithId}
     * @access public
     */
    tryToAddFirstUniqueScopeScssChunkAndReturnAllRecompiled(newScssChunk, blockId, mediaScopeId = 'all') {
        return this.doTryToAddFirstScssChunkAndReturnAllRecompiled(newScssChunk, blockId, mediaScopeId, 'user-styles');
    }
    /**
     * @param {String} scssChunkToAdd
     * @param {StyleChunk} currentStyle
     * @param {mediaScope} mediaScopeId = 'all'
     * @returns {StylesBundleWithId}
     * @access public
     */
    tryToAddUniqueScopeScssChunkAndReturnAllRecompiled(scssChunkToAdd, currentStyle, mediaScopeId = 'all') {
        // todo
    /**
     * @param {String} completeScssChunk
     * @param {String} blockId
     * @param {mediaScope} mediaScopeId
     * @param {stylesLayer} layer
     * @returns {StylesBundleWithId}
     * @access private
     */
    doTryToAddFirstScssChunkAndReturnAllRecompiled(completeScssChunk, blockId, mediaScopeId, layer) {
        if (this.findStyle('single-block', blockId, mediaScopeId, layer))
            throw new Error(`Unique style ${blockId}:${mediaScopeId}:${layer} already exist`);

        const updated = [...this.styles];
        updated.push({
            scope: {block: 'single-block', media: mediaScopeId, layer},
            scss: createScssBlock(completeScssChunk, `${createSelector(blockId)} {`),
        });

        return this.commitAll(updated, mediaScopeId);
    }
    /**
     * @param {Array<StyleChunk>} newStylesArr
     * @param {mediaScope} mediaScopeId
     * @returns {StylesBundleWithId}
     * @access private
     */
    commitAll(newStylesArr, mediaScopeId) {

        this.styles = newStylesArr;

        const compiledNew = mediaScopes.map((scopeId, i) =>
            scopeId !== mediaScopeId ? this.compiled[i] : stylesToBaked(this.styles, scopeId)
        );
        compiledNew.forEach(mediaScope => {
            if (mediaScope.length > 256000) throw new Error('??');
        });
        this.compiled = compiledNew;

        this.stateId += 1;

        //
        return {
            userScss: this.styles,
            compiled: this.compiled,
            id: this.stateId,
        };
    }
}

export default ScssWizard;
