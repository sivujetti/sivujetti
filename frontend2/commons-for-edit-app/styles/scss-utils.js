import {urlUtils} from '@sivujetti-commons-for-web-pages';

const {compile, serialize, stringify} = window.stylis;

const scssUtils = {
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
                insights.push([node, urlNoQuotes]);
            }
        });

        return insights.map(([node, url1]) => {
            const completedUrl = completeUrlIfLocal(url1, '');
            //
            if (completedUrl) {
                const [path, qtemp] = completedUrl.split('?'); // ['/path/public/uploads/opensans-regular-webfont.woff', 'weight=400&name=Open Sans']
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
                    completedUrl,
                    fontWeight,
                    ext,
                };
            }
            const urlobj = new URL(url1); // "https://api.fonts.coollabs.io/css2?family=Bebas+Neue:wght@400&display=swap"
            const fontFamilyFull = urlobj.searchParams.get('family'); // Example 'Bebas Neue:wght@400'
            const family = fontFamilyFull.split(':')[0];
            return {
                fontFamily: family,
                node,
                completedUrl,
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
    const isLocal1 = urlNormalized.startsWith(`${s}/`) && !urlNormalized.startsWith(`${s}//`); // `"/foo`, `'/foo` or `/foo`
    const isLocal2 = !isLocal1 && urlNormalized.startsWith(`${s}public/`); // `"public/`, `'public/` or `public/`
    if (!isLocal1 && !isLocal2)
        return null;

    if (!urlNormalized.startsWith(`${s}${urlUtils.assetBaseUrl}`))
        return `${s}${urlUtils.assetBaseUrl}${urlNormalized.substring(s.length)}`.replace('//', '/');

    return null;
}

export default scssUtils;
export {compile, serialize, stringify};
