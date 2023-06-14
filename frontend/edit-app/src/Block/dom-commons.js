const CHILDREN_START = ' children-start ';
const CHILDREN_END = ' children-end ';
const CHILD_CONTENT_PLACEHOLDER = '<!-- children-placeholder -->';
const BASE_UNIT_CLS_PREFIX = 'j-bu-';
const VAR_UNIT_CLS_PREFIX = 'j-vu-';

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

export {CHILDREN_START, CHILD_CONTENT_PLACEHOLDER, CHILDREN_END,
        BASE_UNIT_CLS_PREFIX, VAR_UNIT_CLS_PREFIX, noop, HAS_ERRORS,
        NO_OP_QUEUE_EMIT, createTrier};
