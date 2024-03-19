import {env, urlUtils} from '@sivujetti-commons-for-web-pages';
import Signals from '../shared-includes/Signals.js';
import BlockTypesRegister from './BlockTypesRegister.js';
import MainMenuPanelApi from './MainMenuPanelApi.js';
import ScssWizard from './ScssWizard.js';
import Translator from './Translator.js';
import {stringUtils} from './utils.js';

const editAppBlockTypeRegister = new BlockTypesRegister;

const editAppSignalsInstance = new Signals;

const editAppTranslatorInstance = new Translator;
const __ = editAppTranslatorInstance.t.bind(editAppTranslatorInstance);

const dataFromBackend = window.dataFromAdminBackend || {};
const {userPermissions, userRole} = dataFromBackend || {userPermissions: {}, userRole: null};
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

const editAppMainMenuPanelApi = new MainMenuPanelApi;

const api = {
    getPageTypes: () => dataFromBackend.pageTypes,
    menuPanel: editAppMainMenuPanelApi,
    blockTypes: editAppBlockTypeRegister,
    inspectorPanel: {
        getOuterEl() { return document.getElementById('inspector-panel'); },
        setInstance(cmp) { this._instance = cmp; },
        close() { this._instance?.close(); },
    },
    saveButton: {
        setInstance(cmp) { this._instance = cmp; },
        getInstance() { return this._instance; }
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
        onReady(/*fn*/) {},
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
