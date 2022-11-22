import {__, http} from '@sivujetti-commons-for-edit-app';
import {findRefBlockOf, isTreesOutermostBlock, setTrids, treeToTransferable} from '../../Block/utils.js';
import toasters from '../../commons/Toaster.jsx';
import store, {selectCurrentPageDataBundle} from '../../store.js';
import store2 from '../../store2.js';
import blockTreeUtils from './blockTreeUtils.js';

/**
 * @param {BlockTree} _blockTree
 * @returns {DragDropEventController}
 */
function createDndController(_blockTree) {
    let initialTree;
    let extDragData;
    let dropped;
    return {
        /**
         * @param {DragDropInfo} info
         * @param {Boolean} isExternal
         */
        begin(info) {
            initialTree = JSON.parse(JSON.stringify(store2.get().theBlockTree)); // getKeys, restoreFromKeys?
            dropped = false;
            if (extDragData) {
                if (!info.li.getAttribute('data-last')) {
                const targetIsStoredToTreeId = info.li.getAttribute('data-trid');
                setTrids([extDragData.block], targetIsStoredToTreeId);
                store2.dispatch('theBlockTree/addBlockOrBranch', [extDragData, createBlockDescriptorFromLi(info.li), info.pos]);
                } else {
                throw new Error('NOt impl');
                }
            }
        },
        /**
         * @param {DragDropInfo} cand
         * @param {DragDropInfo|null} startLi
         */
        drop(cand, startLi) {
            if (!extDragData) {
                const source = startLi.getAttribute('data-trid');
                const target = cand.li.getAttribute('data-trid');
                store2.dispatch('theBlockTree/applySwap', [{isStoredToTreeId: source}, {isStoredToTreeId: target}]);
            } else {
                const source = 'main'; // todo
                const target = cand.li.getAttribute('data-trid');
                store2.dispatch('theBlockTree/applyAdd(Drop)Block', [{isStoredToTreeId: source}, {isStoredToTreeId: target}]);
            }
            dropped = true;
        },
        /**
         * @param {DragDropInfo|null} info
         * @returns {Boolean}
         */
        dragOut(_info) {
            if (!extDragData) return;
            const {id, isStoredToTreeId} = extDragData.block;
            store2.dispatch('theBlockTree/undoAdd(Drop)Block', [id, isStoredToTreeId]);
        },
        /**
         * @param {DragDropInfo} to
         * @param {DragDropInfo} _prevCand
         * @param {DragDropInfo|null} startLi
         * @returns {Boolean|undefined}
         */
        swap(cand, _prevCand, startLi) {
            const extBlock = !extDragData ? null : extDragData.block;

            if (!cand.li.getAttribute('data-last')) {
                const drag = !extBlock ? foo(startLi) : createBlockDescriptor(extBlock, extBlock.isStoredToTreeId);
                const targ = foo(cand.li);

                // Reject swaps between normal and global blocks
                if (drag.trid === 'main' && (targ.trid !== 'main' || targ.isGbtRef))
                    return false;
                else if (drag.trid !== 'main' && !drag.isGbtRef && targ.trid === 'main') // gbt's inner outside its root
                    return false;

                store2.dispatch('theBlockTree/swap', [drag, targ, cand.pos]);
            } else {
                if (!extBlock) {
                    //
                } else {
                    if (extBlock.isStoredToTreeId !== 'main') return false;
                }
            }
        },
        /**
         * @param {Number|null} lastAcceptedSwapIdx
         */
        end(lastAcceptedSwapIdx) {
            if (dropped)
                return;
            //if (dragOriginIsExternal) ??
            //    return;
            if (lastAcceptedSwapIdx === null) // No moves, todo jos 0? 
                return;
            store2.dispatch('theBlockTree/undo', [initialTree, null, null]);
        },
        /**
         * @param {SpawnDescriptor|null}
         */
        setExternalOriginData(data) {
            extDragData = data;
        },
    };
}

/**
 * @param {HTMLLIElement} li
 * @returns {BlockDescriptor}
 */
function foo(li) {
    if (li.getAttribute('data-trid') === 'main') // move to this.begin()?
        return createBlockDescriptorFromLi(li);
    if (!isTreesOutermostBlock(li.getAttribute('data-block-id'),
                blockTreeUtils.getRootFor(li.getAttribute('data-trid'), store2.get().theBlockTree)))
        return createBlockDescriptorFromLi(li);
    return createBlockDescriptor(findRefBlockOf(li.getAttribute('data-trid'), store2.get().theBlockTree), 'main', true);
}

/**
 * @param {HTMLLIElement} li
 * @returns {BlockDescriptor}
 */
function createBlockDescriptorFromLi(li) {
    const blockId = li.getAttribute('data-block-id');
    const trid = li.getAttribute('data-trid');
    const rootOrInnerTree = blockTreeUtils.getRootFor(trid, store2.get().theBlockTree);
    const block = blockTreeUtils.findBlock(blockId, rootOrInnerTree)[0];
    return createBlockDescriptor(block, trid);
}

/**
 * @param {RawBlock} block
 * @param {String} trid
 * @param {Boolean} isGbtRef = false
 * @returns {BlockDescriptor}
 */
function createBlockDescriptor(block, trid, isGbtRef = false) {
    return {blockId: block.id, trid, isGbtRef};
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

/**
 * @param {Array<RawBlock>} newBlockTree
 * @param {String} trid
 * @returns {Promise<Boolean>}
 * @access public
 */
function saveExistingBlocksToBackend(newBlockTree, trid) {
    let url = '';
    if (trid === 'main') {
        const {page} = selectCurrentPageDataBundle(store.getState());
        url = `/api/pages/${page.type}/${page.id}/blocks`;
    } else
        url = `/api/global-block-trees/${trid}/blocks`;
    return http.put(url, {blocks: treeToTransferable(newBlockTree)})
        .then(resp => {
            if (resp.ok !== 'ok') throw new Error('-');
            return true;
        })
        .catch(err => {
            window.console.error(err);
            toasters.editAppMain(__('Something unexpected happened.'), 'error');
            return false;
        });
}

export default createDndController;
export {saveExistingBlocksToBackend, createBlockDescriptor};
