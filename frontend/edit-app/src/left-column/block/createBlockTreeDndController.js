import {__, api, http} from '@sivujetti-commons-for-edit-app';
import {setTrids, treeToTransferable} from '../../block/utils.js';
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
            api.webPageIframe.getEl().style.pointerEvents = 'none';
            initialTree = JSON.parse(JSON.stringify(store2.get().theBlockTree));
            dropped = false;
            if (extDragData) {
                const targetInf = createBlockDescriptorFromLi(info.li);
                setTrids([extDragData.block], targetInf.isStoredToTreeId);
                store2.dispatch('theBlockTree/addBlockOrBranch', [extDragData, targetInf, info.pos]);
            }
        },
        /**
         * @param {DragDropInfo} cand
         * @param {DragDropInfo|null} startLi
         */
        drop(cand, startLi) {
            const [isStoredToTreeId, isRootBlockOfGbtRef, gbtRefBlockId] = getIsStoredToTridForTarget(cand.li);
            const swapTargetInfo = {
                blockId: cand.li.getAttribute('data-block-id'),
                blockIsStoredToTreeId: isStoredToTreeId,
                blockIsRootOfGbtRef: isRootBlockOfGbtRef,
                blocksOwnerGbtRefBlockId: gbtRefBlockId,
                dropPos: cand.pos
            };
            if (!extDragData) {
                const swapSourceInfo = {
                    blockId: startLi.getAttribute('data-block-id'),
                    blockIsStoredToTreeId: startLi.getAttribute('data-is-stored-to-trid'),
                    blockIsRootOfGbtRef: false,
                    blocksOwnerGbtRefBlockId: null,
                    dropPos: cand.pos
                };
                store2.dispatch('theBlockTree/applySwap', [swapSourceInfo, swapTargetInfo]);
            } else {
                const swapSourceInfo = {
                    blockId: extDragData.block.id,
                    blockIsStoredToTreeId: extDragData.block.isStoredToTreeId,
                    blockIsRootOfGbtRef: false,
                    blocksOwnerGbtRefBlockId: null,
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

            // Reject swaps between normal, and global blocks tree's inner blocks
            if (drag.isStoredToTreeId === 'main' && (targ.isStoredToTreeId !== 'main' || (targ.isRootOfGbtRef && cand.pos === 'as-child')))
                return false;
            else if (drag.isStoredToTreeId !== 'main' && !drag.isRootOfGbtRef && targ.isStoredToTreeId === 'main') // gbt's inner outside its root
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
            if (lastAcceptedSwapIdx === 0 && !extDragData) // Had moves, but returned to initial
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
 * @returns {[String, Boolean, String|null]}
 */
function getIsStoredToTridForTarget(li) {
    const maybeRefBlockId = li.getAttribute('data-is-root-block-of');
    if (!maybeRefBlockId) return [li.getAttribute('data-is-stored-to-trid'), false, null];

    const refBlock = blockTreeUtils.findBlock(maybeRefBlockId, store2.get().theBlockTree)[0];
    return [li.getAttribute('data-is-stored-to-trid'), true, refBlock.id];
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
        return {blockId, isStoredToTreeId, isRootOfGbtRef: false, ownerGbtRefBlockId: null};
    // Global block tree's root block
    } else {
        return {blockId, isStoredToTreeId, isRootOfGbtRef: true, ownerGbtRefBlockId: maybeRefBlockId};
    }
}

/**
 * @param {RawBlock} block
 * @returns {BlockDescriptor}
 */
function createBlockDescriptor(block) {
    return {blockId: block.id, isStoredToTreeId: block.isStoredToTreeId, isRootOfGbtRef: false, ownerGbtRefBlockId: null};
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
