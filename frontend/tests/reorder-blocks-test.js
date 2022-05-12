import * as appTestUtils from './utils/edit-app-test-utils.js';
import {simulateDragBlock, verifySectionChildTagsEqualInDom,
        verifyRootChildTagsEqualInDom} from './utils/render-blocks-test-utils.js';

QUnit.module('BlockTrees', () => {
    QUnit.test('blocks can be reordered inside inner branch by dragging upwards', assert => {
        const done = assert.async();
        const s = appTestUtils.createTestState();
        appTestUtils.renderMockEditAppIntoDom('DefaultView', cmp => {
            s.blockTreesCmp = cmp;
            return appTestUtils.simulatePageLoad(s);
        })
        .then(() =>
            simulateDragBlock(s, 'upwards',
                                3, // Which li to move
                                2) // li to move above
        )
        .then(() => {
            verifySwappedBlocksInTree(s, assert);
            verifySwappedBlocksInDom(s, assert);
            done();
        });
    });
    QUnit.test('blocks can be reordered inside inner branch by dragging downwards', assert => {
        const done = assert.async();
        const s = appTestUtils.createTestState();
        appTestUtils.renderMockEditAppIntoDom('DefaultView', cmp => {
            s.blockTreesCmp = cmp;
            return appTestUtils.simulatePageLoad(s);
        })
        .then(() =>
            simulateDragBlock(s, 'downwards', 2, 3)
        )
        .then(() => {
            verifySwappedBlocksInTree(s, assert);
            verifySwappedBlocksInDom(s, assert);
            done();
        });
    });
    QUnit.test('blocks can be moved to child of another block by dragging upwards', assert => {
        const done = assert.async();
        const s = appTestUtils.createTestState();
        appTestUtils.renderMockEditAppIntoDom('DefaultView', cmp => {
            s.blockTreesCmp = cmp;
            return appTestUtils.simulatePageLoad(s);
        })
        .then(() =>
            simulateDragBlock(s, 'upwards', 3, 2, 'as-child')
        )
        .then(() => {
            verifyMovedBlockToChildOfInTree(s, assert, 'p');
            verifyMoveBlockToChildOfInDom(s, assert, 'p');
            done();
        });
    });
    QUnit.test('blocks can be moved to child of another block by dragging downwards', assert => {
        const done = assert.async();
        const s = appTestUtils.createTestState();
        appTestUtils.renderMockEditAppIntoDom('DefaultView', cmp => {
            s.blockTreesCmp = cmp;
            return appTestUtils.simulatePageLoad(s);
        })
        .then(() =>
            simulateDragBlock(s, 'downwards', 2, 3, 'as-child')
        )
        .then(() => {
            verifyMovedBlockToChildOfInTree(s, assert, 'h2');
            verifyMoveBlockToChildOfInDom(s, assert, 'h2');
            done();
        });
    });
    QUnit.test('blocks can be moved to child of inner block by dragging downwards', assert => {
        const done = assert.async();
        const s = appTestUtils.createTestState();
        appTestUtils.renderMockEditAppIntoDom('DefaultView', cmp => {
            s.blockTreesCmp = cmp;
            return appTestUtils.simulatePageLoad(s, undefined, 'withNestedBlockReversed');
        })
        .then(() =>
            simulateDragBlock(s, 'downwards', 2, 4, 'as-child')
        )
        .then(() => {
            verifyMovedBlockToChildOfInnerBlockInTree(s, assert);
            verifyMoveBlockToChildOfInnerBlockInDom(s, assert);
            done();
        });
        function verifyMoveBlockToChildOfInnerBlockInDom(s, assert) {
            //
            assert.equal(document.querySelector(`.initial-section > * > p`), undefined,
                        'Should remove dragged item from outer element');
            assert.equal(document.querySelector(`.initial-section > * > h2 > p > p`).nodeName,
                        'P',
                        'Should move dragged item to inner target element');
        }
        function verifyMovedBlockToChildOfInnerBlockInTree(s, assert) {
            const origBranch = document.querySelectorAll('.block-tree > li > ul');
            const innerPBranch = document.querySelectorAll('.block-tree > li > ul > li > ul > li > ul > li');
            assert.equal(getLiContents(innerPBranch[0]), 'Paragraph',
                                      'Should move dragged item to target inner branch');
            assert.equal(origBranch.length, 1, 'Should remove dragged item from outer branch');
        }
    });
    QUnit.test('blocks can be moved from inner branch to outer branch by dragging upwrads', assert => {
        const done = assert.async();
        const s = appTestUtils.createTestState();
        appTestUtils.renderMockEditAppIntoDom('DefaultView', cmp => {
            s.blockTreesCmp = cmp;
            return appTestUtils.simulatePageLoad(s);
        })
        .then(() =>
            simulateDragBlock(s, 'upwards', 3, 1)
        )
        .then(() => {
            verifyMovedParagraphBlockFromInnerBranchToOuterOneInTree(s, assert, 1, 1);
            verifyMovedParagraphFromInnerElemToOuterOneInDom(s, assert);
            done();
        });
        function verifyMovedParagraphFromInnerElemToOuterOneInDom(s, assert) {
            verifyRootChildTagsEqualInDom(s, assert, ['p', 'section', 'p']);
        }
    });
    QUnit.test('blocks can be moved from inner branch to outer branch by dragging downwards', assert => {
        const done = assert.async();
        const s = appTestUtils.createTestState();
        appTestUtils.renderMockEditAppIntoDom('DefaultView', cmp => {
            s.blockTreesCmp = cmp;
            return appTestUtils.simulatePageLoad(s);
        })
        .then(() =>
            simulateDragBlock(s, 'downwards', -3, -2)
        )
        .then(() => {
            verifyMovedParagraphBlockFromInnerBranchToOuterOneInTree(s, assert, 2, 2);
            verifyMovedParagraphFromInnerElemToOuterOneInDom(s, assert);
            done();
        });
        function verifyMovedParagraphFromInnerElemToOuterOneInDom(s, assert) {
            verifyRootChildTagsEqualInDom(s, assert, ['section', 'p', 'p']);
        }
    });
    function verifySwappedBlocksInDom(s, assert) {
        verifySectionChildTagsEqualInDom(s, assert, ['p', 'h2']);
    }
    function getBlockTreeListItems() {
        return document.querySelectorAll('.block-tree li ul li');
    }
    function getLiContents(li) {
        return li.querySelector('button.block-handle').textContent;
    }
    function getLiId(li) {
        return li.getAttribute('data-block-id');
    }
    function verifySwappedBlocksInTree(s, assert) {
        const lis = getBlockTreeListItems();
        assert.equal(getLiContents(lis[0]), 'Paragraph');
        assert.equal(getLiContents(lis[1]), 'Heading');
    }
    function verifyMovedBlockToChildOfInTree(s, assert, draggedEl) {
        const sectionBranch = document.querySelectorAll('.block-tree > li > ul > li');
        const h2Branch = document.querySelectorAll('.block-tree > li > ul > li > ul > li');
        assert.equal(getLiContents(h2Branch[0]), draggedEl === 'p' ? 'Paragraph' : 'Heading',
                                   'Should move dragged item to target inner branch');
        assert.equal(sectionBranch.length, 1, 'Should remove dragged item from outer branch');
    }
    function verifyMovedParagraphBlockFromInnerBranchToOuterOneInTree(s, assert, expectedNewPos, testBlockIdx) {
        const outerLis = document.querySelectorAll('.block-tree > li');
        assert.equal(getLiId(outerLis[expectedNewPos]), appTestUtils.testBlocks[testBlockIdx].id);
        const innerLis = document.querySelectorAll('.block-tree li ul li');
        assert.equal(innerLis.length, 1);
    }
    function verifyMoveBlockToChildOfInDom(s, assert, draggedEl) {
        const [dragElTag, targetElTag] = draggedEl === 'h2' ? ['h2', 'p'] : ['p', 'h2'];
        //
        assert.equal(document.querySelector(`.initial-section > * > ${dragElTag}`), undefined,
                     'Should remove dragged item from outer element');
        assert.equal(document.querySelector(`.initial-section > * > ${targetElTag} > ${dragElTag}`).nodeName,
                     draggedEl === 'h2' ? 'H2' : 'P',
                     'Should move dragged item to target element');
    }
});