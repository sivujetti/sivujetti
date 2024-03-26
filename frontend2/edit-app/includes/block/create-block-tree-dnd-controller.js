import {
    api,
    blockTreeUtils,
} from '@sivujetti-commons-for-edit-app';
import {
    createBlockTreeInsertAtOpArgs,
    createBlockTreeMoveToOpArgs,
} from './tree-dnd-controller-funcs.js';

/**
 * @param {SaveButton} saveButton
 * @returns {DragDropEventController}
 */
function createDndController(saveButton) {
    let extDragData;
    let dropped;
    return {
        /**
         * @param {DragDropInfo} info
         * @returns {Boolean}
         */
        begin(info) {
            if (extDragData && extDragData.block.type === 'GlobalBlockReference' && info.li.getAttribute('data-is-stored-to-tree-id') !== 'main') {
                const isBeforeOrAfterGbtRef = (info.pos === 'before' || info.pos === 'after') && info.li.getAttribute('data-is-root-block-of');
                if (!isBeforeOrAfterGbtRef) return false;
            }
            api.webPagePreview.getEl().style.pointerEvents = 'none';
            dropped = false;
            return true;
        },
        /**
         * @param {DragDropInfo} cand
         * @param {DragDropInfo|null} startLi
         */
        drop(cand, startLi) {
            if (!extDragData) {
                const drag = createBlockDescriptorFromLi(startLi);
                const targ = createBlockDescriptorFromLi(cand.li);
                const [targIsStoredTo, targetIsSpeci] = getRealTarget(targ, cand.pos);
                // target is inner block of _some other_ gbtref
                if ((drag.isGbtRef || drag.isStoredToTreeId !== 'main') &&
                    ((targ.isStoredToTreeId !== 'main' || targetIsSpeci) &&
                    targIsStoredTo !== drag.isStoredToTreeId)) {
                    return false;
                }
                saveButton.pushOp(...createBlockTreeMoveToOpArgs(drag, targ, cand.pos));
            } else {
                const targetInf = createBlockDescriptorFromLi(cand.li);
                const insertBlockToOpArgs = createBlockTreeInsertAtOpArgs(extDragData, targetInf, cand.pos);
                if (!extDragData.isReusable) // Plain block -> add block but no styles
                    saveButton.pushOp(...insertBlockToOpArgs);
                else { // Reusable -> add block and copies of all of its styles recursively
                    // todo
                }
            }
            api.webPagePreview.getEl().style.pointerEvents = '';
            dropped = true;
        },
        /**
         * @param {DragDropInfo|null} info
         * @returns {Boolean}
         */
        dragOut(_info) {
            // Do nothing
        },
        /**
         * @param {DragDropInfo} to
         * @param {DragDropInfo} _prevCand
         * @param {HTMLLIElement|null} startLi
         * @returns {Boolean|undefined}
         */
        swap(cand, _prevCand, startLi) {
            // todo
        },
        /**
         * @param {Number|null} _lastAcceptedSwapIdx
         */
        end(_lastAcceptedSwapIdx) {
            if (dropped)
                return;
            api.webPagePreview.getEl().style.pointerEvents = '';
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
function createBlockDescriptorFromLi(li) {
    const isStoredToTreeId = li.getAttribute('data-is-stored-to-tree-id');
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
 * @param {SaveButton} saveButton
 * @returns {BlockDescriptor}
 */
function createBlockDescriptor(block, saveButton) {
    const isStoredToTreeId = blockTreeUtils.getIsStoredToTreeId(block.id, saveButton.getChannelState('theBlockTree'));
    return {blockId: block.id, isStoredToTreeId, isGbtRef: false, data: null};
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

/**
 * Calls $blockTypeName's on() method (if it had one), and returns its return value
 * (if it wasn't empty). Otherwise return null.
 *
 * @param {String} blockTypeName
 * @param {'addBlock'|'cloneBlock'|'moveBlock'} event
 * @param {Array<any>} args
 * @returns {{[key: String]: any;}|null}
 */
function callGetBlockPropChangesEvent(blockTypeName, event, args) {
    const blockType = api.blockTypes.get(blockTypeName);
    if (!blockType.on) return null;
    const changes = blockType.on(event, args);
    if (!changes) return null;
    if (typeof changes !== 'object') throw new Error('blockType.on() must return an object');
    return Object.keys(changes).length ? changes : null;
}

export default createDndController;
export {createBlockDescriptor, callGetBlockPropChangesEvent};