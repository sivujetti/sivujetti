import {env, urlUtils} from '@sivujetti-commons-for-web-pages';
import ScssWizard from '../shared-includes/ScssWizard.js';
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
