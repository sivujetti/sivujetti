/*
Shared code that get's copied/inlined to both `public/sivujetti-edit-app-main.js`,
`public/sivujetti-commons-for-edit-app.js`, and `public/sivujetti-webpage-renderer-app-main.js`
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
 * @returns {String}
 */
function completeImageSrc(src, urlUtils) {
    if (!src)
        return placeholderImageSrc;
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

export {
    completeImageSrc,
    getNormalizedInitialHoverCandidate,
    getMetaKey,
    placeholderImageSrc,
};
