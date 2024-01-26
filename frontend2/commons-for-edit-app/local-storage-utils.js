import {env} from './internal-wrapper.js';

/**
 * @param {String} value
 * @param {String} key
 */
function putToLocalStorage(value, key) {
    env.window.localStorage[key] = value;
}

/**
 * @returns {String|undefined}
 */
function getFromLocalStorage(key) {
    return env.window.localStorage[key];
}

/**
 * @param {String} value
 * @param {String} key
 * @returns {String}
 */
function getAndPutAndGetToLocalStorage(value, key) {
    const cur = getFromLocalStorage(key);
    if (cur) return cur;

    putToLocalStorage(value, key);
    return getFromLocalStorage(key);
}

export {putToLocalStorage, getFromLocalStorage, getAndPutAndGetToLocalStorage};
