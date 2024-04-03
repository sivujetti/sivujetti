const {compile, serialize, stringify} = window.stylis;

/**
 * @param {String} scss
 * @returns {{extractVal(prop: String, scope?: String): StylisAstNode|null;}}
 */
function createCssDeclExtractor(scss) {
    const ast = compile(scss);
    const rootScope = ast[0]?.type === 'rule' ? ast[0].value : ''; // Example: '[data-block="<id>"]' or ''
    return {
        /**
         * @param {String} prop
         * @param {String=} scope = rootScope
         * @returns {StylisAstNode|null}
         */
        extractVal(prop, scope = rootScope) {
            // todo
        }
    };
}
/**
 * @param {String} blockIdOrType
 * @param {'single-block'|'block-type'} scope = 'single-block'
 * @returns {String}
 * @access public
 */
function createSelector(blockIdOrType, scope = 'single-block') {
    return scope === 'single-block' ? `[data-block="${blockIdOrType}"]` : 'todo';
}

export {
    createCssDeclExtractor,
    createSelector,
};
