import {env} from '@sivujetti-commons-for-edit-app';
import {validationConstraints} from './constants.js';

const urlValidatorImpl = {doValidate: (val, hints = {}) => {
    const [allowExternal, allowLocal, allowEmpty] = [
        Object.prototype.hasOwnProperty.call(hints, 'allowExternal') ? hints.allowExternal : true,
        Object.prototype.hasOwnProperty.call(hints, 'allowLocal') ? hints.allowLocal : true,
        Object.prototype.hasOwnProperty.call(hints, 'allowEmpty') ? hints.allowEmpty : false,
    ];
    //
    const [comp, isLocal] = createCanonicalUrl(val);
    if (!comp)
        return !!allowEmpty;
    if (isLocal)
        return !allowLocal ? false : new RegExp(validationConstraints.SLUG_REGEXP).test(comp);
    // External
    if (!allowExternal)
        return false;
    try {
        const u = new URL(comp);
        if (!u.protocol || ['https:', 'http:'].indexOf(u.protocol) < 0) return false;
        if (!u.host || u.host === env.window.location.host) return false;
        return true;
    } catch (e) {
        return false;
    }
}, errorMessageTmpl: '{field} is not valid'};

/**
 * @param {String} input
 * @returns {String}
 */
function createCanonicalUrl(input) {
    if (!input.length)
        return '';
    if (input.indexOf('.') < 0) { // treat as local
        return [input.startsWith('/') ? input : `/${input}`, true];
    } else { // treat as external
        return [input.startsWith('http://') || input.startsWith('https://') ? input : `https://${input}`, false];
    }
}

export {urlValidatorImpl, createCanonicalUrl};
