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
 * @param {Array<StyleChunk>} styles
 * @param {mediaScope} mediaScopeId
 * @returns {String} '@layer user-styles {\n<compiled>\n}\n@layer dev-styles {\n<compiled>\n}\n'
 */
function stylesToBaked(styles, mediaScopeId) {
    const forThisMedia = styles.filter(({scope}) => scope.media === mediaScopeId);
    if (!forThisMedia.length) return '';
    return [
        '@layer user-styles {\n',
        serialize(compile(
            forThisMedia.filter(({scope}) => scope.block === 'single-block' && scope.layer === 'user-styles').map(({scss}) => scss).join('')
        ), stringify),
        '\n}\n',
        '@layer dev-styles {\n',
        serialize(compile(
            forThisMedia.filter(({scope}) => scope.block === 'single-block' && scope.layer === 'dev-styles').map(({scss}) => scss).join('')
        ), stringify),
        '\n}\n',
    ].join('');
}

/**
 * @param {String} completeScssChunk Example 'line text-align: justify;'
 * @param {String} line1 Example '[data-block="-LjHigIQtxfaaHMhENSo"] {'
 * @returns {String} Example '[data-block="-LjHigIQtxfaaHMhENSo"] {\n  text-align: initial;\n}'
 */
function createScssBlock(completeScssChunk, line1) {
    return [
        line1,
        ...normalizeScss(completeScssChunk).split('\n').map(l => indent(l, 1)),
        '}'
    ].join('\n');
}

/**
 * @param {String} scss
 * @returns {String}
 */
function normalizeScss(scss) {
    if (scss.startsWith('//'))
        return scss;
    const last = scss.at(-1);
    if (last === ';' || last === '}')
        return scss;
    return `${scss};`;
}

const tab = '  ';

/**
 * @param {String} line
 * @param {Number} numTabs
 * @returns {String}
 */
function indent(line, numTabs) {
    return `${tab.repeat(numTabs)}${line}`;
}
/**
 * @param {String} blockIdOrType
 * @param {styleBlockScope} scope = 'single-block'
 * @returns {String}
 * @access public
 */
function createSelector(blockIdOrType, scope = 'single-block') {
    return scope === 'single-block' ? `[data-block="${blockIdOrType}"]` : 'todo';
}

export {
    createCssDeclExtractor,
    createScssBlock,
    createSelector,
    stylesToBaked,
};
