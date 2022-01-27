import {translator, env, urlUtils} from '@sivujetti-commons-for-edit-app';
import {Validator} from './src/commons/Form.jsx';
import {sensibleDefaults} from './src/constants.js';
import {FormStateStoreWrapper} from './src/store.js';
import EditApp from './src/EditApp.jsx';
import blockTypes from './src/block-types/block-types.js';
import createMenuBlockType from './src/block-types/Menu/menu.js';
import createButtonBlockType from './src/block-types/button.js';
import createColumnsBlockType from './src/block-types/columns.js';
import createGlobalBlockReferenceBlockType from './src/block-types/globalBlockReference.js';
import createHeadingBlockType from './src/block-types/heading.js';
import createImageBlockType from './src/block-types/image.js';
import createListingBlockTypeCreator from './src/block-types/listing.js';
import createPageInfoBlockType from './src/block-types/pageInfo.js';
import createParagraphBlockType from './src/block-types/paragraph.js';
import createRichTextBlockType from './src/block-types/richText.js';
import createSectionBlockType from './src/block-types/section.js';
import InspectorPanel from './src/InspectorPanel.jsx';
import blockTreeUtils from './src/blockTreeUtils.js';

const editAppReactRef = preact.createRef();
const internalSivujettiApi = {
    /**
     * @returns {Array<PageType>}
     */
    getPageTypes() {
        return editAppReactRef.current.props.dataFromAdminBackend.pageTypes;
    }
};

configureServices();
publishFrontendApi();
renderReactEditApp();
hookUpSiteIframeUrlMirrorer();

function configureServices() {
    env.normalTypingDebounceMillis = sensibleDefaults.normalTypingDebounceMillis;
    //
    Validator.registerStateWrapperImpl('default', FormStateStoreWrapper);
    window.translationStringBundles.forEach(strings => {
        translator.addStrings(strings);
        if (strings.minLength) Validator.setValidationStrings(strings);
    });
    //
    blockTypes.register('Menu', createMenuBlockType(internalSivujettiApi));
    blockTypes.register('Button', createButtonBlockType(internalSivujettiApi));
    blockTypes.register('Columns', createColumnsBlockType(internalSivujettiApi));
    blockTypes.register('GlobalBlockReference', createGlobalBlockReferenceBlockType(internalSivujettiApi));
    blockTypes.register('Heading', createHeadingBlockType(internalSivujettiApi));
    blockTypes.register('Image', createImageBlockType(internalSivujettiApi));
    blockTypes.register('Listing', createListingBlockTypeCreator(internalSivujettiApi));
    blockTypes.register('PageInfo', createPageInfoBlockType(internalSivujettiApi));
    blockTypes.register('Paragraph', createParagraphBlockType(internalSivujettiApi));
    blockTypes.register('RichText', createRichTextBlockType(internalSivujettiApi));
    blockTypes.register('Section', createSectionBlockType(internalSivujettiApi));
}

function publishFrontendApi() {
    window.sivujetti = {
        blockTypes,
        registerTranslationStrings: translator.addStrings.bind(translator),
    };
}

function renderReactEditApp() {
    const mainPanelOuterEl = document.getElementById('main-panel');
    const inspectorPanelOuterEl = document.getElementById('inspector-panel');
    const inspectorPanelReactRef = preact.createRef();
    preact.render(preact.createElement(EditApp, {
        outerEl: mainPanelOuterEl,
        inspectorPanelRef: inspectorPanelReactRef,
        dataFromAdminBackend: window.dataFromAdminBackend,
        ref: editAppReactRef,
    }), mainPanelOuterEl);

    preact.render(preact.createElement(InspectorPanel, {
        outerEl: inspectorPanelOuterEl,
        rootEl: document.getElementById('root'),
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
    document.getElementById('sivujetti-site-iframe').addEventListener('load', e => {
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
