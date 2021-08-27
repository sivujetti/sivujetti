import {env, urlUtils} from '@sivujetti-commons';
import blockTypes from '../edit-app/src/block-types/block-types.js';
import createHeadingBlockType from '../edit-app/src/block-types/heading.js';
import createParagraphBlockType from '../edit-app/src/block-types/paragraph.js';
import './render-blocks-into-dom-test.js';
import './reorder-blocks-test.js';

env.window = window;
env.document = document;
//
urlUtils.baseUrl = window.location.pathname.split('public/tests')[0];
urlUtils.assetBaseUrl = urlUtils.baseUrl;
urlUtils.env = env;
//
blockTypes.register('Heading', createHeadingBlockType());
blockTypes.register('Paragraph', createParagraphBlockType());

QUnit.config.autostart = false;
QUnit.dump.maxDepth = 8; // default 5
QUnit.moduleDone(() => {
    document.getElementById('render-container-el').innerHTML = '';
    document.getElementById('mock-page-container-el').innerHTML = '';
});
QUnit.start();
