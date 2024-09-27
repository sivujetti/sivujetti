import {
    api,
    blockTreeUtils,
} from '@sivujetti-commons-for-edit-app';

/**
 * @param {Block} blockOrBranch
 * @param {BlockDescriptor} target
 * @param {dropPosition} dropPos
 * @returns {['theBlockTree', Array<Block>, StateChangeUserContext]}
 */
function createBlockTreeInsertAtOpArgs(blockOrBranch, target, insertPos) {
    return [
        'theBlockTree',
        blockTreeUtils.createMutation(api.saveButton.getInstance().getChannelState('theBlockTree'), newTreeCopy => {
            const {isStoredToTreeId, blockId} = !(target.isGbtRef && insertPos === 'as-child') ? target
                : {isStoredToTreeId: target.data.refTreeId, blockId: target.data.refTreesRootBlockId};
            const rootOrInnerTree = blockTreeUtils.findTree(isStoredToTreeId, newTreeCopy);
            if (insertPos === 'before') {
                const [before, branch] = blockTreeUtils.findBlock(blockId, rootOrInnerTree);
                branch.splice(branch.indexOf(before), 0, blockOrBranch);
            } else if (insertPos === 'after') {
                const [after, branch] = blockTreeUtils.findBlock(blockId, rootOrInnerTree);
                branch.splice(branch.indexOf(after) + 1, 0, blockOrBranch);
            } else {
                const [asChildOf] = blockTreeUtils.findBlock(blockId, rootOrInnerTree);
                asChildOf.children.push(blockOrBranch);
            }
            return newTreeCopy;
        }),
        {event: 'insert-block-at'}
    ];
}

/**
 * @param {BlockDescriptor} dragInf
 * @param {BlockDescriptor} dropInf
 * @param {dropPosition} dropPos
 * @returns {['theBlockTree', Array<Block>, StateChangeUserContext]}
 */
function createBlockTreeMoveToOpArgs(dragInf, dropInf, dropPos) {
    return [
        'theBlockTree',
        blockTreeUtils.createMutation(api.saveButton.getInstance().getChannelState('theBlockTree'), newTreeCopy => {
            const [dragBlock, dragBranch] = blockTreeUtils.findBlockMultiTree(dragInf.blockId, newTreeCopy);
            const [dropBlock, dropBranch] = blockTreeUtils.findBlockMultiTree(!(dropInf.isGbtRef && dropPos === 'as-child') ? dropInf.blockId : dropInf.data.refTreesRootBlockId, newTreeCopy);
            //
            const isBefore = dropPos === 'before';
            if (isBefore || dropPos === 'after') {
                if (dragBranch === dropBranch) {
                    const toIdx = dragBranch.indexOf(dropBlock);
                    const fromIndex = dragBranch.indexOf(dragBlock);
                    const realTo = isBefore ? toIdx : toIdx + 1;
                    dragBranch.splice(realTo, 0, dragBlock);
                    dragBranch.splice(fromIndex + (fromIndex > realTo ? 1 : 0), 1);
                } else {
                    moveToBeforeOrAfter(dragBlock, dragBranch, dropBlock, dropBranch, isBefore);
                }
            } else if (dropPos === 'as-child') {
                dropBlock.children.push(dragBlock);
                const pos = dragBranch.indexOf(dragBlock);
                dragBranch.splice(pos, 1);
            }
        }),
        {event: 'move-to'}
    ];
}

/**
 * @param {Block} dragBlock
 * @param {Array<Block>} dragBranch
 * @param {Block} dropBlock
 * @param {Array<Block>} dropBranch
 * @param {boolean} isBefore
 */
function moveToBeforeOrAfter(dragBlock, dragBranch, dropBlock, dropBranch, isBefore) {
    const dragBranchIdx = dragBranch.indexOf(dragBlock);
    const dropBranchIdx = dropBranch.indexOf(dropBlock);
    const pos = dropBranchIdx + (isBefore ? 0 : 1);
    dropBranch.splice(pos, 0, dragBlock);
    dragBranch.splice(dragBranchIdx, 1);
}

export {
    createBlockTreeInsertAtOpArgs,
    createBlockTreeMoveToOpArgs,
};
