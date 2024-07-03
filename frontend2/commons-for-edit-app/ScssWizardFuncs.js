import scssUtils, {compile, serialize, stringify} from './styles/scss-utils';

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
            scope = scope.replace('&:', '&\f:');
            const [declNode, _parenNode] = findRecursively(ast, (node, parenNode) =>
                parenNode &&
                node.type === 'decl' &&
                node.props === prop &&
                parenNode.value === scope
            );
            return declNode ? declNode.children : null;
        }
    };
}

/**
 * @param {Array<StyleChunk>} styles
 * @param {mediaScope} mediaScopeId
 * @returns {String} '@import "maybeExternalImport";@font-face {<maybeLocalImport>}@layer base-styles {\n<compiled>\n}\n@layer user-styles {\n<compiled>\n}\n@layer dev-styles {\n<compiled>\n}\n'
 */
function stylesToBaked(styles, mediaScopeId) {
    const forThisMedia = styles.filter(({scope}) => scope.media === mediaScopeId);
    if (!forThisMedia.length) return '';
    const {hoisted, base, user, dev} = forThisMedia.reduce((out, s) => {
        const {scope} = s;
        if (scope.layer === 'base-styles' && scope.kind === 'base') {
            const [hoistedLines, hoistedLineIdxes] = hoistImportsIfAny(s.scss);
            if (hoistedLines.length) return {
                ...out,
                ...{
                    base: [...out.base, {...s, scss: s.scss.split('\n').filter((_line, i) =>
                        hoistedLineIdxes.indexOf(i) < 0
                    ).join('\n')}],
                    hoisted: [...out.hoisted, ...hoistedLines],
                }
            }; // else fall through
        }
        if (scope.layer === 'base-styles')
            return {...out, base: [...out.base, s]};
        if (scope.layer === 'user-styles' && (scope.kind === 'single-block' || scope.kind === 'style-group'))
            return {...out, user: [...out.user, s]};
        if (scope.layer === 'dev-styles')
            return {...out, dev: [...out.dev, s]};
        return out;
    }, {base: [], user: [], dev: [], hoisted: []});

    return [
        ...(hoisted.length ? hoisted : ['']),
        '@layer base-styles {\n',
        serialize(compile(base.map(({scss}) => scss).join('')), stringify),
        '\n}\n',
        '@layer user-styles {\n',
        serialize(compile(user.map(({scss}) => scss).join('')), stringify),
        '\n}\n',
        '@layer dev-styles {\n',
        serialize(compile(dev.map(({scss}) => scss).join('')), stringify),
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
         * @returns {[StylisAstNode|null, StylisAstNode|null]} [node, parenNode]
         */
        findNode(fn) {
            return findRecursively(ast, fn);
        },
        /**
         * @param {(node: StylisAstNode, parentNode: StylisAstNode) => any} fn
         * @returns {Array<[StylisAstNode|null, StylisAstNode|null]>} [ [node, parenNode], ... ]
         */
        findNodes(fn) {
            return filterRecursively(ast, fn);
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
 * @param {Array<StylisAstNode>} ast
 * @param {(node: StylisAstNode, parentNode: StylisAstNode) => any} fn
 * @param {StylisAstNode|null} parenNode = null
 * @returns {Array<[StylisAstNode|null, StylisAstNode|null]>} [ [node, parentNode], ... ]
 */
function filterRecursively(ast, fn, parenNode = null) {
    const out = [];
    for (const node of ast) {
        const inc = fn(node, parenNode);

        let c = null;
        if (Array.isArray(node.children) && node.children.length) {
            const fromC = filterRecursively(node.children, fn, node);
            if (fromC.length) c = fromC;
        }

        if (inc)
            out.push([node, parenNode]);

        if (c) out.push(...c);
    }
    return out;
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
 * @param {String} scopeSpecifier
 * @param {styleScopeKind} scopeKind = 'single-block'
 * @returns {String}
 * @access public
 */
function createSelector(scopeSpecifier, scopeKind = 'single-block') {
    if (scopeKind === 'single-block')
        return `[data-block="${scopeSpecifier}"]`;
    if (scopeKind === 'style-group')
        return `[data-style-group="${scopeSpecifier}"]`;
    return scopeKind === 'base' ? ':root' : '// invalid';
}

/**
 * @param {Array<String>} lines
 * @returns {Number}
 */
function findEmptyBlockClosingTagIndex(lines) {
    for (let l = lines.length; --l > -1; ) {
        const line = lines[l];
        if (line.trim() === '}') {
            const prev = lines[l - 1];
            if (prev.trimEnd().at(-1) === '{') return l;
        }
    }
    return -1;
}

/**
 * @param {String} scssTo
 * @param {String} codeTemplate
 * @param {any} val
 * @returns {String}
 */
function addOrUpdateCodeTo(scssTo, codeTemplate, val) {
    const incoming1 = Array.isArray(codeTemplate) ? codeTemplate.join('\n') : codeTemplate;
    const incoming = incoming1.replace(/%s/g, val);
    const linesIncoming = incoming.split('\n');
    const decls = createScssInspectorInternal(incoming).findNodes((node, _parenNode) => {
        return node.type === 'decl';
    });

    let inspector = createScssInspectorInternal(scssTo);
    let lines = scssTo.split('\n');
    decls.forEach(([fromInc, fromIncParen]) => {
        // name of the decl we're adding or updating, 'column-gap' for example
        const declName = fromInc.props;

        // find it from current scssTo
        const containingCssBlockSel = getSelectorForDecl(fromIncParen, inspector);
        const [toUpdate, _toUpdateParen] = inspector.findNode((node, parenNode) =>
            parenNode &&
            (node.type === 'decl' && node.props === declName) &&
            (parenNode.type === 'rule' && parenNode.value === containingCssBlockSel)
        );

        const newLine = indent(linesIncoming[fromInc.line - 1], 1);
        if (toUpdate) { // update it
            lines[toUpdate.line - 1] = newLine;
        } else { // add
            if (!fromIncParen) { // root level decl, add to the beginning
                lines.splice(1, 0, newLine);
            } else { // inner block's decl
                const targetScope = inspector.getAst().find((n, i) =>
                    i > 0 && // skip root
                    n.parent && n.type === 'rule' && n.value === containingCssBlockSel
                );

                // inner scope (css block) exist, add to the beginning
                if (targetScope)
                    lines.splice(targetScope.children[0].line - 1, 0, newLine);
                // scope doesn't exist, add to the end of root
                else
                    lines.splice(lines.length - 1, 0,
                        indent(`${containingCssBlockSel} {`, 1),
                        newLine,
                        indent('}', 1),
                    );
            }
        }

        // update inspector, since inspector.getAst()[*].line may have changed
        inspector = createScssInspectorInternal(lines.join('\n'));
    });

    return lines.join('\n');
}

const EMPTY_LINE = '^::empty::^';

/**
 * @param {String} scssFrom
 * @param {String} codeTemplate
 * @param {any} val
 * @returns {String}
 */
function deleteCodeFrom(scssFrom, codeTemplate, val) {
    const incoming1 = Array.isArray(codeTemplate) ? codeTemplate.join('\n') : codeTemplate;
    const incoming = incoming1.replace(/%s/g, val);
    const decls = createScssInspectorInternal(incoming).findNodes((node, _parenNode) => {
        return node.type === 'decl';
    });

    let inspector = createScssInspectorInternal(scssFrom);
    let lines = scssFrom.split('\n');
    decls.forEach(([fromDel, fromDelParen]) => {
        // name of the decl we're deleting 'column-gap' for example
        const declName = fromDel.props;

        // find it from current scssFrom
        const containingCssBlockSel = getSelectorForDecl(fromDelParen, inspector);
        const [nodeToDelete, _toDeleteParen] = inspector.findNode((node, parenNode) =>
            parenNode &&
            (node.type === 'decl' && node.props === declName) &&
            (parenNode.type === 'rule' && parenNode.value === containingCssBlockSel)
        );
        if (!nodeToDelete)
            throw new Error(`Expected "${scssFrom}" to contain "${declName}"`);

        // mark it as deleted
        const deleteLineAt = nodeToDelete.line - 1;
        lines[deleteLineAt] = EMPTY_LINE;
    });

    // ['.foo {', '^::empty::^', '}'] -> ['.foo {', '}']
    const withoutEmptyLines = arr => arr.filter(line => line !== EMPTY_LINE);
    lines = withoutEmptyLines(lines);

    // ['.foo {', '}', ...] -> [...]
    let emptyBlockCloseTagIdx = findEmptyBlockClosingTagIndex(lines);
    while (emptyBlockCloseTagIdx > 0 && lines.length) {
        lines[emptyBlockCloseTagIdx] = EMPTY_LINE;
        lines[emptyBlockCloseTagIdx - 1] = EMPTY_LINE;
        lines = withoutEmptyLines(lines);
        emptyBlockCloseTagIdx = findEmptyBlockClosingTagIndex(lines);
    }

    // No rules left ( ['[data-block=\"u585XQVD\"] {', '}'] )
    if (!lines.length)
        return null;

    return lines.join('\n');
}

/**
 * @param {String} uniqChunkScss
 * @returns {String}
 */
function extractBlockId(uniqChunkScss) {
    return uniqChunkScss.split('data-block="')[1].split('"')[0];
}

/**
 * @param {String} classChunkScss
 * @returns {String}
 */
function extractStyleGroupId(classChunkScss) {
    return classChunkScss.split('data-style-group="')[1].split('"')[0];
}

/**
 * @param {string} scss
 * @returns {[Array<string>, Array<number>]}
 */
function hoistImportsIfAny(scss) {
    const insights = scssUtils.extractImports(scss);

    const hoistedLines = insights.reduce((out, insi) =>
        !insi.completedUrl
            // External (@import ...) -> insert at the start
            ? [insi.node.value, ...out]
            // Local (@font-face ...) -> append to the end
            : [...out, [
                '@font-face{',
                    'font-family:"', insi.fontFamily, '";',
                    'src:url("', insi.completedUrl, '") format("', insi.ext, '");',
                    'font-weight:', insi.fontWeight || '400', ';',
                    'font-style:normal;',
                '}',
            ].join('')]
    , []);

    return [
        hoistedLines,
        insights.map(({node}) => node.line - 1)
    ];
}

export {
    addOrUpdateCodeTo,
    compile,
    createCssDeclExtractor,
    createScssBlock,
    createSelector,
    deleteCodeFrom,
    extractBlockId,
    extractStyleGroupId,
    indent,
    stylesToBaked,
};
