import {env, urlUtils} from '@sivujetti-commons';
import blockTypes from '../edit-app/src/block-types/block-types.js';
import createParagraphBlockType from '../edit-app/src/block-types/paragraph';
import './render-blocks-into-dom-test.js';
import './reorder-blocks-test.js';

env.window = window;
env.document = document;
//
urlUtils.baseUrl = window.location.pathname.split('public/tests')[0];
urlUtils.assetBaseUrl = urlUtils.baseUrl;
urlUtils.env = env;
//
blockTypes.register('Paragraph', createParagraphBlockType());

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
