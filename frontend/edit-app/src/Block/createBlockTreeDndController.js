import blockTreeUtils from '../blockTreeUtils.js';
import store, {createSelectBlockTree, createSetBlockTree, pushItemToOpQueue} from '../store.js';
import {findRefBlockOf, isTreesOutermostBlock} from './utils.js';

let BlockTrees;

/**
 * @param {BlockTree} blockTree
 * @returns {DragDropEventController}
 */
function createDndController(blockTree) {
    ({BlockTrees} = blockTree.props);
    let initial;
    let latest;
    let extDragAccepted;
    const {blockSpawner} = blockTree;
    return {
        /**
         * @param {DragDropInfo} info
         * @param {Boolean} _isExternal
         */
        begin(info, _isExternal) {
            initial = info;
            latest = initial;
        },
        /**
         * @param {DragDropInfo} info
         * @returns {Boolean}
         */
        fromExternalDragOverFirstTime(info) {
            extDragAccepted = blockSpawner.current.handleMainDndDraggedOver(info,
                isTreesOutermostBlock, findRefBlockOf);
            return extDragAccepted;
        },
        /**
         * @param {Boolean} isExternal
         */
        drop(isExternal) {
            if (isExternal) {
                blockSpawner.current.handleMainDndGotDrop();
                return;
            }
            //
            const dragTree = createSelectBlockTree(initial.li.getAttribute('data-trid'))(store.getState()).tree;
            const [dragBlock, dragBranch] = blockTreeUtils.findBlock(initial.li.getAttribute('data-block-id'), dragTree);
            let dropTree, dropBlock, dropBranch;
            if (!latest.li.getAttribute('data-last')) {
                (dropTree = createSelectBlockTree(latest.li.getAttribute('data-trid'))(store.getState()).tree);
                ([dropBlock, dropBranch] = blockTreeUtils.findBlock(latest.li.getAttribute('data-block-id'), dropTree));
            } else {
                (dropTree = createSelectBlockTree('main')(store.getState()).tree);
                if (!dropTree.length) { window.console.error('Shouldn\'t happen.'); return; }
                latest.pos = 'after';
                ([dropBlock, dropBranch] = [dropTree[dropTree.length - 1], dropTree]);
            }
            const [mutation1] = applySwap(latest, dragBlock, dragBranch, dragTree, dropBlock, dropBranch, dropTree);
            //
            const trid = mutation1.blockToMove.isStoredToTreeId;
            const {tree} = createSelectBlockTree(trid)(store.getState());
            store.dispatch(createSetBlockTree(trid)(tree, ['swap-blocks', [mutation1]]));
            store.dispatch(pushItemToOpQueue(`swap-blocks-of-tree##${trid}`, {
                doHandle: trid !== 'main' || !blockTree.currentPageIsPlaceholder
                    ? () => BlockTrees.saveExistingBlocksToBackend(createSelectBlockTree(trid)(store.getState()).tree, trid)
                    : null
                ,
                doUndo: () => {
                    const treeBefore = mutation1.doRevert();
                    store.dispatch(createSetBlockTree(trid)(treeBefore, ['undo-swap-blocks', mutation1]));
                },
                args: [],
            }));
        },
        /**
         * @param {DragDropInfo} _info
         * @param {Boolean} isExternal
         * @returns {Boolean}
         */
        dragOut(_info, isExternal) {
            if (isExternal)
                blockSpawner.current.handleMainDndDraggedOut();
        },
        /**
         * @param {DragDropInfo} to
         * @param {DragDropInfo} from
         * @param {Boolean} isExternal
         */
        swap(to, from, isExternal) {
            latest = to;
            if (isExternal) {
                if (!extDragAccepted) return;
                blockSpawner.current.handleMainDndSwappedBlocks(to, from, applySwap);
            }
        },
        /**
         */
        end() {
            //
        }
    };
}

/**
 * @param {DragDropInfo} latest
 * @param {RawBlock} dragBlock
 * @param {Array<RawBlock>} dragBranch
 * @param {Array<RaƒwBlock>} dragTree
 * @param {RawBlock} dropBlock
 * @param {Array<RawBlock>} dropBranch
 * @param {Array<RawBlock>} dropTree
 * @returns {SwapChangeEventData}
 */
