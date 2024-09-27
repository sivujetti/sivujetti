
/**
 * Calls $fn once every $tryEveryMillis until it returns true or $stopTryingAfterNTimes
 * is reached.
 *
 * @param {() => boolean} fn
 * @param {number} tryEveryMillis = 200
 * @param {number} stopTryingAfterNTimes = 5
 * @param {string} messageTmpl = 'fn() did not return true after %sms'
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
            else if (messageTmpl.length)
                window.console.error(messageTmpl.replace('%s', tries * tryEveryMillis));
        } else {
            throw new Error('fn must return true or false, got: ', ret);
        }
    };
    return callTryFn;
}

/**
 * @param {string} path
 * @param {string} fallback = '/'
 * @returns {string} 'foo/' -> '/foo'
 */
function pathToFullSlug(path, fallback = '/') {
    return path !== '/'
        ? `/${path.substring(0, path.length - 1)}` // 'foo/' -> '/foo'
        : fallback;
}

/**
 * https://stackoverflow.com/a/11409978
 *
 * @param {number} number
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(number, min, max) {
    return Math.max(min, Math.min(number, max));
}

export {
    clamp,
    createTrier,
    pathToFullSlug
};
