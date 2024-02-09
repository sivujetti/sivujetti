/*
Exports, which commons-for-edit-app/<any>.js can include (since they can't include
directly from '@sivujetti-commons-for-edit-app').
*/
import {http} from './web-page-commons-unified.js';
import {objectUtils, stringUtils, timingUtils} from './utils.js';
import {
    __,
    blockTypesRegister,
    env,
    mainMenuPanelApi,
    scssWizard,
    signals,
    translator,
    urlUtils,
    userApi,
} from './edit-app-singletons.js';
import {
    FormGroup,
    FormGroupInline,
    handleSubmit,
    hasErrors,
    hookForm,
    Input,
    InputError,
    InputErrors,
    reHookValues,
    Textarea,
    unhookForm,
    validateAll,
} from './Form.jsx';
import {sensibleDefaults, validationConstraints} from './constants.js';
import {Icon, iconAsString} from './Icon.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';
import ColorPickerInput from './ColorPickerInput.jsx';
import Tabs from './Tabs.jsx';
import {putToLocalStorage, getFromLocalStorage, getAndPutAndGetToLocalStorage} from './local-storage-utils.js';
import blockTreeUtils from './block/tree-utils.js';
import {writeBlockProps} from './block/utils.js';
import globalData from './globals-temp.js';
import {mediaScopes} from './ScssWizard.js';

const api = {
    menuPanel: mainMenuPanelApi,
    blockTypes: blockTypesRegister,
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
    user: userApi,
    webPageIframe: { // todo
        getEl() {
            return document.body.querySelector('.site-preview-iframe');
        },
        highlightBlock(block) {
            //
        },
        unHighlightBlock(blockId) {
            //
        },
        unHighlightTextBlockChildEl() {
            //
        },
        highlightTextBlockChildEl(elIdx, textBlockId) {
            //
        },
        scrollToBlock() {
            //
        }
    }
};

export {
    __,
    api,
    blockTreeUtils,
    ColorPickerInput,
    createScssTodoname,
    env,
    FormGroup,
    FormGroupInline,
    getAndPutAndGetToLocalStorage,
    getFromLocalStorage,
    globalData,
    handleSubmit,
    hasErrors,
    hookForm,
    http,
    Icon,
    iconAsString,
    Input,
    InputError,
    InputErrors,
    LoadingSpinner,
    mediaScopes,
    objectUtils,
    putToLocalStorage,
    reHookValues,
    scssWizard,
    sensibleDefaults,
    signals,
    stringUtils,
    Tabs,
    Textarea,
    timingUtils,
    translator,
    unhookForm,
    urlUtils,
    validateAll,
    validationConstraints,
    writeBlockProps,
};
