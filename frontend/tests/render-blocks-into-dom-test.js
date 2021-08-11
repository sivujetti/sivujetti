import store, {setCurrentPage} from '../edit-app/src/store.js';
import BlockTrees from '../edit-app/src/BlockTrees.jsx';
import reactTestUtils from './my-test-utils.js';
import EditAppAwareWebPage from '../webpage/src/EditAppAwareWebPage.js';
import blockTypes from '../edit-app/src/block-types/block-types.js';

QUnit.module('EditAppAwareWebPage', () => {
    QUnit.test('appends non-nested block after another', assert => {
        const done = assert.async();
        const s = setupTest();
        renderBlockTreeIntoDom(s, () => {
            simulatePageLoad(s);
        })
        .then(() =>
            clickAddBlockButton(s)
        )
        .then(() => {
            verifyAppendedParagraphAfter(s, assert);
            done();
        });
    });
    QUnit.test('appends non-nested block as second child of another', assert => {
        const done = assert.async();
        const s = setupTest();
        renderBlockTreeIntoDom(s, () => {
            simulatePageLoad(s);
        })
        .then(() =>
            clickAddChildBlockButton(s)
        )
        .then(() => {
            verifyAppendedParagraphInside(s, assert);
            done();
        });
    });
    function setupTest() {
        return {
            mockPageData: {
                dataFromWebPage: null,
                comments: null,
                webPage: null
            }
        };
    }
    function renderBlockTreeIntoDom(s, then) {
        return new Promise(resolve => {
            reactTestUtils.renderIntoDocument(BlockTrees, {ref: () => {
                then();
            }, onWebPageLoadHandled: () => {
                resolve();
            }});
        });
    }
    function simulatePageLoad(s) {
        //
        const sectionBlockId = '-MfgGtK5pnuk1s0Kws4u';
        const paragraphBlockId = '-Me3jYWcEOlLTgJhzqLA';
        const temp = document.createElement('template');
        temp.innerHTML = [
            `<!-- block-start ${sectionBlockId}:Section -->`,
            `<section id="initial-section">`,
                `<!-- block-start ${paragraphBlockId}:Paragraph -->`,
                '<p id="initial-paragraph">Hello</p>',
                `<!-- block-end ${paragraphBlockId} -->`,
            '</section>',
            `<!-- block-end ${sectionBlockId} -->`
        ].join('');
        document.body.appendChild(temp.content);
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
    function clickAddChildBlockButton(s) {
        return new Promise(resolve => {
            const contextNavToggleBtn = document.querySelector('.block-tree > li:first-child .more-toggle');
            contextNavToggleBtn.click();
            setTimeout(() => {
            const addChildCtxNavEl = document.querySelector('.popup-menu a');
            addChildCtxNavEl.click();
            resolve();
            }, 0);
        });
    }
    function clickAddBlockButton(s) {
        return new Promise(resolve => {
            setTimeout(() => {
                const btn = document.querySelector('.block-tree').parentElement.nextElementSibling;
                btn.click();
                resolve();
            }, 0);
        });
    }
    function verifyAppendedParagraphAfter(s, assert) {
        const initialSectionEl = document.getElementById('initial-section');
        const expectedNewPEl = initialSectionEl.nextElementSibling;
        assert.equal(expectedNewPEl.tagName, 'P');
        const paragraphType = blockTypes.get('Paragraph');
        assert.equal(expectedNewPEl.textContent, paragraphType.initialData.text);
    }
    function verifyAppendedParagraphInside(s, assert) {
        const initialSectionEl = document.getElementById('initial-section');
        const expectedNewPEl = initialSectionEl.children[initialSectionEl.children.length - 1];
        assert.equal(expectedNewPEl.tagName, 'P');
        const paragraphType = blockTypes.get('Paragraph');
        assert.equal(expectedNewPEl.textContent, paragraphType.initialData.text);
    }
});