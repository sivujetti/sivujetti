import MainMenuPanelApi from '../edit-app/main-column/MainMenuPanelApi.js';
import Signals from '../shared-includes/Signals.js';
import BlockTypesRegister from './BlockTypesRegister.js';
import ScssWizard from './ScssWizard.js';
import Translator from './Translator.js';
import {env, urlUtils} from './web-page-commons-unified.js';

const editAppBlockTypeRegister = new BlockTypesRegister;

const editAppSignalsInstance = new Signals;

const editAppTranslatorInstance = new Translator;
const __ = editAppTranslatorInstance.t.bind(editAppTranslatorInstance);

const editAppScssWizardInstance = new ScssWizard;

const editAppMainMenuPanelApi =  new MainMenuPanelApi;

export {
    __,
    editAppBlockTypeRegister as blockTypesRegister,
    editAppMainMenuPanelApi as mainMenuPanelApi,
    editAppScssWizardInstance as scssWizard,
    editAppSignalsInstance as signals,
    editAppTranslatorInstance as translator,
    editAppUserApiInstance as userApi,
    env,
    urlUtils,
};
