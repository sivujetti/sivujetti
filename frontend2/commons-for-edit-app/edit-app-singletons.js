import Events from '../shared-includes/Events.js';
import BlockTypesRegister from './BlockTypesRegister.js';
import MainMenuPanelApi from './MainMenuPanelApi.js';
import ScssWizard from './ScssWizard.js';
import Translator from './Translator.js';
import {stringUtils} from './utils.js';

const editAppBlockTypeRegister = new BlockTypesRegister;

const editAppEventsInstance = new Events;

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
    getPageTypes() { return dataFromBackend.pageTypes; },
    getBlockRenderers() { return dataFromBackend.blockRenderers; },
    getAvailableUpdatePackages() { return dataFromBackend.availableUpdatePackages || []; },
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
    registerTranslationStrings: editAppTranslatorInstance.addStrings.bind(editAppTranslatorInstance),
    webPagePreview: { // Initialized in ../edit-app/main.js
        initialized: false,
        getEl() { return document.body.querySelector('.site-preview-iframe'); },
        updateCss(/*compiledCss*/) { },
        updateCssFast(/*blockId, scssChunk*/) { },
        highlightBlock(/*block*/) { },
        unHighlightBlock(/*blockId*/) { },
        unHighlightTextBlockChildEl() { },
        scrollToBlock(/*block*/) { },
        scrollToBlockAsync(/*block*/) { },
        highlightTextBlockChildEl(/*elIdx, textBlockBlockId*/) { },
        onReady(/*fn*/) {},
        sendMessageToReRenderer(/*args*/) {},
    },
    contextMenu: { // Initialized in ../edit-app/main.js
        initialized: false,
        open(/*event, links, onClosed*/) { },
        close() { },
    }
};

export {
    __,
    api,
    editAppBlockTypeRegister as blockTypesRegister,
    editAppEventsInstance as events,
    editAppScssWizardInstance as scssWizard,
    editAppTranslatorInstance as translator,
};
