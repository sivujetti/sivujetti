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
 * @param {String} scss
 */
function createScssInspectorInternal(scss) {
    const ast = compile(scss);
    return {
        /**
         * @param {String} declName Example 'color', 'grid-template-columns'
         * @returns {StylisAstNode|null}
         */
        findNodeByDeclName(declName) {
            return findRecursively(ast, node =>
                node.type === 'decl' && node.props === declName
            );
        },
        /**
         * @param {String} declName Example 'color', 'grid-template-columns'
         * @param {String} scope Example 'ul li', 'ul li a:hover'
         * @returns {StylisAstNode|null}
         */
        findNodeByDeclNameFromScope(declName, scope) {
            return findRecursively(ast, (node, parenNode) =>
                parenNode && node.type === 'decl' && (/*log('p',`${parenNode.value} === ${selector1}`,parenNode.value === selector1), */node.props === declName && parenNode.value === scope)
            );
        },
        /**
         * @param {(node: StylisAstNode, parentNode: StylisAstNode) => any} fn
         * @returns {StylisAstNode|null}
         */
        findNode(fn) {
            return findRecursively(ast, fn);
        },
        /**
         * @returns {Array<StylisAstNode>}
         */
        getAst() {
            return ast;
        }
    };
}

/**
 * @param {Array<StylisAstNode>} ast
 * @param {(node: StylisAstNode, parentNode: StylisAstNode) => any} fn
 * @param {StylisAstNode|null} parenNode = null
 * @returns {[StylisAstNode|null, StylisAstNode|null]} [node, parentNode]
 */
function findRecursively(ast, fn, parenNode = null) {
    for (const node of ast) {
        if (Array.isArray(node.children) && node.children.length) {
            const fromC = findRecursively(node.children, fn, node);
            if (fromC[0]) return fromC;
        }
        const found = fn(node, parenNode);
        if (found) return [node, parenNode];
    }
    return [null, null];
}

/**
 * @param {StylisAstNode|null} declsParentAstNode
 * @param {StylisAstInspector} cur
 * @returns {String}
 */
function getSelectorForDecl(declsParentAstNode, cur) {
    if (declsParentAstNode && typeof declsParentAstNode.value === 'string' && declsParentAstNode.value[0] === ' ') {
        window.console.error('########');
        window.console.error('leading space',declsParentAstNode.value);
        window.console.error('########');
        }
    return declsParentAstNode
        ? declsParentAstNode.value // Example 'ul', 'ul li', 'ul li a:hover', '>.j-Section2-cols>:nth-of-type(2)'
        : cur.getAst()[0].value;   // '[data-block="<id>"]'
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
    createScssInspectorInternal,
    createSelector,
    getSelectorForDecl,
    stylesToBaked,
};
