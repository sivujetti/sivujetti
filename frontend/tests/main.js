// To run these tests, head to <devServerHost>/public/tests/index.html
import {api, env, urlUtils} from '@sivujetti-commons-for-edit-app';
import {Validator} from '../edit-app/src/commons/Form.jsx';
import store, {FormStateStoreWrapper, setOpQueue} from '../edit-app/src/store.js';
import BlockTypes from '../edit-app/src/block-types/block-types.js';
import createGlobalBlockReference from '../edit-app/src/block-types/globalBlockReference.js';
import createHeadingBlockType from '../edit-app/src/block-types/heading.js';
import createPageInfoBlockType from '../edit-app/src/block-types/pageInfo.js';
import createParagraphBlockType from '../edit-app/src/block-types/paragraph.js';
import createSectionBlockType from '../edit-app/src/block-types/section.js';
import {mockPageTypes} from './utils/edit-app-test-utils.js';
import './create-page-test.js';
import './create-page-type-test.js';
import './render-blocks-into-dom-test.js';
import './reorder-blocks-test.js';
import './optimize-op-queue-test.js';
import './undo-block-actions-test.js';
import './update-global-block-test.js';
import './update-paragraph-text-test.js';

env.window = {location: {}, console: window.console, addEventListener: () => {}};
env.document = {};
env.normalTypingDebounceMillis = 0;
//
urlUtils.assetBaseUrl = window.location.pathname.split('public/tests')[0];
urlUtils.baseUrl = `${urlUtils.assetBaseUrl}index.php?q=/`;
urlUtils.env = env;
//
api.getPageTypes = () => mockPageTypes;
api.webPageIframe = {scrollTo: () => null};
api.mainPanel = {scrollTo: () => null};
//
Validator.registerStateWrapperImpl('default', FormStateStoreWrapper);
//
const blockTypes = new BlockTypes(api);
blockTypes.register('GlobalBlockReference', createGlobalBlockReference);
blockTypes.register('Heading', createHeadingBlockType);
blockTypes.register('PageInfo', createPageInfoBlockType);
blockTypes.register('Paragraph', createParagraphBlockType);
blockTypes.register('Section', createSectionBlockType);
api.blockTypes = blockTypes;

QUnit.config.autostart = false;
QUnit.dump.maxDepth = 8; // default 5
QUnit.moduleDone(() => {
    store.dispatch(setOpQueue([]));
    document.getElementById('render-container-el').innerHTML = '';
    document.getElementById('mock-page-container-el').innerHTML = '';
});
QUnit.start();
