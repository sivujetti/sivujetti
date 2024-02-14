import MainMenuPanelApi from '../edit-app/main-column/MainMenuPanelApi.js';
import Signals from '../shared-includes/Signals.js';
import BlockTypesRegister from './BlockTypesRegister.js';
import ScssWizard from './ScssWizard.js';
import Translator from './Translator.js';
import {stringUtils} from './utils.js';
import {env, urlUtils} from './web-page-commons-unified.js';

const editAppBlockTypeRegister = new BlockTypesRegister;

const editAppSignalsInstance = new Signals;

const editAppTranslatorInstance = new Translator;
const __ = editAppTranslatorInstance.t.bind(editAppTranslatorInstance);

const {userPermissions, userRole} = window.dataFromAdminBackend || {userPermissions: {}, userRole: null};
const editAppUserApiInstance = {
    can(doWhat) { return userPermissions[`can${stringUtils.capitalize(doWhat)}`] === true; },
    getRole() { return userRole; },
    ROLE_SUPER_ADMIN:  1 << 0, // 1
    ROLE_ADMIN:        1 << 1, // 2
    ROLE_ADMIN_EDITOR: 1 << 2, // 4
    ROLE_EDITOR:       1 << 3, // 8
    ROLE_AUTHOR:       1 << 4, // 16
    ROLE_CONTRIBUTOR:  1 << 5, // 32
    ROLE_FOLLOWER:     1 << 6, // 64
};

const editAppScssWizardInstance = new ScssWizard;

const editAppMainMenuPanelApi =  new MainMenuPanelApi;

const api = {
    menuPanel: editAppMainMenuPanelApi,
    blockTypes: editAppBlockTypeRegister,
    inspectorPanel: {
        getOuterEl() { return document.getElementById('inspector-panel'); },
    },
    saveButton: {
        init(saveButtonReactRef) {
            this.saveButtonReactRef = saveButtonReactRef;
        },
        /** @returns {SaveButton} */
        getInstance() {
            return this.saveButtonReactRef.current;
        }
    },
    user: editAppUserApiInstance,
    webPagePreview: { // Will be replaced by sivujetti-edit-app-main.jsx
        getEl() { return document.body.querySelector('.site-preview-iframe'); },
        updateCss(/*allMediaScopesCss*/) { },
        updateCssFast(/*selector, mediaScopeId, cssPropandval*/) { },
        highlightBlock(/*block*/) { },
        unHighlightBlock(/*blockId*/) { },
        unHighlightTextBlockChildEl() { },
        scrollToBlock(/*block*/) { },
        highlightTextBlockChildEl(/*elIdx, textBlockBlockId*/) { },
    }
};

export {
    __,
    api,
    editAppBlockTypeRegister as blockTypesRegister,
    editAppScssWizardInstance as scssWizard,
    editAppSignalsInstance as signals,
    editAppTranslatorInstance as translator,
    env,
    urlUtils,
};
