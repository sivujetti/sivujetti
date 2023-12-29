import Signals from '../what/Signals.js';
import UrlUtils from '../what/UrlUtils.js';
import Http from './Http.js';
import Translator from './Translator.js';

const editAppUrlUtilsInstance = new UrlUtils(window.sivujettiEnvConfig);

// todo move to commons-for-web-pages
const editAppHttpInstance = new Http(undefined, url => url.startsWith('/') && !url.startsWith('//') ? editAppUrlUtilsInstance.makeUrl(url) : url);

const editAppSignalsInstance = new Signals;

const editAppTranslatorInstance = new Translator;
const __ = editAppTranslatorInstance.t.bind(editAppTranslatorInstance);

export {
    __,
    editAppHttpInstance,
    editAppSignalsInstance,
    editAppTranslatorInstance,
    editAppUrlUtilsInstance,
};
