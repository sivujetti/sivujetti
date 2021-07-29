import {urlUtils} from '../commons/utils.js';
import {translator} from '../commons/main.js';
import {Validator} from '../commons/Form.jsx';
import EditApp from './src/EditApp.jsx';
import InspectorPanel from './src/InspectorPanel.jsx';
import webPageIframe from './src/webPageIframe.js';

configureServices();
renderReactEditApp();
hookUpSiteIframeUrlMirrorer();

function configureServices() {
    urlUtils.baseUrl = window.dataFromAdminBackend.baseUrl;
    urlUtils.assetBaseUrl = window.dataFromAdminBackend.assetBaseUrl;
    urlUtils.env = {window, document};
    webPageIframe.env = urlUtils.env;
    window.translationStringBundles.forEach(strings => {
        translator.addStrings(strings);
        if (strings.minLength) Validator.setValidationStrings(strings);
    });
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
    document.getElementById('kuura-site-iframe').addEventListener('load', e => {
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
