import {env} from '@sivujetti-commons-for-web-pages';

/**
 * @param {string} value
 * @param {string} key
 */
function putToLocalStorage(value, key) {
    env.window.localStorage[key] = value;
}

/**
 * @template T
 * @returns {T|undefined}
 */
function getFromLocalStorage(key) {
    return env.window.localStorage[key];
}

/**
 * @template T
 * @param {string} value
 * @param {string} key
 * @returns {T}
 */
function getAndPutAndGetToLocalStorage(value, key) {
    const cur = getFromLocalStorage(key);
    if (cur) return cur;

    putToLocalStorage(value, key);
    return getFromLocalStorage(key);
}

export {putToLocalStorage, getFromLocalStorage, getAndPutAndGetToLocalStorage};
