/*
Exports, which commons-for-edit-app/<any>.js can include (since they can't include
directly from '@sivujetti-commons-for-edit-app').
*/
import {http} from './web-page-commons-unified.js';
import {
    __,
    env,
    editAppScssWizardInstance,
    editAppSignalsInstance,
    editAppTranslatorInstance,
    editAppUserApiInstance,
    stringUtils,
    timingUtils,
    urlUtils,
} from './edit-app-singletons.js';
import {
    FormGroup,
    FormGroupInline,
    handleSubmit,
    hasErrors,
    hookForm,
    Input,
    InputErrors,
    InputError,
    reHookValues,
    Textarea,
    unhookForm,
    validateAll,
} from './Form.jsx';
import {sensibleDefaults, validationConstraints} from './constants.js';
import ContextMenu from './ContextMenu.jsx';
import {FloatingDialog, currentInstance as floatingDialog} from './FloatingDialog.jsx';
import FileUploader, {placeholderImageSrc} from './FileUploader.jsx';
import {Icon, iconAsString} from './Icon.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';
import UploadButton from './UploadButton.jsx';
import Tabs from './Tabs.jsx';
import {putToLocalStorage, getFromLocalStorage, getAndPutAndGetToLocalStorage} from './local-storage-utils.js';
import editAppBlockTypeMap, {blockTypeGetIconId} from './block-types-map.js';
import blockTreeUtils, {cloneDeep} from './block/tree-utils.js';
import globalData from './globals-temp.js';
import {mediaScopes} from './ScssWizard.js';
import ScreenSizesVerticalTabs from './ScreenSizesVerticalTabs.jsx';
import setFocusTo from './auto-focusers.js';

const api = {
    blockTypes,
    blockTypeGetIconId,
    inspectorPanel: {
        getEl() { return document.getElementById('inspector-panel'); },
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
    webPageIframe: { // todo
        getEl() {
            return document.body.querySelector('.site-preview-iframe.active');
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
    cloneDeep,
    ContextMenu,
    editAppScssWizardInstance,
    editAppSignalsInstance,
    editAppTranslatorInstance,
    env,
    FileUploader,
    floatingDialog,
    FloatingDialog,
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
    placeholderImageSrc,
    putToLocalStorage,
    reHookValues,
    ScreenSizesVerticalTabs,
    sensibleDefaults,
    setFocusTo,
    stringUtils,
    Tabs,
    Textarea,
    timingUtils,
    unhookForm,
    UploadButton,
    urlUtils,
    validateAll,
    validationConstraints,
};
