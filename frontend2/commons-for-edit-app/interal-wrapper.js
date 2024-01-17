/*
Exports, which commons-for-edit-app/<any>.js can include (since they can't include
directly from '@sivujetti-commons-for-edit-app').
*/
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
import {Icon, iconAsString} from './Icon.jsx';
import blockTypes, {blockTypeGetIconId} from './block-types-map.js';
import blockTreeUtils, {cloneDeep} from './block/tree-utils.js';
import globalData from './globals-temp.js';
import {mediaScopes} from './ScssWizard.js';
import ScreenSizesVerticalTabs from './ScreenSizesVerticalTabs.jsx';

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
    FormGroup,
    FormGroupInline,
    globalData,
    handleSubmit,
    hasErrors,
    hookForm,
    Icon,
    iconAsString,
    Input,
    InputErrors,
    InputError,
    mediaScopes,
    reHookValues,
    ScreenSizesVerticalTabs,
    sensibleDefaults,
    stringUtils,
    Textarea,
    timingUtils,
    unhookForm,
    urlUtils,
    validateAll,
    validationConstraints,
};