function applySwap(latest, dragBlock, dragBranch, dragTree, dropBlock, dropBranch, dropTree) {
    let mutation1 = null;
    let mutation2 = null;
    //
    const isBefore = latest.pos === 'before';
    if (isBefore || latest.pos === 'after') {
        if (dragBranch === dropBranch) {
            const toIdx = dragBranch.indexOf(dropBlock);
            const fromIndex = dragBranch.indexOf(dragBlock);
            const realTo = isBefore ? toIdx : toIdx + 1;
            dragBranch.splice(realTo, 0, dragBlock);
            dragBranch.splice(fromIndex + (fromIndex > realTo ? 1 : 0), 1);
            //
            mutation1 = createMutationInfo(dragBlock, dropBlock, latest, () => {
                dragBranch.splice(fromIndex + (fromIndex > realTo ? 1 : 0), 0, dragBlock);
                dragBranch.splice(realTo, 1);
                return dragTree;
            });
        } else {
            mutation1 = moveToBeforeOrAfter(dragBlock, dragBranch, dropBlock, dropBranch, isBefore, latest, dragTree);
        }
    } else if (latest.pos === 'as-child') {
        mutation1 = moveToChild(dropBlock, dropBlock, dragBlock, dragBranch, dragTree, latest);
    }
    return [mutation1, mutation2];
}

/**
 * @param {RawBlock} dragBlock
 * @param {Array<RawBlock>} dragBranch
 * @param {RawBlock} dropBlock
 * @param {Array<RawBlock>} dropBranch
 * @param {Boolean} isBefore
 * @param {DragDropInfo} dropInfo
 * @param {Array<RawBlock>} dragBlockTree
 * @returns {SwapChangeEventData}
 */
function moveToBeforeOrAfter(dragBlock, dragBranch, dropBlock, dropBranch, isBefore, dropInfo, dragBlockTree) {
    const dragBranchIdx = dragBranch.indexOf(dragBlock);
    const dropBranchIdx = dropBranch.indexOf(dropBlock);
    const pos = dropBranchIdx + (isBefore ? 0 : 1);
    dropBranch.splice(pos, 0, dragBlock);
    dragBranch.splice(dragBranchIdx, 1);
    //
    return createMutationInfo(dragBlock, dropBlock, dropInfo, () => {
        dragBranch.splice(dragBranchIdx, 0, dragBlock);
        dropBranch.splice(pos, 1);
        return dragBlockTree;
    });
}

/**
 * @param {RawBlock|null} to
 * @param {RawBlock} dropBlock
 * @param {RawBlock} dragBlock
 * @param {Array<RawBlock>} dragBranch
 * @param {Array<RawBlock>} dragBlockTree
 * @param {DragDropInfo} dropInfo
 * @returns {SwapChangeEventData}
 */
function moveToChild(to, dropBlock, dragBlock, dragBranch, dragBlockTree, dropInfo) {
    if (!dropBlock) return moveToRoot(dragBlock, dragBranch, dragBlockTree, dropInfo);
    to.children.push(dragBlock);
    const pos = dragBranch.indexOf(dragBlock);
    dragBranch.splice(pos, 1);
    //
    return createMutationInfo(dragBlock, dropBlock, dropInfo, () => {
        to.children.pop();
        dragBranch.splice(pos, 0, dragBlock);
        return dragBlockTree;
    });
}

/**
 * @param {RawBlock} dragBlock
 * @param {Array<RawBlock>} dragBranch
 * @param {Array<RawBlock>} rootTree
 * @param {DragDropInfo} dropInfo
 * @returns {SwapChangeEventData}
 */
function moveToRoot(dragBlock, dragBranch, rootTree, dropInfo) {
    rootTree.push(dragBlock);
    const pos = dragBranch.indexOf(dragBlock);
    dragBranch.splice(pos, 1);
    //
    return createMutationInfo(dragBlock, {root: 1}, dropInfo, () => {
        rootTree.pop();
        dragBranch.splice(pos, 0, dragBlock);
        return {root: 1};
    });
}

/**
 * @param {RawBlock} dragBlock
 * @param {RawBlock} dropBlock
 * @param {DragDropInfo} dropInfo
 * @param {() => Array<RawBlock>} doRevert
 * @returns {SwapChangeEventData}
 */
function createMutationInfo(dragBlock, dropBlock, {pos}, doRevert) {
    return {
        blockToMove: dragBlock,
        blockToMoveTo: dropBlock,
        position: pos,
        doRevert,
    };
}

export default createDndController;
