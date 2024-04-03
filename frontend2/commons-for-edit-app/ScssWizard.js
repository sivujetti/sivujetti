import {
    createSelector,
} from './ScssWizardFuncs.js';

const mediaScopes = [
    'all',
    '960', // lg
    '840', // md
    '600', // sm
    '480', // xs
];

class ScssWizard {
    // stateId;
    // styles;
    // compiled;
    /**
     */
    constructor() {
        this.stateId = -1;
    }
    /**
     * Replaces this.styles and this.compiled with $bundle.
     *
     * @param {{userScss: Array<StyleChunk>; compiled: [String, String, String, String, String]: id: Number;}} bundle
     * @access public
     */
    replaceStylesState(bundle) {
        this.styles = [...bundle.userScss];
        this.compiled = bundle.compiled;
        this.stateId = bundle.id;
    }
    /**
     * @returns {Array<StyleChunk>}
     * @access public
     */
    getAllStyles(stateId) {
        if (stateId !== this.stateId)
            throw new Error(`Invalid stateId ${stateId}, expected ${this.stateId}`);
        return this.styles;
    }
    /**
     * @param {'single-block'|'block-type'} blockScope
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
     * @param {mediaScope} mediaScope = 'all'
     * @param {stylesLayer} layer = 'user-styles'
     * @returns {StyleChunk}
     * @access public
     */
    findStyle(blockScope, blockIdOrType, mediaScope = 'all', layer = 'user-styles') {
        const lookFor = createSelector(blockIdOrType, blockScope);
        const found = this.styles.find(({scope, scss}) =>
            scope.block === blockScope && scope.media === mediaScope && scope.layer === layer && scss.startsWith(lookFor)
        );
        return found;
    }
    /**
     * @param {String} scssChunk
     * @param {StyleChunk} currentStyle
     * @param {mediaScope} mediaScope = 'all'
     * @access public
     */
    tryToUpdateUniqueScopeScssChunkAndReturnAllRecompiled(scssChunk, currentStyle, mediaScope = 'all') {
        // todo
    }
     * @param {String} scssChunkToDelete
     * @param {StyleChunk} currentStyle
     * @param {mediaScope} mediaScope = 'all'
     * @access public
     */
    tryToDeleteUniqueScopeScssChunkAndReturnAllRecompiled(scssChunkToDelete, currentStyle, mediaScope = 'all') {
        // todo
    }
    /**
     * @param {String} newScssChunk Examples: 'color: red', 'ul li {\n  flex: 0 0 100%;\n}'
     * @param {String} blockId
     * @param {mediaScope} mediaScope = 'all'
     * @access public
     */
    tryToAddFirstUniqueScopeScssChunkAndReturnAllRecompiled(newScssChunk, blockId, mediaScope = 'all') {
        // todo
    }
    /**
     * @param {String} scssChunkToAdd
     * @param {StyleChunk} currentStyle
     * @param {mediaScope} mediaScope = 'all'
     * @access public
     */
    tryToAddUniqueScopeScssChunkAndReturnAllRecompiled(scssChunkToAdd, currentStyle, mediaScope = 'all') {
        // todo
    }
}

export default ScssWizard;
export {mediaScopes};
