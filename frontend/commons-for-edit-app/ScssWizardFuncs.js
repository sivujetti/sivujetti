import scssUtils, {compile, serialize, stringify} from './styles/scss-utils.js';

/**
 * @param {string} scss
 * @returns {{extractVal(prop: string, scope?: string): StylisAstNode|null; getAst(): Array<StylisAstNode>;}}
 */
function createCssDeclExtractor(scss) {
    const ast = compile(scss);
    const rootScope = ast[0]?.type === 'rule' ? ast[0].value : ''; // Example: '[data-block="<id>"]' or ''
    return {
        /**
         * @param {string} prop
         * @param {string=} scope = rootScope
         * @param {string=} propTmpl = null
         * @returns {StylisAstNode|null}
         */
        extractVal(prop, scope = rootScope, propTmpl = null) {
            scope = scope.replace('&:', '&\f:');
            const [declNode, _parentNode] = findRecursively(ast, (node, parentNode) =>
                parentNode &&
                node.type === 'decl' &&
                node.props === prop &&
                parentNode.value === scope
            );
            const cand1 = declNode ? declNode.children : null;

            if (cand1 && propTmpl) {
                const c1 = compile(`.dum{${propTmpl.replace('%s', '20483750912843')}}`);
                const c2 = c1[0].children[0].children.split('20483750912843').join('¨');
                const c3 = c2.replace('¨', '¨'.repeat((cand1.length - c2.length) + 1));
                // Example: cand1 is now 'minmax(0, 1rem) minmax(0, 1fr)'
                //          f3    is now 'minmax(0, ¨¨¨¨) minmax(0, 1fr)'
                const out = cand1.slice(c3.indexOf('¨'), c3.lastIndexOf('¨') + 1);
                return out;
            }

            return cand1;

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
 * @param {Array<StyleChunk>} styles
 * @param {string} cachedCompiledCss
 * @param {string} pageIdPair
 * @returns {[string, string|null]}
 */
function stylesToBaked(styles, cachedCompiledCss, pageIdPair) {
    if (!styles.length) return ['', null];

    const {hoisted, base, userGlobal, userPageScoped, dev} = styles.reduce((out, s) => {
        const {scope} = s;
        if (scope.layer === 'base-styles' && scope.kind === 'base-freeform') {
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
        if (scope.layer === 'user-styles' && scope.kind === 'single-block')
            return !scope.page
                ? {...out, userGlobal: [...out.userGlobal, s]}
                : {...out, userPageScoped: [...out.userPageScoped, s]};
        if (scope.layer === 'dev-styles')
            return {...out, dev: [...out.dev, s]};
        return out;
    }, {base: [], userGlobal: [], userPageScoped: [], dev: [], hoisted: []});

    const NO_CSS = '/* - */';

    const userGlobalCss = userGlobal.length
        ? serialize(compile(userGlobal.map(({scss}) => scss).join('')), stringify)
        : NO_CSS;
    const currentPageCss = userPageScoped.length
        ? serialize(compile(userPageScoped.map(({scss}) => scss).join('')), stringify)
        : null;
    const updateCurrentPageCss = createCompiledPageScopedLinesUpdateFn(cachedCompiledCss, pageIdPair);
    const userPageCss = updateCurrentPageCss(currentPageCss)?.filter(line => line !== NO_CSS).join('\n') || NO_CSS;

    const [devCss, error] = validateAndCompileDevStyles(dev);
    if (error) return ['', error];

    return [[
        ...(hoisted.length ? hoisted : ['']),
        '@layer base-styles {\n',
            serialize(compile(base.map(({scss}) => scss).join('')), stringify),
        '\n}\n',
        '@layer user-styles {\n',
            '/* == global-scoped:start */\n',
            userGlobalCss, '\n',
            '/* == global-scoped:end */\n',
            '/* == page-scoped:start */\n',
            userPageCss, '\n',
            '/* == page-scoped:end */\n',
        '}\n',
        '@layer dev-styles {\n',
            devCss, '\n',
        '}\n',
    ].join(''), null];
}

/**
 * @param {Array<StyleChunk>} styles
 * @returns {[string, string|null]}
 */
function validateAndCompileDevStyles(styles) {
    const earlyError = styles.reduce((out, {scss}) =>
        /^\.cc-[0-9]+ \{\r?\n/.test(scss)
            ? out
            : [...out, `dev chunk's first line must match \`.cc-<n>\` ( (was \`${scss.split('\n')[0]}\`)`]
    , []).join(', ');
    return !earlyError
        ? [serialize(compile(styles.map(({scss}) => scss).join('')), stringify), null]
        : ['', earlyError];
}

/**
 * @param {string} currentCachedCompiledCss
 * @param {string} pageIdPair
 * @returns {(newCssForThisPage: string|null) => Array<string>|null}
 */
function createCompiledPageScopedLinesUpdateFn(currentCachedCompiledCss, pageIdPair) {
    const prevLines = getPageScopedLines(currentCachedCompiledCss.split('\n'));
    const posBefore = prevLines.indexOf(`/* page:${pageIdPair} */`) + 1;

    // Found line pair, return a function that replaces the previous line with the new one
    if (posBefore > 0)
        return newCssForThisPage => {
            if (!newCssForThisPage) {
                prevLines.splice(posBefore - 1, 2);
                return prevLines;
            }
            return prevLines.map((l, i) => i !== posBefore ? l : newCssForThisPage);
        };
    // Didn't find, return a function that adds the new to the end of page scoped lines
    else
        return newCssForThisPage => {
            if (!newCssForThisPage)
                return prevLines;
            return [...prevLines, `/* page:${pageIdPair} */`, newCssForThisPage];
        };
}

/**
 * @param {Array<string>} linesAll
 * @returns {Array<string>}
 */
function getPageScopedLines(linesAll) {
    const idxFrom = linesAll.indexOf('/* == page-scoped:start */') + 1;
    const idxTo = linesAll.indexOf('/* == page-scoped:end */');
    return linesAll.slice(idxFrom, idxTo);
}

/**
 * @param {string} completeScssChunk Example 'line text-align: justify;'
 * @param {string} line1 Example '[data-block="-LjHigIQtxfaaHMhENSo"] {'
 * @returns {string} Example '[data-block="-LjHigIQtxfaaHMhENSo"] {\n  text-align: initial;\n}'
 */
function createScssBlock(completeScssChunk, line1) {
    return [
        line1,
        ...normalizeScss(completeScssChunk).split('\n').map(l => indent(l, 1)),
        '}'
    ].join('\n');
}

/**
 * @param {string} scss
 * @returns {string}
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
 * @param {string} line
 * @param {number} numTabs
 * @returns {string}
 */
function indent(line, numTabs) {
    return `${tab.repeat(numTabs)}${line}`;
}

/**
 * @param {string} scss
 */
function createScssInspectorInternal(scss) {
    const ast = compile(scss);
    return {
        /**
         * @param {string} declName Example 'color', 'grid-template-columns'
         * @returns {StylisAstNode|null}
         */
        findNodeByDeclName(declName) {
            return findRecursively(ast, node =>
                node.type === 'decl' && node.props === declName
            );
        },
        /**
         * @param {string} declName Example 'color', 'grid-template-columns'
         * @param {string} scope Example 'ul li', 'ul li a:hover'
         * @returns {StylisAstNode|null}
         */
        findNodeByDeclNameFromScope(declName, scope) {
            return findRecursively(ast, (node, parentNode) =>
                parentNode && node.type === 'decl' && node.props === declName && parentNode.value === scope
            );
        },
        /**
         * @param {(node: StylisAstNode, parentNode: StylisAstNode) => any} fn
         * @returns {[StylisAstNode|null, StylisAstNode|null]} [node, parentNode]
         */
        findNode(fn) {
            return findRecursively(ast, fn);
        },
        /**
         * @param {(node: StylisAstNode, parentNode: StylisAstNode) => any} fn
         * @returns {Array<[StylisAstNode|null, StylisAstNode|null]>} [ [node, parentNode], ... ]
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
 * @param {StylisAstNode|null} parentNode = null
 * @returns {[StylisAstNode|null, StylisAstNode|null]} [node, parentNode]
 */
function findRecursively(ast, fn, parentNode = null) {
    for (const node of ast) {
        if (Array.isArray(node.children) && node.children.length) {
            const fromC = findRecursively(node.children, fn, node);
            if (fromC[0]) return fromC;
        }
        const found = fn(node, parentNode);
        if (found) return [node, parentNode];
    }
    return [null, null];
}

/**
 * @param {Array<StylisAstNode>} ast
 * @param {(node: StylisAstNode, parentNode: StylisAstNode) => any} fn
 * @param {StylisAstNode|null} parentNode = null
 * @returns {Array<[StylisAstNode|null, StylisAstNode|null]>} [ [node, parentNode], ... ]
 */
function filterRecursively(ast, fn, parentNode = null) {
    const out = [];
    for (const node of ast) {
        const inc = fn(node, parentNode);

        let c = null;
        if (Array.isArray(node.children) && node.children.length) {
            const fromC = filterRecursively(node.children, fn, node);
            if (fromC.length) c = fromC;
        }

        if (inc)
            out.push([node, parentNode]);

        if (c) out.push(...c);
    }
    return out;
}

/**
 * @param {StylisAstNode|null} declsParentAstNode
 * @param {StylisAstInspector} cur
 * @returns {string}
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
 * @param {string} scopeSpecifier
 * @param {styleScopeKind} scopeKind = 'single-block'
 * @returns {string}
 * @access public
 */
function createSelector(scopeSpecifier, scopeKind = 'single-block') {
    if (scopeKind === 'single-block')
        return `[data-block="${scopeSpecifier}"]`;
    return scopeKind === 'base-vars' ? ':root' : '// invalid';
}

/**
 * @param {Array<string>} lines
 * @returns {number}
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
 * @param {string} scssTo
 * @param {string} codeTemplate
 * @param {any} val
 * @returns {string}
 */
function addOrUpdateCodeTo(scssTo, codeTemplate, val) {
    const incoming1 = Array.isArray(codeTemplate) ? codeTemplate.join('\n') : codeTemplate;
    const incoming = incoming1.replace(/%s/g, val);
    const linesIncoming = incoming.split('\n');
    const decls = createScssInspectorInternal(incoming).findNodes((node, _parentNode) => {
        return node.type === 'decl';
    });

    let inspector = createScssInspectorInternal(scssTo);
    let lines = scssTo.split('\n');
    decls.forEach(([fromInc, fromIncParent]) => {
        // name of the decl we're adding or updating, 'column-gap' for example
        const declName = fromInc.props;

        // find it from current scssTo
        const containingCssBlockSel = getSelectorForDecl(fromIncParent, inspector);
        const [toUpdate, _toUpdateParent] = inspector.findNode((node, parentNode) =>
            parentNode &&
            (node.type === 'decl' && node.props === declName) &&
            (parentNode.type === 'rule' && parentNode.value === containingCssBlockSel)
        );

        const newLine = indent(linesIncoming[fromInc.line - 1], 1);
        if (toUpdate) { // update it
            lines[toUpdate.line - 1] = newLine;
        } else { // add
            if (!fromIncParent) { // root level decl, add to the beginning
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
 * @param {string} scssFrom
 * @param {string} codeTemplate
 * @param {any} val
 * @returns {string}
 */
function deleteCodeFrom(scssFrom, codeTemplate, val) {
    const incoming1 = Array.isArray(codeTemplate) ? codeTemplate.join('\n') : codeTemplate;
    const incoming = incoming1.replace(/%s/g, val);
    const decls = createScssInspectorInternal(incoming).findNodes((node, _parentNode) => {
        return node.type === 'decl';
    });

    let inspector = createScssInspectorInternal(scssFrom);
    let lines = scssFrom.split('\n');
    decls.forEach(([fromDel, fromDelParent]) => {
        // name of the decl we're deleting 'column-gap' for example
        const declName = fromDel.props;

        // find it from current scssFrom
        const containingCssBlockSel = getSelectorForDecl(fromDelParent, inspector);
        const [nodeToDelete, _toDeleteParent] = inspector.findNode((node, parentNode) =>
            parentNode &&
            (node.type === 'decl' && node.props === declName) &&
            (parentNode.type === 'rule' && parentNode.value === containingCssBlockSel)
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
 * @param {string} uniqChunkScss
 * @returns {string}
 */
function extractBlockId(uniqChunkScss) {
    return uniqChunkScss.split('data-block="')[1].split('"')[0];
}

/**
 * @param {string} scss
 * @returns {[Array<string>, Array<number>]}
 */
function hoistImportsIfAny(scss) {
    const {locals, externals} = scssUtils.extractImports(scss);

    const hoistedLines = [];
    const lineIndices = [];
    // @imports first
    for (const {node} of externals) {
        hoistedLines.push(node.value);
        lineIndices.push(node.line - 1);
    }
    // @font-faces second
    for (const {fontFamily, completedUrl, ext, fontWeight, node} of locals) {
        hoistedLines.push([
            '@font-face{',
                'font-family:"', fontFamily, '";',
                'src:url("', completedUrl, '") format("', ext, '");',
                'font-weight:', fontWeight || '400', ';',
                'font-style:normal;',
            '}',
        ].join(''));
        lineIndices.push(node.line - 1);
    }

    return [
        hoistedLines,
        lineIndices,
    ];
}

/**
 * @param {Array<StyleChunk>} chunksAll
 * @returns {() => number}
 */
function createChunkIdGenerator(chunksAll) {
    let max = chunksAll.reduce((max, c) => c.id > max ? c.id : max, 0);
    return () => {
        max += 1;
        return max;
    };
}

export {
    addOrUpdateCodeTo,
    createChunkIdGenerator,
    createCssDeclExtractor,
    createScssBlock,
    createSelector,
    deleteCodeFrom,
    extractBlockId,
    indent,
    stylesToBaked,
};
