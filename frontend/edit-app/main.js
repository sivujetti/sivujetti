import {translator, env, urlUtils} from '@sivujetti-commons';
import {Validator} from '../commons/Form.jsx';
import {FormStateStoreWrapper} from './src/store.js';
import EditApp from './src/EditApp.jsx';
import blockTypes from './src/block-types/block-types.js';
import buttonBlockType from './src/block-types/button.js';
import columnsBlockType from './src/block-types/columns.js';
import headingBlockType from './src/block-types/heading.js';
import paragraphBlockType from './src/block-types/paragraph.js';
import richTextBlockType from './src/block-types/richText.js';
import sectionBlockType from './src/block-types/section.js';
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
    blockTypes.register('Button', buttonBlockType);
    blockTypes.register('Columns', columnsBlockType);
    blockTypes.register('Heading', headingBlockType);
    blockTypes.register('Paragraph', paragraphBlockType);
    blockTypes.register('RichText', richTextBlockType);
    blockTypes.register('Section', sectionBlockType);
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

    preact.render(preact.createElement(EditApp, {
        ref: editAppReactRef,
        webPageIframe,
    }), document.getElementById('main-panel'));

    preact.render(preact.createElement(InspectorPanel, {
        rootEl: document.getElementById('root'),
    }), document.getElementById('inpector-panel'));
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
    blockTreeUtils.traverseRecursively(branch, (b, _, parent) => {
        b.parentBlockId = parent ? parent.id : null;
    });
    return branch;
}
