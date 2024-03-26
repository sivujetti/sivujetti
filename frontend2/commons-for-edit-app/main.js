/*
An entry point for a global file "public/sivujetti/sivujetti-commons-for-edit-app.js" that
can be imported by custom plugins (and the edit app).
*/
import {env, http, urlUtils} from '@sivujetti-commons-for-web-pages';
import setFocusTo from './auto-focusers.js';
import BlockDefaultStylesEditForm from './BlockDefaultStylesEditForm.jsx';
import ContextMenu from './ContextMenu.jsx';
import FileUploader from './FileUploader.jsx';
import {FloatingDialog, currentInstance as floatingDialog} from './FloatingDialog.jsx';
import {MenuSection, MenuSectionAbstract} from './MenuSection.jsx';
import ScreenSizesVerticalTabs from './ScreenSizesVerticalTabs.jsx';
import UploadButton from './UploadButton.jsx';
import {
    generatePushID,
    isUndoOrRedo,
    objectUtils,
    stringUtils,
    timingUtils,
} from './utils.js';
import Signals from '../shared-includes/Signals.js';
import './populate-block-types-map.js';
import {makePath, makeSlug} from './local-url-utils.js';
import {
    __,
    api,
    scssWizard,
    signals,
    translator,
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
import {
    createScssTodoname,
    mediaScopes,
} from './ScssWizard.js';
import {
    determineModeFrom,
    determineModeFromPreview,
    doubleNormalizeUrl,
    getVisibleSlug,
} from './pick-url-utils.js';
import {placeholderImageSrc, traverseRecursively} from '../shared-inline.js';
import Popup from './Popup.jsx';

export {
    __,
    api,
    BlockDefaultStylesEditForm,
    blockTreeUtils,
    ColorPickerInput,
    ContextMenu,
    createScssTodoname,
    determineModeFrom,
    determineModeFromPreview,
    doubleNormalizeUrl,
    env,
    FileUploader,
    floatingDialog,
    FloatingDialog,
    FormGroup,
    FormGroupInline,
    generatePushID,
    getAndPutAndGetToLocalStorage,
    getFromLocalStorage,
    getVisibleSlug,
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
    makePath,
    makeSlug,
    mediaScopes,
    MenuSection,
    MenuSectionAbstract,
    objectUtils,
    placeholderImageSrc,
    Popup,
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
    traverseRecursively,
    unhookForm,
    UploadButton,
    urlUtils,
    validateAll,
    validationConstraints,
    writeBlockProps,
};