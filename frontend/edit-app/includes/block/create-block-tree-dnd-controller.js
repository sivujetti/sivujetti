import {
    api,
    blockTreeUtils,
    scssWizard,
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
         * @returns {boolean}
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
                const insertBlockAtOpArgs = createBlockTreeInsertAtOpArgs(extDragData.block, targetInf, cand.pos);
                if (!extDragData.isReusable) // Plain block -> add block but no styles
                    saveButton.pushOp(...insertBlockAtOpArgs);
                else { // Reusable -> add block and copies of all of its styles recursively
                    const userAndDevStyles = extDragData.styles;
                    const updatedAll = scssWizard.addManyNewChunksAndReturnAllRecompiled(userAndDevStyles);
                    saveButton.pushOpGroup(
                        insertBlockAtOpArgs,
                        ['stylesBundle', updatedAll]
                    );
                }
            }
            api.webPagePreview.getEl().style.pointerEvents = '';
            dropped = true;
        },
        /**
         * @param {DragDropInfo|null} info
         * @returns {boolean}
         */
        dragOut(_info) {
            // Do nothing
        },
        /**
         * @param {DragDropInfo} cand
         * @param {DragDropInfo} _prevCand
         * @param {HTMLLIElement|null} startLi
         * @returns {boolean|undefined}
         */
        swap(cand, _prevCand, startLi) {
            const extBlock = !extDragData ? null : extDragData.block;
            const drag = !extBlock ? createBlockDescriptorFromLi(startLi) : createBlockDescriptor(extBlock, saveButton);
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
            // Do nothing
        },
        /**
         * @param {number|null} _lastAcceptedSwapIdx
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
        return {blockId, isStoredToTreeId, isGbtRefRoot: false, data: null};
    // Global block tree's root block
    } else
        return {blockId, isStoredToTreeId, isGbtRefRoot: true, data: {
            refBlockId: maybeRefBlockId,
            refBlockIsStoredToTreeId: li.previousElementSibling?.getAttribute('data-is-stored-to-tree-id') || 'main'
        }};
}

/**
 * @param {Block} block
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
 * @returns {[string, boolean]} [targetIsStoredToTreeId, isTargetAsChildOfGbtRef]
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
 * @param {string} blockTypeName
 * @param {'addBlock'|'cloneBlock'|'moveBlock'} event
 * @param {Array<any>} args
 * @returns {{[key: string]: any;}|null}
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
export {createBlockDescriptor, createBlockDescriptorFromLi, callGetBlockPropChangesEvent};
