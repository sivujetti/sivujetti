import {__, api, http} from '@sivujetti-commons-for-edit-app';
import {setTrids, treeToTransferable} from '../../block/utils.js';
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
                const {isStoredToTreeId} = !(targetInf.isGbtRef && info.pos === 'as-child') ? targetInf
                    : {isStoredToTreeId: targetInf.data.refTreeId};
                setTrids([extDragData.block], isStoredToTreeId);
                store2.dispatch('theBlockTree/addBlockOrBranch', [extDragData, targetInf, info.pos]);
            }
            return true;
        },
        /**
         * @param {DragDropInfo} cand
         * @param {DragDropInfo|null} startLi
         */
        drop(cand, startLi) {
            const swapTargetInfo = createDropTargetInfo(cand);
            if (!extDragData) {
                const swapSourceInfo = {
                    blockId: startLi.getAttribute('data-block-id'),
                    isStoredToTreeId: startLi.getAttribute('data-is-stored-to-trid'),
                    isGbtRef: false,
                    data: null,
                    dropPos: cand.pos
                };
                store2.dispatch('theBlockTree/applySwap', [swapSourceInfo, swapTargetInfo]);
            } else {
                const swapSourceInfo = {
                    blockId: extDragData.block.id,
                    isStoredToTreeId: extDragData.block.isStoredToTreeId,
                    isGbtRef: false,
                    data: null,
                    dropPos: cand.pos
                };
                store2.dispatch('theBlockTree/applyAdd(Drop)Block', [swapSourceInfo, swapTargetInfo]);
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
            const {isStoredToTreeId} = !(targ.isGbtRef && cand.pos === 'as-child') ? targ : {isStoredToTreeId: targ.data.refTreeId};
            if (targ.isStoredToTreeId === 'main' && isStoredToTreeId !== drag.isStoredToTreeId) // normal > inside gbt
                return false;
            if (drag.isStoredToTreeId !== isStoredToTreeId) // gbt's inner > outside its tree
                return false;
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
 * @param {DragDropInfo} cand
 * @returns {BlockSwapDescriptor}
 */
function createDropTargetInfo(cand) {
    const blockId = cand.li.getAttribute('data-block-id');
    const isStoredToTreeId = cand.li.getAttribute('data-is-stored-to-trid');
    const maybeRefBlockId = cand.li.getAttribute('data-is-root-block-of');
    return !maybeRefBlockId ? {
        blockId,
        isStoredToTreeId,
        isGbtRef: false,
        data: null,
        dropPos: cand.pos
    } : {
        blockId: maybeRefBlockId,
        isStoredToTreeId: 'main',
        isGbtRef: true,
        data: {refTreesRootBlockId: blockId, refTreeId: isStoredToTreeId},
        dropPos: cand.pos
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

/**
 * @param {Array<RawBlock>} clonedTree
 * @param {Array<RawBlock>} theBlockTree
 * @returns {Boolean}
 */
function areKeysEqual(clonedTree, theBlockTree) {
    return clonedTree === JSON.parse(JSON.stringify(theBlockTree));
}

export default createDndController;
export {saveExistingBlocksToBackend, createBlockDescriptor};