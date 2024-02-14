/*
Shared code that get's copied/inlined to both `public/sivujetti-edit-app-main.js`,
and `public/sivujetti-webpage-renderer-app-main.js` by the bundler.
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

export {getNormalizedInitialHoverCandidate, getMetaKey};
