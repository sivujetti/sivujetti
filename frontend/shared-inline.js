/*
Shared code that get's copied/inlined to both `public/sivujetti/sivujetti-edit-app.js`,
`public/sivujetti/sivujetti-commons-for-edit-app.js`, and `public/sivujetti/sivujetti-webpage-renderer-app.js`
by the bundler.
*/

/**
 * @returns {string} 'Meta' if macOS, 'Control' if Windows or anything else todo share 
 */
function getMetaKey() {
    // @ts-ignore Property 'userAgentData' does not exist on type 'Navigator'
    return ((navigator.userAgentData && navigator.userAgentData.platform === 'macOS') ||
            (navigator.platform === 'MacIntel')) ? 'Meta' : 'Control';
}

/**
 * @param {HTMLElement} node
 * @param {HTMLElement & {children: NodeListOf<HTMLElement>;}} root
 * @returns {HTMLElement}
 */
function getNormalizedInitialHoverCandidate(node, root) {
    // `$root > node`
    if (node.parentElement === root)
        return node;
    // `$root > something node`
    const outermost = Array.from(root.children).find(r => r.contains(node));
    if (outermost)
        return outermost;
    // $root doesn't contain $node
    return root;
}

const placeholderImageSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAD6AQMAAAAho+iwAAAABlBMVEX19fUzMzO8wlcyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAIElEQVRoge3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAD8GJhYAATKiH3kAAAAASUVORK5CYII=';

/**
 * @param {string} src
 * @param {any} urlUtils
 * @param {string} fallback = placeholderImageSrc
 * @returns {string}
 */
function completeImageSrc(src, urlUtils, fallback = placeholderImageSrc) {
    if (!src)
        return fallback;
    const isLocal = src.indexOf('/') < 0;
    if (isLocal)
        return urlUtils.makeAssetUrl(`public/uploads/${src}`);
    //
    return (
        // "/local-dir/img.jpg"
        src[0] === '/' ||
        // "https://foo.com/img.jpg"
        src.split(':').length > 1
    ) ? src : `//${src}`;
}

/**
 * @param {Array<Object>} branch
 * @param {(item: Object, i: number, parent: Object|null) => any} fn
 * @param {Object} parent = null
 */
function traverseRecursively(branch, fn, parent = null) {
    branch.forEach((itm, i) => {
        fn(itm, i, parent);
        if (itm.children.length)
            traverseRecursively(itm.children, fn, itm);
    });
}

/**
 * @param {any} obj
 * @returns {any}
 */
function cloneDeep(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * @param {string} blockId
 * @param {number} nthOfId = 1
 * @param {HTMLElement} from = document.body
 * @returns {HTMLElement|null}
 */
function getBlockEl(blockId, nthOfId = 1, from = document.body) {
    if (nthOfId === 1) return from.querySelector(`[data-block="${blockId}"]`);
    /** @type {NodeListOf<HTMLElement>} */
    const all = from.querySelectorAll(`[data-block="${blockId}"]`);
    return all[nthOfId - 1] || null;
}

/**
 * @param {BlockProto} proto
 * @returns {Block}
 */
function toBlock(proto) {
    const out = {...proto};
    for (const {key, value} of proto.propsData)
        out[key] = value;
    return out;
}

export {
    cloneDeep,
    completeImageSrc,
    getBlockEl,
    getMetaKey,
    getNormalizedInitialHoverCandidate,
    placeholderImageSrc,
    toBlock,
    traverseRecursively,
};
