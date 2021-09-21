import reactTestUtils, {blockUtils} from './my-test-utils.js';
import store, {setCurrentPage} from '../edit-app/src/store.js';
import BlockTrees from '../edit-app/src/BlockTrees.jsx';
import EditAppAwareWebPage from '../webpage/src/EditAppAwareWebPage.js';

function createTestState() {
    return {
        blockTreesCmp: null,
    };
}

function renderBlockTreeIntoDom(s, then) {
    return new Promise(resolve => {
        reactTestUtils.renderIntoDocument(BlockTrees, {ref: cmp => {
            then(cmp);
        }, onWebPageLoadHandled: () => {
            resolve();
        }});
    });
}

function simulatePageLoad(s) {
    //
    const pageBlocks = [{
        "type": "Section",
        "title": "",
        "renderer": "sivujetti:block-generic-wrapper",
        "id": '-MfgGtK5pnuk1s0Kws4u',
        "propsData": [{
            "key": "bgImage",
            "value": ""
        }, {
            "key": "cssClass",
            "value": ""
        }],
        "bgImage": "",
        "cssClass": "",
        "children": [{
            "type": "Heading",
            "title": "",
            "renderer": "sivujetti:block-auto",
            "id": '-Me3jYWcEOlLTgJhzqL8',
            "children": [],
            "propsData": [{
                "key": "text",
                "value": "My page"
            }, {
                "key": "level",
                "value": "1"
            }, {
                "key": "cssClass",
                "value": ""
            }],
            "text": "Hello",
            "cssClass": ""
        }, {
            "type": "Paragraph",
            "title": "",
            "renderer": "sivujetti:block-auto",
            "id": '-Me3jYWcEOlLTgJhzqLA',
            "children": [],
            "propsData": [{
                "key": "text",
                "value": "Hello"
            }, {
                "key": "cssClass",
                "value": ""
            }],
            "text": "Hello",
            "cssClass": ""
        }]
    }];
    const layoutBlocks = [{
        "type": "Paragraph",
        "title": "",
        "renderer": "sivujetti:block-auto",
        "id": 'EsmAW0--AnViMcwnIaDP',
        "children": [],
        "propsData": [{
            "key": "text",
            "value": "© Mysite"
        }, {
            "key": "cssClass",
            "value": ""
        }],
        "text": "© Mysite",
        "cssClass": ""
    }];
    document.getElementById('mock-page-container-el').innerHTML =
        blockUtils.decorateWithRef(pageBlocks[0], '<section id="initial-section">' +
            blockUtils.decorateWithRef(pageBlocks[0].children[0], '<h2>My page</h2>') +
            blockUtils.decorateWithRef(pageBlocks[0].children[1], '<p id="initial-paragraph">Hello</p>') +
        '</section>') +
        blockUtils.decorateWithRef(layoutBlocks[0], '<p id="initial-paragraph2">© Mysite</p>');
    //
    const mockSivujettiCurrentPageData = {
        page: {
            id: '1',
            title: 'New page',
            isPlaceholderPage: false,
            type: 'Pages',
            blocks: pageBlocks,
        },
        layouts: [],
        layoutBlocks: layoutBlocks,
    };
    const webPage = new EditAppAwareWebPage(mockSivujettiCurrentPageData);
    const blockRefs = webPage.scanBlockRefComments();
    const combinedBlockTree = webPage.getCombinedAndOrderedBlockTree(pageBlocks,
        layoutBlocks, blockRefs);
    store.dispatch(setCurrentPage({webPage, combinedBlockTree, blockRefs}));
}

export {createTestState, renderBlockTreeIntoDom, simulatePageLoad};
