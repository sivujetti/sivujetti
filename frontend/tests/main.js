// To run these tests, head to <devServerHost>/public/tests/index.html
import {env, urlUtils} from '@sivujetti-commons';
import {Validator} from '../commons/Form.jsx';
import store, {FormStateStoreWrapper, setOpQueue} from '../edit-app/src/store.js';
import blockTypes from '../edit-app/src/block-types/block-types.js';
import createHeadingBlockType from '../edit-app/src/block-types/heading.js';
import createParagraphBlockType from '../edit-app/src/block-types/paragraph.js';
import createSectionBlockType from '../edit-app/src/block-types/section.js';
import './render-blocks-into-dom-test.js';
import './reorder-blocks-test.js';
import './optimize-op-queue-test.js';
import './update-paragraph-text-test.js';

const mockInternalSivujettiApi = {
    /**
     * @returns {Array<PageType>}
     */
    getPageTypes() {
        return [];
    }
};

env.window = window;
env.document = document;
env.normalTypingDebounceMillis = 0;
//
urlUtils.baseUrl = window.location.pathname.split('public/tests')[0];
urlUtils.assetBaseUrl = urlUtils.baseUrl;
urlUtils.env = env;
//
Validator.registerStateWrapperImpl('default', FormStateStoreWrapper);
//
blockTypes.register('Heading', createHeadingBlockType(mockInternalSivujettiApi));
blockTypes.register('Paragraph', createParagraphBlockType(mockInternalSivujettiApi));
blockTypes.register('Section', createSectionBlockType(mockInternalSivujettiApi));

QUnit.config.autostart = false;
QUnit.dump.maxDepth = 8; // default 5
QUnit.moduleDone(() => {
    store.dispatch(setOpQueue([]));
    document.getElementById('render-container-el').innerHTML = '';
    document.getElementById('mock-page-container-el').innerHTML = '';
});
QUnit.start();
