const CHILDREN_START = ' children-start ';
const CHILDREN_END = ' children-end ';
const CHILD_CONTENT_PLACEHOLDER = '<!-- children-placeholder -->';

const HAS_ERRORS = 1 << 1;
const NO_OP_QUEUE_EMIT = 1 << 2;

function noop() {
    //
}

/**
 * Calls $fn once every $tryEveryMillis until it returns true or $stopTryingAfterNTimes
 * is reached.
 *
 * @param {() => Boolean} fn
 * @param {Number} tryEveryMillis = 200
 * @param {Number} stopTryingAfterNTimes = 5
 * @param {String} messageTmpl = 'fn() did not return true after %sms'
 * @returns {fn() => void}
 */
function createTrier(fn,
                     tryEveryMillis = 200,
                     stopTryingAfterNTimes = 5,
                     messageTmpl = 'fn() did not return true after %sms') {
    let tries = 0;
    const callTryFn = () => {
        const ret = fn();
        if (ret === true) {
            return;
        }
        if (ret === false) {
            if (++tries < stopTryingAfterNTimes)
                setTimeout(callTryFn, tryEveryMillis);
            else
                window.console.error(messageTmpl.replace('%s', tries * tryEveryMillis));
        } else {
            throw new Error('fn must return true or false, got: ', ret);
        }
    };
    return callTryFn;
}

/**
 * @returns {String} 'Meta' if macOS, 'Control' if Windows or anything else
 */
function getMetaKey() {
    return ((navigator.userAgentData && navigator.userAgentData.platform === 'macOS') ||
            (navigator.platform === 'MacIntel')) ? 'Meta' : 'Control';
}
// ## 
// ## /**
// ##  * @param {RawBlock} block
// ##  * @returns {Boolean}
// ##  */
// ## function isMetaBlock({type}) {
// ##     return type === 'PageInfo';
// ## }

/**
 * @param {String} blockId
 * @param {HTMLElement} from = document.body
 * @returns {HTMLElement|null}
 */
function getBlockEl(blockId, from = document.body) {
    return from.querySelector(`[data-block="${blockId}"]`);
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

export {CHILDREN_START, CHILD_CONTENT_PLACEHOLDER, CHILDREN_END,
        noop, HAS_ERRORS, NO_OP_QUEUE_EMIT, createTrier, getMetaKey, isMetaBlock,
        getBlockEl, getNormalizedInitialHoverCandidate};
