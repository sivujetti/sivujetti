import reactTestUtils, {blockUtils} from './my-test-utils.js';
import store, {setCurrentPage} from '../edit-app/src/store.js';
import BlockTrees from '../edit-app/src/BlockTrees.jsx';
import EditAppAwareWebPage from '../webpage/src/EditAppAwareWebPage.js';

function createTestState() {
    return {
        mockPageData: {
            dataFromWebPage: null,
            comments: null,
            webPage: null,
            blockTreesCmp: null,
        }
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
    const blockTree = [{
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
    document.getElementById('mock-page-container-el').innerHTML =
        blockUtils.decorateWithRef(blockTree[0], '<section id="initial-section">' +
            blockUtils.decorateWithRef(blockTree[0].children[0], '<h2>My page</h2>') +
            blockUtils.decorateWithRef(blockTree[0].children[1], '<p id="initial-paragraph">Hello</p>') +
        '</section>');
    //
    s.mockPageData.dataFromWebPage = {
        page: {
            id: '1',
            title: 'New page',
            isPlaceholderPage: false,
            type: 'Pages',
            blocks: blockTree,
        },
        layouts: [],
        layoutBlocks: [],
    };
    s.mockPageData.webPage = new EditAppAwareWebPage(s.mockPageData.dataFromWebPage);
    s.mockPageData.comments = s.mockPageData.webPage.scanBlockRefComments();
    //
    store.dispatch(setCurrentPage(s.mockPageData));
}

export {createTestState, renderBlockTreeIntoDom, simulatePageLoad};
