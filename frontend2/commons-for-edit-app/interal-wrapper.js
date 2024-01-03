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
import {Icon, iconAsString} from './Icon.jsx';
import blockTypes, {blockTypeGetIconId} from './block-types-map.js';
import blockTreeUtils, {cloneDeep} from './block/tree-utils.js';
import {stringUtils, timingUtils} from './utils.js';

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
        getInstance() {
            return this.saveButtonReactRef.current;
        }
    },
    user: editAppUserApiInstance,
    webPageIframe: { // todo
        getEl() {
            document.body.querySelector('#site-preview-iframe');
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
    editAppScssWizardInstance,
    editAppSignalsInstance,
    editAppTranslatorInstance,
    env,
    FormGroup,
    FormGroupInline,
    handleSubmit,
    hasErrors,
    hookForm,
    Icon,
    iconAsString,
    Input,
    InputErrors,
    InputError,
    reHookValues,
    stringUtils,
    Textarea,
    timingUtils,
    unhookForm,
    urlUtils,
    validateAll,
};
