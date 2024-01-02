import Signals from '../shared-includes/Signals.js';
import Translator from './Translator.js';

const editAppSignalsInstance = new Signals;

const editAppTranslatorInstance = new Translator;
const __ = editAppTranslatorInstance.t.bind(editAppTranslatorInstance);

export {
    __,
    editAppSignalsInstance,
    editAppTranslatorInstance,
};
