import reactTestUtils from './my-test-utils.js';
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
    const sectionBlockId = '-MfgGtK5pnuk1s0Kws4u';
    const headingBlockId = '-Me3jYWcEOlLTgJhzqL8';
    const paragraphBlockId = '-Me3jYWcEOlLTgJhzqLA';
    document.getElementById('mock-page-container-el').innerHTML = [
        `<!-- block-start ${sectionBlockId}:Section -->`,
        `<section id="initial-section">`,
            `<!-- block-start ${headingBlockId}:Heading -->`,
            '<h2>My page</h2>',
            `<!-- block-end ${headingBlockId} -->`,
            `<!-- block-start ${paragraphBlockId}:Paragraph -->`,
            '<p id="initial-paragraph">Hello</p>',
            `<!-- block-end ${paragraphBlockId} -->`,
        '</section>',
        `<!-- block-end ${sectionBlockId} -->`
    ].join('');
    //
    s.mockPageData.dataFromWebPage = {
        page: {
            id: '1',
            isPlaceholderPage: false,
            type: 'Pages',
            blocks: [{
                "type": "Section",
                "title": "",
                "renderer": "sivujetti:block-generic-wrapper",
                "id": sectionBlockId,
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
                    "id": headingBlockId,
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
                    "id": paragraphBlockId,
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
            }]
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
