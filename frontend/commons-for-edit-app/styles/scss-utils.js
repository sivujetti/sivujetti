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
     * @returns {Array<{fontFamily: string; node: StylisAstNode; completedUrl: string|null; fontWeight: string|null; ext: string|null;}>}
     */
    extractImports(scss) {
        const ast = compile(scss);
        const insights = [];

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
                if (!urlNoQuotes.length)
                    return;
                const completedUrl = completeUrlIfLocal(urlNoQuotes, '');
                if (completedUrl) // is local
                    insights.push([node, completedUrl]);
                else if (urlNoQuotes.startsWith('http://') || urlNoQuotes.startsWith('https://') && urlNoQuotes.indexOf('.') > -1) {
                    try {
                        const urlobj = new URL(urlNoQuotes);
                        insights.push([node, urlobj]);
                    } catch (_e) {
                        // Don't call insights.push()
                    }
                }
            }
        });
        return insights.map(([node, url]) => {
            if (typeof url === 'string') {
                const [path, qtemp] = url.split('?'); // ['/path/public/uploads/opensans-regular-webfont.woff', 'weight=400&name=Open Sans']
                const q = qtemp ? qtemp.trim() : '';
                const fileName = path.split('/').pop();
                const pcs = fileName.split('.');
                const ext = pcs.pop();
                const fileNameNoExt = pcs.join('.');
                const urlobj = q ? new URL(`http://dum.my?${q}`) : null;
                const explicitName = q ? (urlobj.searchParams.get('name') || null) : null;
                const fontWeight = q ? (urlobj.searchParams.get('weight') || null) : null;
                return {
                    fontFamily: explicitName || fileNameNoExt.replace(/-|_/g, ' '),
                    node,
                    completedUrl: url,
                    fontWeight,
                    ext,
                };
            }
            const urlobj = url; // "https://api.fonts.coollabs.io/css2?family=Bebas+Neue:wght@400&display=swap"
            const fontFamilyFull = urlobj.searchParams.get('family'); // Example 'Bebas Neue:wght@400'
            const family = fontFamilyFull?.split(':')[0] || '';
            return {
                fontFamily: family,
                node,
                completedUrl: null,
                fontWeight: null,
                ext: null,
            };
        });
    }
};

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

export default scssUtils;
export {compile, completeUrlIfLocal, serialize, stringify};
