import * as treeTestUtils from './block-tree-mutating-testutils.js';

QUnit.module('BlockTrees', () => {
    QUnit.test('user can reorder inner branch blocks', assert => {
        const done = assert.async();
        const s = treeTestUtils.createTestState();
        treeTestUtils.renderBlockTreeIntoDom(s, cmp => {
            s.blockTreesCmp = cmp;
            treeTestUtils.simulatePageLoad(s);
        })
        .then(() =>
            simulateDragBlockUpwards(s)
        )
        .then(() => {
            verifyReOrderedBlockTree(s,assert);
            verifyReOrderedDom(s,assert);
            done();
        });
    });
    function simulateDragBlockUpwards(s) {
        const simulateDragStarted = liEl => {
            const fakeDragStartEvent = {target: liEl};
            s.blockTreesCmp.pageBlocksTree.current.dragUtils.handleDragStarted(fakeDragStartEvent);
        };
        const simulateDraggedOver = liEl => {
            const fakeDragOverEvent = {target: liEl,
                                       clientY: 0, // Simulate that mouse is above li's center
                                       preventDefault: () => null};
            s.blockTreesCmp.pageBlocksTree.current.dragUtils.handleDraggedOver(fakeDragOverEvent);
        };
        const simulateDropped = () => {
            s.blockTreesCmp.pageBlocksTree.current.dragUtils.handleDraggableDropped();
        };
        return new Promise(resolve => {
            setTimeout(() => {
                const lis = document.querySelectorAll('.block-tree li');
                const paragraphBlockLi = lis[lis.length - 1];
                const headingBlockLi = lis[lis.length - 2];
                //
                simulateDragStarted(paragraphBlockLi);
                simulateDraggedOver(headingBlockLi);
                simulateDropped();
                resolve();
            }, 0);
        });
    }
    function verifyReOrderedBlockTree(s, assert) {
        const lis = document.querySelectorAll('.block-tree li ul li');
        const getLiContents = li => li.querySelector('button.drag-handle').textContent;
        assert.equal(getLiContents(lis[0]), 'Paragraph');
        assert.equal(getLiContents(lis[1]), 'Heading');
    }
    function verifyReOrderedDom(s, assert) {
        const domBranchAfter = document.getElementById('initial-section').children;
        assert.equal(domBranchAfter[0].tagName, 'P');
        assert.equal(domBranchAfter[1].tagName, 'H2');
    }
});