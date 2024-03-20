import {env} from '@sivujetti-commons-for-web-pages';
import {validationConstraints} from './constants.js';

const urlValidatorImpl = {doValidate: (val, hints = {}) => {
    const [allowExternal, allowLocal, allowEmpty, allowLongLocal] = [
        Object.prototype.hasOwnProperty.call(hints, 'allowExternal') ? hints.allowExternal : true,
        Object.prototype.hasOwnProperty.call(hints, 'allowLocal') ? hints.allowLocal : true,
        Object.prototype.hasOwnProperty.call(hints, 'allowEmpty') ? hints.allowEmpty : false,
        Object.prototype.hasOwnProperty.call(hints, 'allowLongLocal') ? hints.allowLongLocal : true,
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
        if (!u.protocol) return false;
        if (!allowLongLocal && u.host === env.window.location.host) return false;
        return true;
    } catch (e) {
        return false;
    }
}, errorMessageTmpl: '{field} is not valid'};

const mediaUrlValidatorImpl = {doValidate: (val, hints = {}) => {
    if (!val) {
        const allowEmpty = Object.prototype.hasOwnProperty.call(hints, 'allowEmpty') ? hints.allowEmpty : true;
        return allowEmpty;
    }
    const containsDotSlash = val.indexOf('./') > -1;
    return containsDotSlash === false;
}, errorMessageTmpl: '{field} is not valid media url'};

/**
 * @param {String} input
 * @returns {String}
 */
function createCanonicalUrl(input) {
    if (!input.length)
        return '';
    const noDot = input.indexOf('.') < 0;
    const noColon = input.indexOf(':') < 0;
    if (noDot && noColon) { // treat as local
        return [input.startsWith('/') ? input : `/${input}`, true];
    } else { // treat as external
        return [noColon ? `https://${input}` : input, false];
    }
}

export {urlValidatorImpl, mediaUrlValidatorImpl, createCanonicalUrl};
