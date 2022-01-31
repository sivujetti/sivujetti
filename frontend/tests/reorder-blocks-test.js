import * as appTestUtils from './edit-app-testutils.js';
import {simulateDragBlock, verifySectionChildTagsEqualInDom} from './render-blocks-testutils.js';

QUnit.module('BlockTrees', () => {
    QUnit.test('blocks can be reordered inside inner branch by dragging upwards', assert => {
        const done = assert.async();
        const s = appTestUtils.createTestState();
        appTestUtils.renderMockEditAppIntoDom('DefaultView', cmp => {
            s.blockTreesCmp = cmp;
            return appTestUtils.simulatePageLoad(s);
        })
        .then(() =>
            simulateDragBlock(s, 'upwards')
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
            simulateDragBlock(s, 'downwards')
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
            simulateDragBlock(s, 'upwards', 'as-child')
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
            simulateDragBlock(s, 'downwards', 'as-child')
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
            simulateDragBlock(s, 'downwards', 'as-child', document.querySelector('.block-tree li ul li ul li'))
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
    function verifySwappedBlocksInDom(s, assert) {
        verifySectionChildTagsEqualInDom(s, assert, ['p', 'h2']);
    }
    function getBlockTreeListItems() {
        return document.querySelectorAll('.block-tree li ul li');
    }
    function getLiContents(li) {
        return li.querySelector('button.block-handle').textContent;
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