/*
Exports, which commons-for-edit-app/<any>.js can include (since they can't include
directly from '@sivujetti-commons-for-edit-app').
*/
import {http} from './web-page-commons-unified.js';
import {stringUtils, timingUtils} from './utils.js';
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
import ContextMenu from './ContextMenu.jsx';
import {FloatingDialog, currentInstance as floatingDialog} from './FloatingDialog.jsx';
import FileUploader, {placeholderImageSrc} from './FileUploader.jsx';
import {Icon, iconAsString} from './Icon.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';
import UploadButton from './UploadButton.jsx';
import Tabs from './Tabs.jsx';
import {putToLocalStorage, getFromLocalStorage, getAndPutAndGetToLocalStorage} from './local-storage-utils.js';
import blockTreeUtils, {cloneDeep} from './block/tree-utils.js';
import globalData from './globals-temp.js';
import {mediaScopes,} from './ScssWizard.js';
import ScreenSizesVerticalTabs from './ScreenSizesVerticalTabs.jsx';
import setFocusTo from './auto-focusers.js';
import columns2BlockType from './block-types/columns2/columns2.js';
import menuBlockType from './block-types/menu/menu.js';

const sectionRenderers = new Map;

blockTypesRegister.setup([
    ['Columns2',             columns2BlockType],
    ['GlobalBlockReference', {name: 'GlobalBlockReference', friendlyName: 'GlobalBlockReference'}],
    ['Menu',                 menuBlockType],
    ['PageInfo',             {name: 'PageInfo', friendlyName: 'PageInfo'}],
    ['Section',              {name: 'Section', friendlyName: 'Section'}],
]);

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
    createScssTodoname,
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
    scssWizard,
    sensibleDefaults,
    setFocusTo,
    signals,
    stringUtils,
    Tabs,
    Textarea,
    timingUtils,
    translator,
    unhookForm,
    UploadButton,
    urlUtils,
    validateAll,
    validationConstraints,
};
