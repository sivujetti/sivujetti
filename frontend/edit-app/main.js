import {translator, api, env, stringUtils} from '@sivujetti-commons-for-edit-app';
import {Validator} from './src/commons/Form.jsx';
import {sensibleDefaults} from './src/constants.js';
import {FormStateStoreWrapper} from './src/store.js';
import EditApp from './src/EditApp.jsx';
import BlockTypes from './src/block-types/block-types.js';
import createMenuBlockType from './src/block-types/Menu/menu.js';
import createButtonBlockType from './src/block-types/button.js';
import createColumnsBlockType from './src/block-types/columns.js';
import createCodeBlockType from './src/block-types/code.js';
import createGlobalBlockReferenceBlockType from './src/block-types/globalBlockReference.js';
import createHeadingBlockType from './src/block-types/heading.js';
import createImageBlockType from './src/block-types/image.js';
import createListingBlockType from './src/block-types/Listing/listing.js';
import createPageInfoBlockType from './src/block-types/pageInfo.js';
import createParagraphBlockType from './src/block-types/paragraph.js';
import createRichTextBlockType from './src/block-types/richText.js';
import createSectionBlockType from './src/block-types/section.js';
import InspectorPanel from './src/InspectorPanel.jsx';
import WebPageIframe from './src/WebPageIframe.js';
import MainPanel from './src/MainPanel.js';
import OnThisPageSection from './src/left-panel/default-panel-sections/OnThisPageSection.jsx';
import BaseStylesSection from './src/left-panel/default-panel-sections/BaseStylesSection.jsx';
import SettingsSection from './src/left-panel/default-panel-sections/SettingsSection.jsx';
import WebsiteSection from './src/left-panel/default-panel-sections/WebsiteSection.jsx';
import {MyClipboard, MyKeyboard, MyLink, MySnowTheme} from './src/Quill/quill-customizations.js';
import EditAppViews from './src/EditAppViews.jsx';

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
    // blockTypes, see configureServices
    // mainPanel see configureServices
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
    patchQuillEditor();
}

function patchQuillEditor() {
    const Quill = window.Quill;
    Quill.debug('error');
    //
    Quill.register('themes/snow', MySnowTheme);
    Quill.register('modules/clipboard', MyClipboard);
    Quill.register('modules/keyboard', MyKeyboard);
    Quill.register(MyLink);
}

function renderReactEditApp() {
    const mainPanelOuterEl = api.mainPanel.getEl();
    const inspectorPanelOuterEl = document.getElementById('inspector-panel');
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

    preact.render(preact.createElement(EditAppViews, {
        rootEl,
    }), document.getElementById('view'));

    window.myRoute = url => {
        preactRouter.route(url);
    };
}
