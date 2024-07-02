/*
Shared code that get's copied/inlined to both `public/sivujetti/sivujetti-edit-app.js`,
`public/sivujetti/sivujetti-commons-for-edit-app.js`, and `public/sivujetti/sivujetti-webpage-renderer-app.js`
by the bundler.
*/

/**
 * @returns {String} 'Meta' if macOS, 'Control' if Windows or anything else todo share 
 */
function getMetaKey() {
    return ((navigator.userAgentData && navigator.userAgentData.platform === 'macOS') ||
            (navigator.platform === 'MacIntel')) ? 'Meta' : 'Control';
}

/**
 * @param {HTMLElement} node
 * @param {HTMLElement} root
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
 * @param {String} src
 * @param {urlUtils} urlUtils
 * @param {String} fallback = placeholderImageSrc
 * @returns {String}
 */
function completeImageSrc(src, urlUtils, fallback = placeholderImageSrc) {
    if (!src)
        return fallback;
    const isLocal = src.indexOf("/") < 0;
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
 * @param {(item: Object, i: Number, parent: Object|null) => any} fn
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
 * @param {String} blockId
 * @param {HTMLElement} from = document.body
 * @returns {HTMLElement|null}
 */
function getBlockEl(blockId, from = document.body) {
    return from.querySelector(`[data-block="${blockId}"]`);
}

const mediaScopes = [
    'all',
    '960', // lg
    '840', // md
    '600', // sm
    '480', // xs
];

export {
    cloneDeep,
    completeImageSrc,
    getBlockEl,
    getMetaKey,
    getNormalizedInitialHoverCandidate,
    mediaScopes,
    placeholderImageSrc,
    traverseRecursively,
};
