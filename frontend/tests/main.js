// To run these tests, head to <devServerHost>/public/tests/index.html
import {api, env, urlUtils} from '@sivujetti-commons-for-edit-app';
import {Validator} from '../edit-app/src/commons/Form.jsx';
import store, {FormStateStoreWrapper, setOpQueue} from '../edit-app/src/store.js';
import BlockTypes from '../edit-app/src/block-types/block-types.js';
import './compile-scss-test.js';
import './optimize-scss-test.js';
import './optimize-op-queue-test.js';
import './visual-styles-test.js';

env.window = {location: {}, console: window.console, addEventListener: () => {}};
env.document = {createElement: (e, o=undefined) => document.createElement(e, o), head: document.head};
env.normalTypingDebounceMillis = 0;
//
urlUtils.assetBaseUrl = window.location.pathname.split('public/tests')[0];
urlUtils.baseUrl = `${urlUtils.assetBaseUrl}index.php?q=/`;
urlUtils.cacheBustStr = '-';
urlUtils.env = env;
//
api.getBlockRenderers = () => [];
api.getActiveTheme = () => ({id: '1'});
api.user = {can: () => true};
api.webPageIframe = {scrollTo: () => null};
api.mainPanel = {scrollTo: () => null};
//
Validator.registerStateWrapperImpl('default', FormStateStoreWrapper);
//
const blockTypes = new BlockTypes(api);
api.blockTypes = blockTypes;

QUnit.config.autostart = false;
QUnit.dump.maxDepth = 8; // default 5
QUnit.moduleDone(() => {
    store.dispatch(setOpQueue([]));
    document.getElementById('render-container-el').innerHTML = '';
    document.getElementById('mock-page-container-el').innerHTML = '';
});
QUnit.start();
