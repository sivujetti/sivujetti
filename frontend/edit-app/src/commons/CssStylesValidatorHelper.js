import {__, urlUtils} from '@sivujetti-commons-for-edit-app';

class CssStylesValidatorHelper {
    /**
     * @param {String} input
     * @param {(input: String) => String} completeInput
     * @param {String} previousCommittedValue
     * @param {Boolean} allowImports = false
     * @returns {Array<Boolean|{generatedCss: String|null; error: String;}>}
     * @access public
     */
    validateAndCompileScss(input, completeInput, previousCommittedValue, allowImports = false) {
        // Empty input -> commit only if previousCommittedValue is not ''
        if (input.length < 3)
            return [previousCommittedValue ? true : false, {generatedCss: null, error: ''}];

        const ast = window.stylis.compile(completeInput(input));
        const [hasDecls, hasImports] = ast.reduce((out, node) =>
            [
                out[0] ? out[0] : node.type === 'rule' && node.children.length,
                out[1] ? out[1] : node.type === '@import',
            ]
        , [false, false]);

        // Had non-empty input, but css doesn't contain any rules -> do not commit
        if (!hasDecls)
            return [false, {generatedCss: null, error: __('Styles must contain at least one CSS-rule')}];

        if (hasImports && !allowImports)
            return [false, {generatedCss: null, error: __('Only root styles may contain @imports')}];

        // Separate '@import's from $ast
        const [hoisted, ast2] = !hasImports ? ['', ast] : hoistImports(ast);

        // Mutate $ast2
        completeBgUrls(ast2);

        const combined = hoisted + window.stylis.serialize(ast2, window.stylis.stringify);

        // Had non-empty input, and css does contain rules -> commit changes to the store
        return [true, {generatedCss: combined,
                       error: ''}];

    }
}

/**
 * @param {Array<StylisAstNode>} ast
 * @returns {[String, Array<Object>]}
 */
function hoistImports(ast) {
    const imports = []; // Array<[String, String]>
    const notImports = [];
    ast.forEach(node => {
        // {type: '@import', value: '@import "/public/uploads/OpenSans-Regular.woff?weight=400";' or
        //                          '@import "https://api.fonts.coollabs.io/css2?family=Poppins:wght@400;800&display=swap";'}
        if (node.type === '@import') {
            // '@import "/public/uploads/OpenSans-Regular.woff?weight=400";' -> '"/public/uploads/OpenSans-Regular.woff?weight=400";'
            const temp1 = node.value.substring('@import '.length).trimEnd();
            if (!temp1.startsWith('"') && !temp1.startsWith('\''))
                return;
            const temp2 = temp1.endsWith(';') ? temp1.substring(0, temp1.length - 1).trimEnd() : temp1;
            // '"/public/...?weight=400"' -> '/public/...?weight=400'
            const urlNoQuotes = temp2.substring(1, temp2.length - 1);
            imports.push([node.value, urlNoQuotes]);
        } else notImports.push(node);
    });

    const compiled = imports.map(([value, url1]) => {
        const completed = completeUrlIfLocal(url1, '');
        //
        if (completed) {
            const [path, qtemp] = completed.split('?'); // ['/path/public/uploads/opensans-regular-webfont.woff', 'weight=400&name=Open Sans']
            const q = qtemp ? qtemp.trim() : '';
            const fileName = path.split('/').pop();
            const pcs = fileName.split('.');
            const ext = pcs.pop();
            const fileNameNoExt = pcs.join('.');
            const urlobj = q ? new URL(`http://dum.my?${q}`) : null;
            const explicitName = q ? (urlobj.searchParams.get('name') || '') : '';
            const fontWeight = q ? (urlobj.searchParams.get('weight') || '') : '';
            return [
                '@font-face{',
                    'font-family:"', explicitName || fileNameNoExt.replace(/-|_/g, ' '), '";',
                    'src:url("', completed, '") format("', ext, '");',
                    'font-weight:', fontWeight || '400', ';',
                    'font-style:normal;',
                '}',
            ].join('');
        }
        return value;
    });

    return [compiled.join('') + '/* hoisted decls ends */', notImports];
}

/**
 * Mutates {value} of every local 'background|background-image: url()' item in $mutAst.
 *
 * @param {Array<StylisAstNode>} mutAst
 */
function completeBgUrls(mutAst) {
    traverse(mutAst, node => {
        if (!(node.type === 'decl' &&
            (node.props === 'background' || node.props === 'background-image')))
            return;
        const at = node.value.indexOf('url(');
        if (at < 0)
            return;

        const noFn = node.value.slice(at + 'url('.length); // ` "/foo") maybe something;`
        const noWhite = noFn.trimLeft(); // ` "/foo") maybe something;` -> `"/foo") maybe something;`
        const wsLen = noFn.length - noWhite.length;
        const s1 = noFn[wsLen];
        const s = s1 === '"' || s1 === '\'' ? s1 : '';

        const completed = completeUrlIfLocal(noWhite, s);
        if (completed) node.value = node.value.replace(`url(${noFn}`, `url(${completed}`);
    });
}

/**
 * Example: `public/uploads/foo.png` -> `/my-dir/public/uploads/foo.png`
 *
 * @param {String} urlNormalized `"/foo maybe something`, `'/foo maybe something` or `/foo maybe something`
 * @param {String} s `"`, `'` or ``
 * @returns {String|null} String = completed url, null = wasn't local url
 */
function completeUrlIfLocal(urlNormalized, s) {
    const isLocal1 = urlNormalized.startsWith(`${s}/`) && !urlNormalized.startsWith(`${s}//`); // `"/foo`, `'/foo` or `/foo`
    const isLocal2 = !isLocal1 && urlNormalized.startsWith(`${s}public/`); // `"public/`, `'public/` or `public/`
    if (!isLocal1 && !isLocal2)
        return null;

    if (!urlNormalized.startsWith(`${s}${urlUtils.assetBaseUrl}`))
        return `${s}${urlUtils.assetBaseUrl}${urlNormalized.substring(s.length)}`.replace('//', '/');

    return null;
}

/**
 * @param {Array<{children: String|Array<Object>} & {[key: String]: any;}>} arr
 * @param {(Object) => void} fn
 */
function traverse(arr, fn) {
    for (const item of arr) {
        fn(item);
        if (typeof item.children !== 'string' && item.children.length)
            traverse(item.children, fn);
    }
}

export default CssStylesValidatorHelper;
