import {env} from '@sivujetti-commons-for-web-pages';

/**
 * @param {string} value
 * @param {string} key
 */
function putToLocalStorage(value, key) {
    env.window.localStorage[key] = value;
}

/**
 * @returns {string|undefined}
 */
function getFromLocalStorage(key) {
    return env.window.localStorage[key];
}

/**
 * @param {string} value
 * @param {string} key
 * @returns {string}
 */
function getAndPutAndGetToLocalStorage(value, key) {
    const cur = getFromLocalStorage(key);
    if (cur) return cur;

    putToLocalStorage(value, key);
    return getFromLocalStorage(key);
}

export {putToLocalStorage, getFromLocalStorage, getAndPutAndGetToLocalStorage};
