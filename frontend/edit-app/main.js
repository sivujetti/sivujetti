import {urlUtils} from '../commons/utils.js';
import {translator} from '../commons/main.js';
import EditApp from './src/EditApp.jsx';
import InspectorPanel from './src/InspectorPanel.jsx';

configureServices();
renderReactEditApp();
hookUpSiteIframeUrlMirrorer();

function configureServices() {
    urlUtils.baseUrl = window.dataFromAdminBackend.baseUrl;
    urlUtils.assetBaseUrl = window.dataFromAdminBackend.assetBaseUrl;
    window.translationStringBundles.map(strings => translator.addStrings(strings));
}

function renderReactEditApp() {
    let editAppReactRef = preact.createRef();

    window.editApp = {
        /**
         * @param {EditAppAwareWebPage} webPage
         * @access public
         */
        handleWebPageLoaded(webPage) {
            editAppReactRef.current.handleWebPageLoaded(webPage.data,
                                                        webPage.scanBlockRefComments(),
                                                        webPage);
        }
    };

    preact.render(preact.createElement(EditApp, {
        ref: editAppReactRef,
    }), document.getElementById('main-panel'));

    preact.render(preact.createElement(InspectorPanel, {
        //
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
