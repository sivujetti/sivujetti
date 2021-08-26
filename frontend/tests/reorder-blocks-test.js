import * as treeTestUtils from './block-tree-mutating-testutils.js';

QUnit.module('BlockTrees', () => {
    QUnit.test('blocks can be reordered inside inner branch by dragging upwards', assert => {
        const done = assert.async();
        const s = treeTestUtils.createTestState();
        treeTestUtils.renderBlockTreeIntoDom(s, cmp => {
            s.blockTreesCmp = cmp;
            treeTestUtils.simulatePageLoad(s);
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
        const s = treeTestUtils.createTestState();
        treeTestUtils.renderBlockTreeIntoDom(s, cmp => {
            s.blockTreesCmp = cmp;
            treeTestUtils.simulatePageLoad(s);
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
    function simulateDragBlock(s, direction) {
        const simulateDragStarted = liEl => {
            const fakeDragStartEvent = {target: liEl};
            s.blockTreesCmp.pageBlocksTree.current.dragDrop.handleDragStarted(fakeDragStartEvent);
        };
        const simulateDraggedOver = (liEl, simulatedMousePosition) => {
            const fakeDragOverEvent = {target: liEl,
                                       clientY: simulatedMousePosition,
                                       preventDefault: () => null};
            s.blockTreesCmp.pageBlocksTree.current.dragDrop.handleDraggedOver(fakeDragOverEvent);
        };
        const simulateDropped = () => {
            s.blockTreesCmp.pageBlocksTree.current.dragDrop.handleDraggableDropped();
        };
        return new Promise(resolve => {
            setTimeout(() => {
                const lis = document.querySelectorAll('.block-tree li');
                const paragraphBlockLi = lis[lis.length - 1];
                const headingBlockLi = lis[lis.length - 2];
                //
                if (direction === 'upwards') {
                simulateDragStarted(paragraphBlockLi);
                simulateDraggedOver(headingBlockLi,
                                    // Simulate that mouse is above target li's center
                                    0);
                } else {
                simulateDragStarted(headingBlockLi);
                simulateDraggedOver(paragraphBlockLi,
                                    // Simulate that mouse is below target li's center
                                    Infinity);
                }
                simulateDropped();
                resolve();
            }, 0);
        });
    }
    function verifySwappedBlocksInTree(s, assert) {
        const lis = document.querySelectorAll('.block-tree li ul li');
        const getLiContents = li => li.querySelector('button.drag-handle').textContent;
        assert.equal(getLiContents(lis[0]), 'Paragraph');
        assert.equal(getLiContents(lis[1]), 'Heading');
    }
    function verifySwappedBlocksInDom(s, assert) {
        const domBranchAfter = document.getElementById('initial-section').children;
        assert.equal(domBranchAfter[0].tagName, 'P');
        assert.equal(domBranchAfter[1].tagName, 'H2');
    }
});