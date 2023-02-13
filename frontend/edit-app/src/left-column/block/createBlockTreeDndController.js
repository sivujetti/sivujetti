import {__, api, http} from '@sivujetti-commons-for-edit-app';
import {treeToTransferable} from '../../block/utils.js';
import toasters from '../../commons/Toaster.jsx';
import store, {selectCurrentPageDataBundle} from '../../store.js';
import store2 from '../../store2.js';

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
         * @returns {Boolean}
         */
        begin(info) {
            if (extDragData && extDragData.block.type === 'GlobalBlockReference' && info.li.getAttribute('data-is-stored-to-trid') !== 'main') {
                const isBeforeOrAfterGbtRef = (info.pos === 'before' || info.pos === 'after') && info.li.getAttribute('data-is-root-block-of');
                if (!isBeforeOrAfterGbtRef) return false;
            }
            api.webPageIframe.getEl().style.pointerEvents = 'none';
            initialTree = JSON.parse(JSON.stringify(store2.get().theBlockTree));
            dropped = false;
            if (extDragData) {
                const targetInf = createBlockDescriptorFromLi(info.li);
                store2.dispatch('theBlockTree/addBlockOrBranch', [extDragData, targetInf, info.pos]);
            }
            return true;
        },
        /**
         * @param {DragDropInfo} cand
         * @param {DragDropInfo|null} startLi
         */
        drop(cand, startLi) {
            const swapTargetInfo = createDragItemInfo(cand.li);
            if (!extDragData) {
                const swapSourceInfo = createDragItemInfo(startLi);
                const treeTransfer = determineTransferType(swapSourceInfo, swapTargetInfo, cand);
                store2.dispatch('theBlockTree/applySwap', [swapSourceInfo, swapTargetInfo, cand.pos, treeTransfer]);
            } else {
                const [isStoredToTreeId, wasSpeci] = getRealTarget(swapTargetInfo, cand.pos);
                const treeTransfer = !wasSpeci
                    ? swapTargetInfo.isStoredToTreeId === 'main' ? 'out-of-gbt' : 'into-gbt'
                    : 'into-gbt';
                const swapSourceInfo = {
                    blockId: extDragData.block.id,
                    isStoredToTreeId,
                    isGbtRef: extDragData.block.type === 'GlobalBlockReference',
                    data: null
                };
                store2.dispatch('theBlockTree/applyAdd(Drop)Block', [swapSourceInfo, swapTargetInfo, cand.pos, treeTransfer]);
            }
            api.webPageIframe.getEl().style.pointerEvents = '';
            dropped = true;
        },
        /**
         * @param {DragDropInfo|null} info
         * @returns {Boolean}
         */
        dragOut(_info) {
            if (!extDragData) return;
            const {id, isStoredToTreeId} = extDragData.block;
            store2.dispatch('theBlockTree/undoAdd(Drop)Block', [id, isStoredToTreeId, null]);
        },
        /**
         * @param {DragDropInfo} to
         * @param {DragDropInfo} _prevCand
         * @param {HTMLLIElement|null} startLi
         * @returns {Boolean|undefined}
         */
        swap(cand, _prevCand, startLi) {
            const extBlock = !extDragData ? null : extDragData.block;
            const drag = !extBlock ? createBlockDescriptorFromLi(startLi) : createBlockDescriptor(extBlock);
            const targ = createBlockDescriptorFromLi(cand.li);
            const [targIsStoredTo, targetIsSpeci] = getRealTarget(targ, cand.pos);
            // drag is external gbtref and target is inner block of gbtref
            if (extBlock && extBlock.type === 'GlobalBlockReference' && (targ.isStoredToTreeId !== 'main' || targetIsSpeci)) {
                return false;
            }
            // drag is not external gbtref and target is inner block of _some other_ gbtref
            if (!extBlock &&
                (drag.isGbtRef || drag.isStoredToTreeId !== 'main') &&
                ((targ.isStoredToTreeId !== 'main' || targetIsSpeci) &&
                targIsStoredTo !== drag.isStoredToTreeId)) {
                return false;
            }
            store2.dispatch('theBlockTree/swap', [drag, targ, cand.pos]);
        },
        /**
         * @param {Number|null} lastAcceptedSwapIdx
         */
        end(lastAcceptedSwapIdx) {
            if (dropped)
                return;
            api.webPageIframe.getEl().style.pointerEvents = '';
            if (lastAcceptedSwapIdx === null) // No moves at all
                return;
            if (lastAcceptedSwapIdx === 0 && !extDragData && areKeysEqual(initialTree, store2.get().theBlockTree)) // Had moves, but returned to initial
                return;
            store2.dispatch('theBlockTree/undo', [initialTree, null, null, false]);
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
function createDragItemInfo(li) {
    const blockId = li.getAttribute('data-block-id');
    const isStoredToTreeId = li.getAttribute('data-is-stored-to-trid');
    const maybeRefBlockId = li.getAttribute('data-is-root-block-of');
    return !maybeRefBlockId ? {
        blockId,
        isStoredToTreeId,
        isGbtRef: false,
        data: null,
    } : {
        blockId: maybeRefBlockId,
        isStoredToTreeId: 'main',
        isGbtRef: true,
        data: {refTreesRootBlockId: blockId, refTreeId: isStoredToTreeId},
    };
}

/**
 * @param {HTMLLIElement} li
 * @returns {BlockDescriptor}
 */
function createBlockDescriptorFromLi(li) {
    const isStoredToTreeId = li.getAttribute('data-is-stored-to-trid');
    const maybeRefBlockId = li.getAttribute('data-is-root-block-of');
    const blockId = li.getAttribute('data-block-id');
    // root tree's block, or global block tree's inner block
    if (!maybeRefBlockId) {
        return {blockId, isStoredToTreeId, isGbtRef: false, data: null};
    // Global block tree's root block
    } else {
        return {blockId: maybeRefBlockId, isStoredToTreeId: 'main', isGbtRef: true, data: {refTreesRootBlockId: blockId, refTreeId: isStoredToTreeId}};
    }
}

/**
 * @param {RawBlock} block
 * @returns {BlockDescriptor}
 */
function createBlockDescriptor(block) {
    return {blockId: block.id, isStoredToTreeId: block.isStoredToTreeId, isGbtRef: false, data: null};
}

/**
 * @param {Array<RawBlock>} newBlockTree
 * @param {String} trid
 * @param {Page} page = null
 * @returns {Promise<Boolean>}
 * @access public
 */
function saveExistingBlocksToBackend(newBlockTree, trid, page = null) {
    let url = '';
    if (trid === 'main') {
        if (!page) page = selectCurrentPageDataBundle(store.getState()).page;
        url = `/api/pages/${page.type}/${page.id}/blocks`;
    } else
        url = `/api/global-block-trees/${trid}/blocks`;
    return http.put(url, {blocks: treeToTransferable(newBlockTree)})
        .then(resp => {
            if (resp.ok !== 'ok') throw new Error(typeof resp.err !== 'string' ? '-' : resp.err);
            return true;
        })
        .catch(err => {
            if (err.message !== 'Not permitted.') {
                window.console.error(err);
                toasters.editAppMain(__('Something unexpected happened.'), 'error');
            } else {
                toasters.editAppMain(__('todo14'), 'error');
            }
            return false;
        });
}

/**
 * @param {Array<RawBlock>} clonedTree
 * @param {Array<RawBlock>} theBlockTree
 * @returns {Boolean}
 */
function areKeysEqual(clonedTree, theBlockTree) {
    return clonedTree === JSON.parse(JSON.stringify(theBlockTree));
}

/**
 * @param {BlockDescriptor} swapSourceInfo
 * @param {BlockDescriptor} swapTargetInfo
 * @param {DragDropInfo} dropInfo
 * @returns {treeTransferType}
 */
function determineTransferType(swapSourceInfo, swapTargetInfo, {pos}) {
    if (swapSourceInfo.isStoredToTreeId === 'main' &&
        (swapTargetInfo.isStoredToTreeId !== 'main' || getRealTarget(swapTargetInfo, pos)[1]))
        return 'into-gbt';
    else if (swapSourceInfo.isStoredToTreeId !== 'main' && swapTargetInfo.isStoredToTreeId === 'main')
        return 'out-of-gbt';
    return 'none';
}

/**
 * @param {BlockDescriptor} target Drop or swap target
 * @param {dropPosition} pos Drop or swap position
 * @returns {[String, Boolean]} [targetIsStoredToTreeId, isTargetAsChildOfGbtRef]
 */
function getRealTarget(target, pos) {
    return !(target.isGbtRef && pos === 'as-child')
        ? [target.isStoredToTreeId, false]
        : [target.data.refTreeId, true];
}

export default createDndController;
export {saveExistingBlocksToBackend, createBlockDescriptor};
