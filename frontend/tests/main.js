/*
To run these tests, head to <devServerHost>/public/tests/index.html
*/

import {api} from '@sivujetti-commons-for-edit-app';
import toasters from '../edit-app/includes/toasters.jsx';
import './SaveButton-test.js';
import './SaveButtonFuncs-test.js';
import './scss-utils-test.js';
import './ScssWizardFuncsTest.js';
import './short-id-gen-test.js';

api.webPagePreview.reRenderBlock = () => {};
api.webPagePreview.reRenderAllBlocks = () => {};
toasters.editAppMain = () => {};

QUnit.config.autostart = false;
QUnit.dump.maxDepth = 8; // default 5
QUnit.moduleDone(() => {
    document.getElementById('render-container-el').innerHTML = '';
    document.getElementById('mock-page-container-el').innerHTML = '';
});
QUnit.start();
