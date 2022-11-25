import {__, http} from '@sivujetti-commons-for-edit-app';
import {setTrids, treeToTransferable} from '../../Block/utils.js';
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
            if (!extDragData) {
                const source = startLi.getAttribute('data-is-stored-to-trid');
                const target = getIsStoredToTridForTarget(cand.li);
                store2.dispatch('theBlockTree/applySwap', [{isStoredToTreeId: source}, {isStoredToTreeId: target}]);
            } else {
                const source = 'main'; // todo
                const target = getIsStoredToTridForTarget(cand.li);
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

            const drag = !extBlock ? createBlockDescriptorFromLi(startLi) : createBlockDescriptor(extBlock, extBlock.isStoredToTreeId);
            const targ = createBlockDescriptorFromLi(cand.li);

            // Reject swaps between normal, and global blocks tree's inner blocks
            if (drag.isStoredToTreeId === 'main' && (targ.isStoredToTreeId !== 'main' || (targ.isGbtRef && cand.pos === 'as-child')))
                return false;
            else if (drag.isStoredToTreeId !== 'main' && !drag.isGbtRef && targ.isStoredToTreeId === 'main') // gbt's inner outside its root
                return false;

            store2.dispatch('theBlockTree/swap', [drag, targ, cand.pos]);
        },
        /**
         * @param {Number|null} lastAcceptedSwapIdx
         */
        end(lastAcceptedSwapIdx) {
            if (dropped)
                return;
            if (lastAcceptedSwapIdx === null) // No moves at all
                return;
            if (lastAcceptedSwapIdx === 0 && !extDragData) // Had moves, but returned to initial
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
 * @returns {String}
 */
function getIsStoredToTridForTarget(li) {
    const maybeRefBlockId = li.getAttribute('data-is-root-block-of');
    if (!maybeRefBlockId) return li.getAttribute('data-is-stored-to-trid');

    const refBlock = blockTreeUtils.findBlock(maybeRefBlockId, store2.get().theBlockTree)[0];
    return refBlock.isStoredToTreeId;
}

/**
 * @param {HTMLLIElement} li
 * @returns {BlockDescriptor}
 */
function createBlockDescriptorFromLi(li) {
    const isStoredToTreeId = li.getAttribute('data-is-stored-to-trid');
    const maybeRefBlockId = li.getAttribute('data-is-root-block-of');
    // root tree's block, or global block tree's inner block
    if (!maybeRefBlockId) {
        const blockId = li.getAttribute('data-block-id');
        const rootOrInnerTree = blockTreeUtils.getRootFor(isStoredToTreeId, store2.get().theBlockTree);
        const block = blockTreeUtils.findBlock(blockId, rootOrInnerTree)[0];
        return createBlockDescriptor(block, isStoredToTreeId);
    // Global block tree's root block
    } else {
        const gbtRef = blockTreeUtils.findBlock(maybeRefBlockId, store2.get().theBlockTree)[0];
        return createBlockDescriptor(gbtRef, 'main');
    }
}

/**
 * @param {RawBlock} block
 * @param {String} isStoredToTreeId
 * @returns {BlockDescriptor}
 */
function createBlockDescriptor(block, isStoredToTreeId) {
    const [isGbtRef, data] = block.type !== 'GlobalBlockReference'
        ? [false, null]
        : [true, block.globalBlockTreeId];
    return {blockId: block.id, isStoredToTreeId, isGbtRef, data};
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
