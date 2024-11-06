/*
To run these tests, head to <devServerHost>/public/tests/index.html
*/

import {api} from '@sivujetti-commons-for-edit-app';
import './SaveButton-test.js';
import './scss-utils-test.js';
import './short-id-gen-test.js';

api.webPagePreview.reRenderBlock = () => {};

QUnit.config.autostart = false;
QUnit.dump.maxDepth = 8; // default 5
QUnit.moduleDone(() => {
    document.getElementById('render-container-el').innerHTML = '';
    document.getElementById('mock-page-container-el').innerHTML = '';
});
QUnit.start();
