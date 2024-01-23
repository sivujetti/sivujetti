import {env, urlUtils} from './web-page-commons-unified.js';
import ScssWizard from './ScssWizard.js';
import Signals from '../shared-includes/Signals.js';
import Translator from './Translator.js';

const editAppSignalsInstance = new Signals;

const editAppTranslatorInstance = new Translator;
const __ = editAppTranslatorInstance.t.bind(editAppTranslatorInstance);

const editAppScssWizardInstance = new ScssWizard;

export {
    __,
    editAppScssWizardInstance,
    editAppSignalsInstance,
    editAppTranslatorInstance,
    env,
    urlUtils,
};