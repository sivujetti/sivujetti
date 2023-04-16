import {env, validationConstraints} from '@sivujetti-commons-for-edit-app';

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
        if (!u.protocol) return false;
        if (u.host === env.window.location.host) return false;
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
    const noDot = input.indexOf('.') < 0;
    const noColon = input.indexOf(':') < 0;
    if (noDot && noColon) { // treat as local
        return [input.startsWith('/') ? input : `/${input}`, true];
    } else { // treat as external
        return [noColon ? `https://${input}` : input, false];
    }
}

export {urlValidatorImpl, createCanonicalUrl};
