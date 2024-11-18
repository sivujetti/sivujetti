import {urlUtils} from '@sivujetti-commons-for-web-pages';

const {compile, serialize, stringify} = window.stylis;

const scssUtils = {
    /**
     * @param {string} scss
     * @returns {string}
     */
    compileToString(scss) {
        return serialize(compile(scss), stringify);
    },
    /**
     * @param {StyleChunk} chunk
     * @returns {Array<{className: string; lineIdx: number;}>}
     */
    extractClassCssBlocks({scss}) {
        const ast = compile(scss); // [{value: '.header-simple', root: null, parent: null, type: 'rule', props: Array(1), …}
                                   //  {value: '.social-icons', root: null, parent: null, type: 'rule', props: Array(1), …}
                                   //  {value: '>.j-Section2-cols', root: null, parent: {…}, type: 'rule', props: Array(1), …}
                                   //  {value: '.j-Button', root: null, parent: {…}, type: 'rule', props: Array(1), …}]
        return ast
            .filter(node => !node.parent && node.type === 'rule' && node.value.startsWith('.'))
            .map(node => ({className: node.value.substring(1), lineIdx: node.line - 1}));
    },
    /**
     * @param {string} scss
     * @returns {{externals: Array<ImportInfo>; locals: Array<ImportInfo>;}}
     */
    extractImports(scss) {
        const ast = compile(scss);
        const insightsExternals = [];
        const insightsLocals = [];
        ast.forEach(node => {
            // {type: '@import', value: '@import "/public/uploads/OpenSans-Regular.woff?weight=400";' or
            //                          '@import "https://external.io/css2?family=Poppins:smthng";' or
            //                          '@import "https://external.io/css2?family=Poppins:smthng&family=Another+Font:smthng";'}
            if (node.type === '@import') {
                // '@import "/public/uploads/OpenSans-Regular.woff?weight=400";' -> '"/public/uploads/OpenSans-Regular.woff?weight=400";'
                const temp0 = node.value.substring('@import '.length).trimEnd();
                const temp1 = temp0.endsWith(';') ? temp0.slice(0, -1).trimEnd() : temp0;
                const temp2 = temp1.startsWith('url(') && temp1.endsWith(')') ? temp1.slice(4, -1) : temp1;
                if (!temp2.startsWith('"') && !temp2.startsWith('\''))
                    return;
                const urlNoQuotes = temp2.slice(1, -1);
                if (!urlNoQuotes.length)
                    return;
                const completedUrl = completeUrlIfLocal(urlNoQuotes, '');
                if (completedUrl) // is local
                    insightsLocals.push([node, completedUrl]);
                else if (urlNoQuotes.startsWith('http://') || urlNoQuotes.startsWith('https://') && urlNoQuotes.indexOf('.') > -1)
                    insightsExternals.push([node, urlNoQuotes]);
            }
        });

        const out = {
            externals: [],
            locals: [],
        };
        insightsLocals.forEach(([node, url]) => {
            const [path, qtemp] = url.split('?'); // ['/path/public/uploads/opensans-regular-webfont.woff', 'weight=400&name=Open Sans']
            const q = qtemp ? qtemp.trim() : '';
            const fileName = path.split('/').pop();
            const pcs = fileName.split('.');
            const ext = pcs.pop();
            const fileNameNoExt = pcs.join('.');
            const urlobj = q ? new URL(`http://dum.my?${q}`) : null;
            const explicitName = urlobj?.searchParams.get('name') || null;
            const fontWeight = urlobj?.searchParams.get('weight') || null;
            out.locals.push({
                fontFamily: explicitName || fileNameNoExt.replace(/-|_/g, ' '),
                node,
                completedUrl: url,
                fontWeight,
                ext,
            });
        });
        insightsExternals.forEach(([node, url]) => {
            const urlobj = tryToCreateURL(url);
            for (const [pname, pval] of urlobj.searchParams) {
                if (pname !== 'family') continue;
                const fontFamilyFull = pval; // Examples 'Bebas Neue:wght@400'
                                             //          'Josefin Sans:ital,wght@0,100..700;1,100..700'
                                             //          'Montserrat:ital@0;1'
                const family = fontFamilyFull.split(':')[0] || '';
                if (family) out.externals.push({
                    fontFamily: family,
                    node,
                    completedUrl: null,
                    fontWeight: null,
                    ext: null,
                });
            }
        });
        return out;
    }
};

/**
 * @param {string} url
 * @returns {URL|null}
 */
function tryToCreateURL(url) {
    try {
        return new URL(url);
    } catch (_e) {
        return null;
    }
}

/**
 * Example: `public/uploads/foo.png` -> `/my-dir/public/uploads/foo.png`
 *
 * @param {string} urlNormalized `"/foo maybe something`, `'/foo maybe something` or `/foo maybe something`
 * @param {string} s `"`, `'` or ``
 * @returns {string|null} string = completed url, null = wasn't local url
 */
function completeUrlIfLocal(urlNormalized, s) {
    const noQuotes = !s ? urlNormalized : urlNormalized.substring(1, urlNormalized.length - 1);

    if (noQuotes.startsWith('public') || noQuotes.startsWith('/public'))
        // 'public' - > '/foo/public...' or '/public...' or
        // '/public' -> '/foo//public...' or '//public...' and then '/foo//public...' -> '/foo/public...'
        return `${s}${urlUtils.assetBaseUrl}${noQuotes}${s}`.replace('//', '/');

    if (noQuotes.startsWith('uploads') || noQuotes.startsWith('/uploads'))
        // 'uploads'  -> '/foo/public/uploads...' or '/public/uploads...' or
        // '/uploads' -> '/foo/public//uploads...' or '/public//uploads...' and then '/foo/public//uploads' -> '/foo/public/uploads'
        return `${s}${urlUtils.assetBaseUrl}public/${noQuotes}${s}`.replace('//', '/');

    const isLocal = noQuotes.startsWith('/') && !noQuotes.startsWith('//');
    if (isLocal)
        return urlNormalized;

    return null; // must be external
}

/**
 * @typedef {{fontFamily: string; node: StylisAstNode; completedUrl: string|null; fontWeight: string|null; ext: string|null;}} ImportInfo
 */

export default scssUtils;
export {compile, completeUrlIfLocal, serialize, stringify};
