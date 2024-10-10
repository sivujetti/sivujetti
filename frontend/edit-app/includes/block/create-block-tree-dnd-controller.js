import {
    api,
    blockTreeUtils,
    scssWizard,
} from '@sivujetti-commons-for-edit-app';
import {
    createBlockTreeInsertAtOpArgs,
    createBlockTreeMoveToOpsArgs,
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
         * @param {DragDropInfo} _info
         * @returns {boolean}
         */
        begin(_info) {
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
                const ops = createBlockTreeMoveToOpsArgs(drag, targ, cand.pos);
                if (ops.length === 1)
                    saveButton.pushOp(...ops[0]);
                else
                    saveButton.pushOpGroup(...ops);
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
         * @param {DragDropInfo} _cand
         * @param {DragDropInfo} _prevCand
         * @param {HTMLLIElement|null} _startLi
         * @returns {boolean|undefined}
         */
        swap(_cand, _prevCand, _startLi) {
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
    // Main tree's block, or global block tree's inner block
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
    return {blockId: block.id, isStoredToTreeId, isGbtRefRoot: false, data: null};
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
