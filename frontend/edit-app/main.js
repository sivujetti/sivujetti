import {translator, api, env, stringUtils} from '@sivujetti-commons-for-edit-app';
import {Validator} from './src/commons/Form.jsx';
import {sensibleDefaults} from './src/constants.js';
import {FormStateStoreWrapper} from './src/store.js';
import EditApp from './src/EditApp.jsx';
import BlockTypes from './src/block-types/block-types.js';
import createMenuBlockType from './src/block-types/menu/menu.js';
import createButtonBlockType from './src/block-types/button.js';
import createColumnsBlockType from './src/block-types/columns.js';
import createCodeBlockType from './src/block-types/code.js';
import createGlobalBlockReferenceBlockType from './src/block-types/globalBlockReference.js';
import createHeadingBlockType from './src/block-types/heading.js';
import createImageBlockType from './src/block-types/image.js';
import createListingBlockType from './src/block-types/listing/listing.js';
import createPageInfoBlockType from './src/block-types/pageInfo.js';
import createParagraphBlockType from './src/block-types/paragraph.js';
import createRichTextBlockType from './src/block-types/richText.js';
import createSectionBlockType from './src/block-types/section.js';
import InspectorPanel from './src/left-column/InspectorPanel.jsx';
import RightColumnViews from './src/right-column/RightColumnViews.jsx';
import WebPageIframe from './src/right-column/WebPageIframe.js';
import MainPanel from './src/left-column/MainPanel.js';
import OnThisPageSection from './src/left-column/panel-sections/OnThisPageSection.jsx';
import BaseStylesSection from './src/left-column/panel-sections/BaseStylesSection.jsx';
import SettingsSection from './src/left-column/panel-sections/SettingsSection.jsx';
import WebsiteSection from './src/left-column/panel-sections/WebsiteSection.jsx';
import {MyClipboard, MyKeyboard, MyLink, IdAttributor, MySnowTheme} from './src/quill/quill-customizations.js';

const editAppReactRef = preact.createRef();

populateFrontendApi();
configureServices();
renderReactEditApp();

function populateFrontendApi() {
    const d = window.dataFromAdminBackend;
    api.getPageTypes = () => d.pageTypes;
    api.getBlockRenderers = () => d.blockRenderers;
    api.getActiveTheme = () => d.activeTheme;
    api.registerTranslationStrings = translator.addStrings.bind(translator);
    api.webPageIframe = new WebPageIframe(document.getElementById('site-preview-iframe'),
        document.querySelector('.highlight-rect'), () => editAppReactRef.current.getCurrentLeftPanelWidth());
    api.user = {
        can(doWhat) { return d.userPermissions[`can${stringUtils.capitalize(doWhat)}`] === true; },
        getRole() { return d.userRole; },
        ROLE_SUPER_ADMIN:  1 << 0, // 1
        ROLE_ADMIN:        1 << 1, // 2
        ROLE_ADMIN_EDITOR: 1 << 2, // 4
        ROLE_EDITOR:       1 << 3, // 8
        ROLE_AUTHOR:       1 << 4, // 16
        ROLE_CONTRIBUTOR:  1 << 5, // 32
        ROLE_FOLLOWER:     1 << 6, // 64
    };
    api.saveButton = {
        triggerUndo() { editAppReactRef.current.saveButtonRef.current.doUndo(); },
        setOnBeforeProcessQueueFn(fn) { return editAppReactRef.current.saveButtonRef.current.setOnBeforeProcessQueueFn(fn); },
    };
    // blockTypes, see configureServices
    // mainPanel see configureServices
    // inspectorPanel see configureServices
}

function configureServices() {
    env.normalTypingDebounceMillis = sensibleDefaults.normalTypingDebounceMillis;
    //
    Validator.registerStateWrapperImpl('default', FormStateStoreWrapper);
    window.translationStringBundles.forEach(strings => {
        api.registerTranslationStrings(strings);
        if (strings.minLength) Validator.setValidationStrings(strings);
    });
    //
    const blockTypes = new BlockTypes(api);
    blockTypes.register('Menu', createMenuBlockType);
    blockTypes.register('Button', createButtonBlockType);
    blockTypes.register('Code', createCodeBlockType);
    blockTypes.register('Columns', createColumnsBlockType);
    blockTypes.register('GlobalBlockReference', createGlobalBlockReferenceBlockType);
    blockTypes.register('Heading', createHeadingBlockType);
    blockTypes.register('Image', createImageBlockType);
    blockTypes.register('Listing', createListingBlockType);
    blockTypes.register('PageInfo', createPageInfoBlockType);
    blockTypes.register('Paragraph', createParagraphBlockType);
    blockTypes.register('RichText', createRichTextBlockType);
    blockTypes.register('Section', createSectionBlockType);
    api.blockTypes = blockTypes;
    //
    const mainPanel = new MainPanel(document.getElementById('main-panel'), env);
    mainPanel.registerSection('onThisPage', OnThisPageSection);
    if (api.user.can('editThemeColours')) {
        mainPanel.registerSection('baseStyles', BaseStylesSection);
    }
    if (api.user.can('createPages')) {
        mainPanel.registerSection('website', WebsiteSection);
    }
    if (api.user.can('editTheWebsitesBasicInfo')) {
        mainPanel.registerSection('settings', SettingsSection);
    }
    api.mainPanel = mainPanel;
    //
    api.inspectorPanel = {
        getEl() { return document.getElementById('inspector-panel'); },
    };
    //
    patchQuillEditor();
}

function patchQuillEditor() {
    const Quill = window.Quill;
    Quill.debug('error');
    //
    Quill.register('themes/snow', MySnowTheme);
    Quill.register('modules/clipboard', MyClipboard);
    Quill.register('modules/keyboard', MyKeyboard);
    Quill.register('formats/id-anchor', IdAttributor);
    Quill.register(MyLink);
}

function renderReactEditApp() {
    const mainPanelOuterEl = api.mainPanel.getEl();
    const inspectorPanelOuterEl = api.inspectorPanel.getEl();
    const inspectorPanelReactRef = preact.createRef();
    const rootEl = document.getElementById('root');
    preact.render(preact.createElement(EditApp, {
        outerEl: mainPanelOuterEl,
        inspectorPanelRef: inspectorPanelReactRef,
        dataFromAdminBackend: window.dataFromAdminBackend,
        rootEl,
        LEFT_PANEL_WIDTH: 318,
        ref: editAppReactRef,
    }), mainPanelOuterEl);

    preact.render(preact.createElement(InspectorPanel, {
        outerEl: inspectorPanelOuterEl,
        mainPanelOuterEl,
        rootEl,
        ref: inspectorPanelReactRef,
    }), inspectorPanelOuterEl);

    preact.render(preact.createElement(RightColumnViews, {
        rootEl,
    }), document.getElementById('view'));

    window.myRoute = url => {
        preactRouter.route(url);
    };
}
