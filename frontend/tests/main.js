import './render-blocks-into-dom-test.js';
import {urlUtils} from '../commons/utils.js';

urlUtils.baseUrl = window.location.pathname.split('public/tests')[0];
urlUtils.assetBaseUrl = urlUtils.baseUrl;
urlUtils.env = {window, document};

QUnit.config.autostart = false;
QUnit.dump.maxDepth = 8; // default 5
QUnit.moduleDone(() => {
    document.getElementById('render-container-el').innerHTML = '';
    let el = document.body.querySelector('script:last-of-type').nextSibling;
    while (el) {
        var next = el.nextSibling;
        document.body.removeChild(el);
        el = next;
    }
});
QUnit.start();
