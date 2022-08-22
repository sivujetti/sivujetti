import {translator, api, env, urlUtils, signals} from '@sivujetti-commons-for-edit-app';
import {Validator} from './src/commons/Form.jsx';
import {stringUtils} from './src/commons/utils.js';
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
import blockTreeUtils from './src/blockTreeUtils.js';
import WebPageIframe from './src/WebPageIframe.js';
import MainPanel from './src/MainPanel.js';
import OnThisPageSection from './src/DefaultView/OnThisPageSection.jsx';
import BaseStylesSection from './src/DefaultView/BaseStylesSection.jsx';
import WebsiteSection from './src/DefaultView/WebsiteSection.jsx';
import {MyClipboard, MyKeyboard, MyLink, MySnowTheme} from './src/Quill/quill-customizations.js';

const editAppReactRef = preact.createRef();

populateFrontendApi();
configureServices();
renderReactEditApp();
hookUpSiteIframeUrlMirrorer();

function populateFrontendApi() {
    const d = window.dataFromAdminBackend;
    api.getPageTypes = () => d.pageTypes;
    api.getBlockRenderers = () => d.blockRenderers;
    api.getActiveTheme = () => d.activeTheme;
    api.registerTranslationStrings = translator.addStrings.bind(translator);
    api.webPageIframe = new WebPageIframe(document.getElementById('site-preview-iframe'), env, urlUtils);
    api.user = {
        can(doWhat) { return d.userPermissions[`can${stringUtils.capitalize(doWhat)}`] === true; },
        getRole() { return d.userRole; }
    };
    api.editApp = {
        addBlockTree(trid, blocks) { editAppReactRef.current.addBlockTree(trid, blocks); },
        registerWebPageDomUpdaterForBlockTree(trid) { editAppReactRef.current.registerWebPageDomUpdaterForBlockTree(trid); },
        unRegisterWebPageDomUpdaterForBlockTree(trid) { editAppReactRef.current.unRegisterWebPageDomUpdaterForBlockTree(trid); },
        removeBlockTree(trid) { editAppReactRef.current.removeBlockTree(trid); },
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
    const mainPanel = new MainPanel(document.getElementById('main-panel'),
        signals, env);
    mainPanel.registerSection('onThisPage', OnThisPageSection);
    if (api.user.can('editThemeColours')) {
        mainPanel.registerSection('baseStyles', BaseStylesSection);
    }
    if (api.user.can('createPages')) {
        mainPanel.registerSection('website', WebsiteSection);
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
        ref: editAppReactRef,
    }), mainPanelOuterEl);

    preact.render(preact.createElement(InspectorPanel, {
        outerEl: inspectorPanelOuterEl,
        mainPanelOuterEl,
        rootEl,
        ref: inspectorPanelReactRef,
    }), inspectorPanelOuterEl);

    /**
     * @param {EditAppAwareWebPage} webPage
     * @access public
     */
    window.passWebPageToEditApp = (webPage) => {
        const editApp = editAppReactRef.current;
        const els = webPage.scanBlockElements();
        const {blocks} = webPage.data.page;
        const ordered = [blocks.find(({type}) => type === 'PageInfo')];
        for (const el of els) {
            const [isPartOfGlobalBlockTree, globalBlockRefBlockId] = t(el);
            const blockId = !isPartOfGlobalBlockTree ? el.getAttribute('data-block') : globalBlockRefBlockId;
            const block = blocks.find(({id}) => id === blockId);
            if (block) ordered.push(block);
        }
        //
        const [mutatedOrdered, separatedTrees] = separate(ordered);
        blockTreeUtils.traverseRecursively(mutatedOrdered, b => {
            b.isStoredTo = 'page';
            b.isStoredToTreeId = 'main';
            if (b.type !== 'GlobalBlockReference' && b.type !== 'PageInfo') webPage.setTridAttr(b.id, 'main');
        });
        for (const [trid, tree] of separatedTrees) {
            blockTreeUtils.traverseRecursively(tree, b => {
                b.isStoredTo = 'globalBlockTree';
                b.isStoredToTreeId = trid;
                webPage.setTridAttr(b.id, trid);
            });
        }
        webPage.addRootBoundingEls(ordered[ordered.length - 1]);
        //
        const trees = new Map;
        trees.set('main', mutatedOrdered);
        for (const [trid, tree] of separatedTrees)
            trees.set(trid, tree);
        //
        editApp.handleWebPageLoaded(webPage, trees);
    };
}

/**
 * @param {HTMLElement} el
 * @returns {[Boolean, String|null]}
 */
function t(el) {
    const p = el.previousSibling;
    return !p || p.nodeType !== Node.COMMENT_NODE || !p.nodeValue.endsWith(':GlobalBlockReference ')
        ? [false, null]
        : [true, p.nodeValue.split(' block-start ')[1].split(':')[0]];
}

/**
 * @param {Array<RawBlock>} mainTreeBlocks
 * @returns {[Array<RawBlock>, Map<String, Array<RawBlock>>]}
 */
function separate(mainTreeBlocks) {
    const separatedGlobalTreesBlocks = new Map;
    blockTreeUtils.traverseRecursively(mainTreeBlocks, b => {
        if (b.type !== 'GlobalBlockReference') return;
        separatedGlobalTreesBlocks.set(b.globalBlockTreeId, b.__globalBlockTree.blocks);
        delete b.__globalBlockTree;
    });
    return [mainTreeBlocks, separatedGlobalTreesBlocks];
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
