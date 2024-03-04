import {
    createSelector,
} from './ScssWizardFuncs.js';
const {compile, serialize, stringify} = window.stylis;

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
}

export default ScssWizard;
