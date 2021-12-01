import * as commons from '../edit-app/src/commons/main.js';
import blockTypes from '../edit-app/src/block-types/block-types.js';
import {blockUtils} from './my-test-utils.js';
import * as appTestUtils from './edit-app-testutils.js';

QUnit.module('BlockTrees', () => {
    QUnit.test('user can add block to inner branch', assert => {
        const done = assert.async();
        const s = appTestUtils.createTestState();
        appTestUtils.renderMockEditAppIntoDom('DefaultView', () => {
            appTestUtils.simulatePageLoad(s);
        })
        .then(() =>
            clickAddBlockButton(s)
        )
        .then(() => {
            verifyAppendedParagraphAfter(s, assert);
            done();
        });
    });
    QUnit.test('user can add block to inner branch by using the context menu', assert => {
        const done = assert.async();
        const s = appTestUtils.createTestState();
        appTestUtils.renderMockEditAppIntoDom('DefaultView', () => {
            appTestUtils.simulatePageLoad(s);
        })
        .then(() =>
            clickContextMenuLink(s, 'add-child')
        )
        .then(() => {
            verifyAppendedParagraphInside(s, assert);
            done();
        });
    });
    QUnit.test('user can clone block using the context menu', assert => {
        const done = assert.async();
        const s = appTestUtils.createTestState();
        appTestUtils.renderMockEditAppIntoDom('DefaultView', () => {
            appTestUtils.simulatePageLoad(s);
        })
        .then(() =>
            clickContextMenuLink(s, 'clone-block')
        )
        .then(() => {
            verifyRecursivelyClonedSectionAfter(s, assert);
            verifyUpdatedChildBlockRefs(s, assert);
            done();
        });
    });
    QUnit.test('user can clone deeply nested block', assert => {
        const done = assert.async();
        const s = appTestUtils.createTestState();
        s.useDeeplyNestedBlock = true;
        appTestUtils.renderMockEditAppIntoDom('DefaultView', () => {
            appTestUtils.simulatePageLoad(s, undefined, 'withNestedBlock');
        })
        .then(() =>
            clickContextMenuLink(s, 'clone-block')
        )
        .then(() => {
            verifyRecursivelyClonedSectionAfter(s, assert);
            verifyUpdatedChildBlockRefs(s, assert);
            done();
        });
    });
    QUnit.test('user can add global block reference to inner branch', assert => {
        const done = assert.async();
        const s = createAddGlobalBlockReferenceTestState();
        simulateListGlobalBlockTreesHttpToReturnSuccesfully(s);
        simulateRenderGlobalBlockHttpToReturnSuccesfully(s);
        appTestUtils.renderMockEditAppIntoDom('DefaultView', () => {
            appTestUtils.simulatePageLoad(s);
        })
        .then(() =>
            clickAddBlockButton(s)
        )
        .then(() =>
            useBlockSelectorToSelectFirstGlobalBlock(s)
        )
        .then(() =>
            verifyAppendedParagraphAfter(s, assert, s.testGlobalBlockTree.blocks[0].text)
        )
        .then(() => {
            s.listGlobalBlockTreesHttpStub.restore();
            s.renderBlockHttpStub.restore();
            done();
        });
    });
    function createAddGlobalBlockReferenceTestState() {
        return Object.assign(appTestUtils.createTestState(), {
            testGlobalBlockTree: {
                id: '1',
                name: 'Footer',
                blocks: appTestUtils.testBlocks.slice(0),
            },
            listGlobalBlockTreesHttpStub: null,
            renderBlockHttpStub: null,
        });
    }
    function clickAddBlockButton(_s) {
        const btn = document.querySelector('.block-tree').parentElement.previousElementSibling;
        btn.click();
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, 0);
        });
    }
    function clickContextMenuLink(s, linkId) {
        return new Promise(resolve => {
            const contextNavToggleBtn = document.querySelector('.block-tree > li:nth-of-type(2) .more-toggle');
            contextNavToggleBtn.click();
            setTimeout(() => {
                const linkEl = Array.from(document.querySelectorAll('.popup-menu a'))
                    .find(el => el.href.split('#')[1] === linkId);
                if (!linkEl)
                    throw new Error(`Invalid link id ${linkId} (should be 'add-child',` +
                                    `'clone-block' or 'delete-block')`);
                linkEl.click();
                resolve();
            }, 0);
        });
    }
    function simulateListGlobalBlockTreesHttpToReturnSuccesfully(s) {
        s.listGlobalBlockTreesHttpStub = window.sinon.stub(commons.http, 'get')
            .returns(Promise.resolve([s.testGlobalBlockTree]));
    }
    function simulateRenderGlobalBlockHttpToReturnSuccesfully(s) {
        s.renderBlockHttpStub = window.sinon.stub(commons.http, 'post')
            .returns(Promise.resolve({result: '<!-- block-start -MpGug8oSeBxCrAGB1Xw:GlobalBlockReference -->' +
                appTestUtils.renderBlock(s.testGlobalBlockTree.blocks[0]) +
            '<!-- block-end -MpGug8oSeBxCrAGB1Xw -->'}));
    }
    function useBlockSelectorToSelectFirstGlobalBlock(s) {
        const blockSelectorOuterEl = document.querySelector('.block-tree li .dashed');
        const tabLinks = blockSelectorOuterEl.querySelectorAll('.tab-item a');
        tabLinks[1].click();
        // wait for htt.get
        return new Promise(resolve => {
            setTimeout(() => {
                s.listGlobalBlockTreesHttpStub.getCall(0).returnValue
                    .then(() => {
                        resolve();
                    });
            }, 0);
        });
    }
    function verifyAppendedParagraphAfter(s, assert, expectedText = '') {
        const initialSectionEl = document.querySelector('.initial-section');
        const expectedNewPEl = initialSectionEl.nextElementSibling;
        assert.equal(expectedNewPEl.tagName, 'P');
        if (!expectedText) {
            const paragraphType = blockTypes.get('Paragraph');
            expectedText = paragraphType.initialData.text;
        }
        assert.equal(expectedNewPEl.textContent, expectedText);
    }
    function verifyAppendedParagraphInside(s, assert) {
        const initialSectionElDiv = document.querySelector('.initial-section').children[0];
        const expectedNewPEl = initialSectionElDiv.children[initialSectionElDiv.children.length - 1];
        assert.equal(expectedNewPEl.tagName, 'P');
        const paragraphType = blockTypes.get('Paragraph');
        assert.equal(expectedNewPEl.textContent, paragraphType.initialData.text);
    }
    function verifyRecursivelyClonedSectionAfter(s, assert) {
        const initialSectionEl = document.querySelector('.initial-section');
        const initialSectionElDiv = initialSectionEl.children[0];
        const expectedClonedSectionEl = initialSectionEl.nextElementSibling;
        assert.equal(expectedClonedSectionEl.nodeName, 'SECTION');
        const expectedClonedSectionElDiv = expectedClonedSectionEl.children[0];
        //
        const expectedClonedH2El = expectedClonedSectionElDiv.children[0];
        assert.equal(expectedClonedH2El.textContent,
                     initialSectionElDiv.children[0].textContent);
        if (s.useDeeplyNestedBlock) {
            const expectedClonedH2PEl = expectedClonedH2El.children[0];
            assert.equal(expectedClonedH2PEl.textContent,
                         initialSectionElDiv.children[0].children[0].textContent);
        }
        const expectedClonedPEl = expectedClonedSectionElDiv.children[1];
        assert.equal(expectedClonedPEl.textContent,
                     initialSectionElDiv.children[1].textContent);
    }
    function verifyUpdatedChildBlockRefs(s, assert) {
        const initialSectionEl = document.querySelector('.initial-section');
        const initialSectionDivEl = initialSectionEl.children[0];
        const clonedSectionEl = initialSectionEl.nextElementSibling;
        const clonedSectionDivEl = clonedSectionEl.children[0];
        //
        const h2BlockRefAfter = blockUtils.getBlockRefId(clonedSectionDivEl.children[0]);
        const h2BlockRefBefore = blockUtils.getBlockRefId(initialSectionDivEl.children[0]);
        assert.equal(typeof h2BlockRefAfter.blockId, 'string');
        assert.notEqual(h2BlockRefAfter.blockId,
                        h2BlockRefBefore.blockId);
        if (s.useDeeplyNestedBlock) {
            const h2pBlockRefAfter = blockUtils.getBlockRefId(clonedSectionDivEl.children[0].children[0]);
            const h2pBlockRefBefore = blockUtils.getBlockRefId(initialSectionDivEl.children[0].children[0]);
            assert.equal(typeof h2pBlockRefAfter.blockId, 'string');
            assert.notEqual(h2pBlockRefAfter.blockId,
                            h2pBlockRefBefore.blockId);
        }
        const pBlockRefAfter = blockUtils.getBlockRefId(clonedSectionDivEl.children[0]);
        const pBlockRefBefore = blockUtils.getBlockRefId(initialSectionDivEl.children[0]);
        assert.equal(typeof pBlockRefAfter.blockId, 'string');
        assert.notEqual(pBlockRefAfter.blockId,
                        pBlockRefBefore.blockId);
    }
});