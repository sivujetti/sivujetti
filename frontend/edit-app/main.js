import {translator, api, env, urlUtils} from '@sivujetti-commons-for-edit-app';
import {Validator} from './src/commons/Form.jsx';
import {sensibleDefaults} from './src/constants.js';
import {FormStateStoreWrapper} from './src/store.js';
import EditApp from './src/EditApp.jsx';
import BlockTypes from './src/block-types/block-types.js';
import createMenuBlockType from './src/block-types/Menu/menu.js';
import createButtonBlockType from './src/block-types/button.js';
import createColumnsBlockType from './src/block-types/columns.js';
import createGlobalBlockReferenceBlockType from './src/block-types/globalBlockReference.js';
import createHeadingBlockType from './src/block-types/heading.js';
import createImageBlockType from './src/block-types/image.js';
import createPageInfoBlockType from './src/block-types/pageInfo.js';
import createParagraphBlockType from './src/block-types/paragraph.js';
import createRichTextBlockType from './src/block-types/richText.js';
import createSectionBlockType from './src/block-types/section.js';
import InspectorPanel from './src/InspectorPanel.jsx';
import blockTreeUtils from './src/blockTreeUtils.js';
import WebPageIframe from './src/WebPageIframe.js';
import MainPanel from './src/MainPanel.js';

const editAppReactRef = preact.createRef();

populateFrontendApi();
configureServices();
renderReactEditApp();
hookUpSiteIframeUrlMirrorer();

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
    blockTypes.register('Columns', createColumnsBlockType);
    blockTypes.register('GlobalBlockReference', createGlobalBlockReferenceBlockType);
    blockTypes.register('Heading', createHeadingBlockType);
    blockTypes.register('Image', createImageBlockType);
    blockTypes.register('PageInfo', createPageInfoBlockType);
    blockTypes.register('Paragraph', createParagraphBlockType);
    blockTypes.register('RichText', createRichTextBlockType);
    blockTypes.register('Section', createSectionBlockType);
    api.blockTypes = blockTypes;
}

function populateFrontendApi() {
    api.getPageTypes = () => editAppReactRef.current.props.dataFromAdminBackend.pageTypes;
    api.registerTranslationStrings = translator.addStrings.bind(translator);
    api.webPageIframe = new WebPageIframe(document.getElementById('sivujetti-site-iframe'), env, urlUtils);
    api.mainPanel = new MainPanel(document.getElementById('main-panel'), env);
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
        ref: editAppReactRef,
    }), mainPanelOuterEl);

    preact.render(preact.createElement(InspectorPanel, {
        outerEl: inspectorPanelOuterEl,
        mainPanelOuterEl,
        rootEl,
        ref: inspectorPanelReactRef,
    }), inspectorPanelOuterEl);

    window.editApp = {
        /**
         * @param {EditAppAwareWebPage} webPage
         * @access public
         */
        handleWebPageLoaded(webPage) {
            const editApp = editAppReactRef.current;
            webPage.data.page.blocks = blockTreeUtils.setParentIdPaths(webPage.data.page.blocks);
            //
            const blockRefs = webPage.scanBlockRefComments();
            const ordered = webPage.getCombinedAndOrderedBlockTree(webPage.data.page.blocks,
                                                                   blockRefs,
                                                                   blockTreeUtils);
            const filtered = !webPage.data.page.isPlaceholderPage
                // Accept all
                ? blockRefs
                // Only if page block
                : blockRefs.filter(({blockId}) => blockTreeUtils.findBlock(blockId, webPage.data.page.blocks)[0] !== null);
            webPage.registerEventHandlers(editApp.websiteEventHandlers, filtered);
            editApp.handleWebPageLoaded(webPage, ordered, blockRefs);
        }
    };
}

function hookUpSiteIframeUrlMirrorer() {
    api.webPageIframe.getEl().addEventListener('load', e => {
        let p = e.target.contentWindow.location.href.split('#')[0]
            .replace('&in-edit', '')
            .replace('?in-edit', '')
            .replace(e.target.contentWindow.origin, '')
            .replace(urlUtils.baseUrl, `${urlUtils.baseUrl}_edit/`);
        p = (!p.endsWith('/') ? p : p.substr(0, p.length - 1)) + window.location.hash;
        if (window.location.href !== `${window.location.origin}${p}`)
            history.replaceState(null, null, p);
    });
}
