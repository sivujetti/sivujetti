import * as appTestUtils from './edit-app-testutils.js';

QUnit.module('BlockTrees', () => {
    QUnit.test('blocks can be reordered inside inner branch by dragging upwards', assert => {
        const done = assert.async();
        const s = appTestUtils.createTestState();
        appTestUtils.renderMockEditAppIntoDom(s, cmp => {
            s.blockTreesCmp = cmp;
            appTestUtils.simulatePageLoad(s);
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
        appTestUtils.renderMockEditAppIntoDom(s, cmp => {
            s.blockTreesCmp = cmp;
            appTestUtils.simulatePageLoad(s);
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
        appTestUtils.renderMockEditAppIntoDom(s, cmp => {
            s.blockTreesCmp = cmp;
            appTestUtils.simulatePageLoad(s);
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
        appTestUtils.renderMockEditAppIntoDom(s, cmp => {
            s.blockTreesCmp = cmp;
            appTestUtils.simulatePageLoad(s);
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
    function simulateDragBlock(s, direction, t = null) {
        const simulateDragStarted = liEl => {
            const fakeDragStartEvent = {target: liEl};
            s.blockTreesCmp.blockTree.current.dragDrop.handleDragStarted(fakeDragStartEvent);
        };
        const simulateDraggedOver = (liEl, simulatedMousePosition) => {
            const fakeDragOverEvent = {target: liEl,
                                       clientY: simulatedMousePosition,
                                       preventDefault: () => null};
            s.blockTreesCmp.blockTree.current.dragDrop.handleDraggedOver(fakeDragOverEvent);
        };
        const simulateDropped = () => {
            s.blockTreesCmp.blockTree.current.dragDrop.handleDraggableDropped();
        };
        return new Promise(resolve => {
            const lis = document.querySelectorAll('.block-tree li');
            const paragraphBlockLi = lis[lis.length - 2];
            const headingBlockLi = lis[lis.length - 3];
            //
            if (direction === 'upwards') {
                simulateDragStarted(paragraphBlockLi);
                if (t !== 'as-child')
                    simulateDraggedOver(headingBlockLi,
                                        // Simulate that mouse is above target li's center
                                        0);
                else
                    simulateDraggedOver(headingBlockLi,
                                        // Simulate that mouse is below target li's bottom treshold
                                        Infinity);
            } else {
                simulateDragStarted(headingBlockLi);
                if (t !== 'as-child')
                    simulateDraggedOver(paragraphBlockLi,
                                        // Simulate that mouse is below target li's center
                                        Infinity);
                else
                    simulateDraggedOver(paragraphBlockLi,
                                        // Simulate that mouse is above target li's top treshold
                                        0);
            }
            simulateDropped();
            resolve();
        });
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
    function verifySwappedBlocksInDom(s, assert) {
        const domBranchAfter = document.getElementById('initial-section').children;
        assert.equal(domBranchAfter[0].tagName, 'P');
        assert.equal(domBranchAfter[1].tagName, 'H2');
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
        assert.equal(document.querySelector(`#initial-section > ${dragElTag}`), undefined,
                     'Should remove dragged item from outer element');
        assert.equal(document.querySelector(`#initial-section > ${targetElTag} > ${dragElTag}`).nodeName,
                     draggedEl === 'h2' ? 'H2' : 'P',
                     'Should move dragged item to target element');
    }
});