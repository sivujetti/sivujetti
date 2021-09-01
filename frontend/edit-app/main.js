import {translator, env, urlUtils} from '@sivujetti-commons';
import {Validator} from '../commons/Form.jsx';
import {FormStateStoreWrapper} from './src/store.js';
import EditApp from './src/EditApp.jsx';
import blockTypes from './src/block-types/block-types.js';
import createButtonBlockType from './src/block-types/button.js';
import createColumnsBlockType from './src/block-types/columns.js';
import createHeadingBlockType from './src/block-types/heading.js';
import createMenuBlockType from './src/block-types/menu.js';
import createParagraphBlockType from './src/block-types/paragraph.js';
import createRichTextBlockType from './src/block-types/richText.js';
import createSectionBlockType from './src/block-types/section.js';
import InspectorPanel from './src/InspectorPanel.jsx';
import webPageIframe from './src/webPageIframe.js';
import blockTreeUtils from './src/blockTreeUtils.js';

configureServices();
publishFrontendApi();
renderReactEditApp();
hookUpSiteIframeUrlMirrorer();

function configureServices() {
    env.window = window;
    env.document = document;
    //
    urlUtils.baseUrl = window.dataFromAdminBackend.baseUrl;
    urlUtils.assetBaseUrl = window.dataFromAdminBackend.assetBaseUrl;
    urlUtils.env = env;
    //
    Validator.registerStateWrapperImpl('default', FormStateStoreWrapper);
    window.translationStringBundles.forEach(strings => {
        translator.addStrings(strings);
        if (strings.minLength) Validator.setValidationStrings(strings);
    });
    //
    blockTypes.register('Button', createButtonBlockType());
    blockTypes.register('Columns', createColumnsBlockType());
    blockTypes.register('Heading', createHeadingBlockType());
    blockTypes.register('Menu', createMenuBlockType());
    blockTypes.register('Paragraph', createParagraphBlockType());
    blockTypes.register('RichText', createRichTextBlockType());
    blockTypes.register('Section', createSectionBlockType());
}

function publishFrontendApi() {
    window.sivujetti = {
        blockTypes,
    };
}

function renderReactEditApp() {
    const editAppReactRef = preact.createRef();

    window.editApp = {
        /**
         * @param {EditAppAwareWebPage} webPage
         * @access public
         */
        handleWebPageLoaded(webPage) {
            const editApp = editAppReactRef.current;
            webPage.setEventHandlers(editApp.websiteEventHandlers);
            webPage.data.blocks = normalizeBlockTree(webPage.data.page.blocks);
            webPage.data.layoutBlocks = normalizeBlockTree(webPage.data.layoutBlocks);
            editApp.handleWebPageLoaded(webPage.data,
                                        webPage.scanBlockRefComments(true),
                                        webPage);
        }
    };

    const mainPanelOuterEl = document.getElementById('main-panel');
    const inspectorPanelOuterEl = document.getElementById('inspector-panel');
    preact.render(preact.createElement(EditApp, {
        webPageIframe,
        outerEl: mainPanelOuterEl,
        inspectorPanelEl: inspectorPanelOuterEl,
        dataFromAdminBackend: window.dataFromAdminBackend,
        ref: editAppReactRef,
    }), mainPanelOuterEl);

    preact.render(preact.createElement(InspectorPanel, {
        outerEl: inspectorPanelOuterEl,
        rootEl: document.getElementById('root'),
    }), inspectorPanelOuterEl);
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

function normalizeBlockTree(branch) {
    blockTreeUtils.traverseRecursively(branch, (b, _i, _parent, parentIdPath) => {
        b.parentBlockIdPath = parentIdPath;
    });
    return branch;
}
