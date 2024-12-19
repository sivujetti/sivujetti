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

const mainRegistry = new Map;

const api = {
    getPageTypes() { return dataFromBackend.pageTypes; },
    getBlockRenderers() { return dataFromBackend.blockRenderers; },
    getAvailableUpdatePackages() { return dataFromBackend.availableUpdatePackages || []; },
    menuPanel: editAppMainMenuPanelApi,
    blockTypes: editAppBlockTypeRegister,
    export(name, item) {
        mainRegistry.set(name, item);
    },
    import(name) {
        if (name.endsWith('/*'))
            return [...mainRegistry.entries()]
                .reduce((out, [key, val]) =>
                        key.split('/')[0] !== name.split('/')[0] ? out : [...out, val]
                , []);
        return mainRegistry.get(name);
    },
    user: editAppUserApiInstance,
    registerTranslationStrings: editAppTranslatorInstance.addStrings.bind(editAppTranslatorInstance),

    // Intialized in ../edit-app/main.js
    saveButton: {},
    webPagePreview: {
        getEl() { return document.body.querySelector('.site-preview-iframe'); },
    },
    inspectorPanel: {
        getOuterEl() { return document.getElementById('inspector-panel'); },
        setInstance(cmp) { this._instance = cmp; },
        close() { this._instance?.close(); },
    },

    // Initialized in ViewAndContextMenuLayer (../edit-app/main.js)
    contextMenu: {},
    mainPopper: {},
};

export {
    __,
    api,
    editAppBlockTypeRegister as blockTypesRegister,
    editAppEventsInstance as events,
    editAppScssWizardInstance as scssWizard,
    editAppTranslatorInstance as translator,
};
