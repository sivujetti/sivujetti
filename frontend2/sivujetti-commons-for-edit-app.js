/*
An entry point for a global file "public/v2/sivujetti-commons-for-edit-app.js.js" that
can be imported by custom plugins (and the edit app).
*/
import setFocusTo from './commons-for-edit-app/auto-focusers.js';
import BlockDefaultStylesEditForm from './commons-for-edit-app/BlockDefaultStylesEditForm.jsx';
import ContextMenu from './commons-for-edit-app/ContextMenu.jsx';
import FileUploader, {placeholderImageSrc} from './commons-for-edit-app/FileUploader.jsx';
import {FloatingDialog, currentInstance as floatingDialog} from './commons-for-edit-app/FloatingDialog.jsx';
import {MenuSection, MenuSectionAbstract} from './commons-for-edit-app/MenuSection.jsx';
import ScreenSizesVerticalTabs from './commons-for-edit-app/ScreenSizesVerticalTabs.jsx';
import UploadButton from './commons-for-edit-app/UploadButton.jsx';
import {
    isUndoOrRedo,
    objectUtils,
    stringUtils,
    timingUtils,
} from './commons-for-edit-app/utils.js';
import Signals from './shared-includes/Signals.js';
import './commons-for-edit-app/populate-block-types-map.js';

import {
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
    putToLocalStorage,
    reHookValues,
    scssWizard,
    sensibleDefaults,
    signals,
    Tabs,
    Textarea,
    translator,
    unhookForm,
    urlUtils,
    validateAll,
    validationConstraints,
    writeBlockProps,
} from './commons-for-edit-app/internal-wrapper.js';

export {
    __,
    api,
    BlockDefaultStylesEditForm,
    blockTreeUtils,
    ColorPickerInput,
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
    isUndoOrRedo,
    LoadingSpinner,
    mediaScopes,
    objectUtils,
    MenuSection,
    MenuSectionAbstract,
    placeholderImageSrc,
    putToLocalStorage,
    reHookValues,
    ScreenSizesVerticalTabs,
    scssWizard,
    sensibleDefaults,
    setFocusTo,
    signals,
    Signals,
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
    writeBlockProps,
};
