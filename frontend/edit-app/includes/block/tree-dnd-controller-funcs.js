import {
    api,
    blockTreeUtils,
    objectUtils,
} from '@sivujetti-commons-for-edit-app';

/**
 * @param {Block} blockOrBranch
 * @param {BlockDescriptor} target
 * @param {dropPosition} insertPos
 * @returns {['theBlockTree'|'globalBlockTrees', Array<Block>|Array<GlobalBlockTree, StateChangeUserContext]}
 */
function createBlockTreeInsertAtOpArgs(blockOrBranch, target, insertPos) {
    const [targetTrid, targetBlockId] = getRealTarget(target, insertPos);
    if (targetTrid === 'main')
        return [
            'theBlockTree',
            blockTreeUtils.createMutation(api.saveButton.getInstance().getChannelState('theBlockTree'), newTreeCopy => {
                const [block, branch] = blockTreeUtils.findBlock(targetBlockId, newTreeCopy);
                insertAfterBeforeOrAsChild(blockOrBranch, branch, block, insertPos); // mutates branch|block (and thus newTreeCopy)
                return newTreeCopy;
            }),
            {event: 'insert-block-at'}
        ];
    else
        return [
            'globalBlockTrees',
            objectUtils.cloneDeepWithChanges(api.saveButton.getInstance().getChannelState('globalBlockTrees'), newGbtsCopy => {
                const gbt = newGbtsCopy.find(({id}) => id === targetTrid);
                const [block, branch] = blockTreeUtils.findBlock(targetBlockId, gbt.blocks);
                insertAfterBeforeOrAsChild(blockOrBranch, branch, block, insertPos); // mutates branch|block (and thus gbt and newGbtsCopy)
                return newGbtsCopy;
            }),
            {event: 'insert-block-at'}
        ];
}

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

/**
 * @param {Block} block Block to insert
 * @param {Array<Block>} branchMut Array to insert to
 * @param {Bloc<nullk} refBlock Block in $branchMut (for 'before'|'after')
 * @param {dropPosition} pos
 */
function insertAfterBeforeOrAsChild(block, branchMut, refBlock, pos) {
    if (pos !== 'as-child')
        insertTo(block, branchMut, refBlock, pos);
    else
        refBlock.children.push(block);
}

/**
 * @param {Block} block Block to insert
 * @param {Array<Block>} branchMut Array to insert to
 * @param {Block} refBlock Block in $branchMut
 * @param {dropPosition} pos
 */
function insertTo(block, branchMut, refBlock, pos) {
    const idx = branchMut.indexOf(refBlock);
    const posAdj = idx + (pos === 'before' ? 0 : 1);
    branchMut.splice(posAdj, 0, block);
}

/**
 * @param {BlockDescriptor} blockInf
 * @param {dropPosition} dropOrInsertPos
 * @returns {[string, string]} [isStoredToTreeId, blockId]
 */
function getRealTarget(blockInf, dropOrInsertPos) {
    return dropOrInsertPos !== 'as-child' && blockInf.data?.refBlockIsStoredToTreeId
        ? [blockInf.data?.refBlockIsStoredToTreeId, blockInf.data?.refBlockId]
        : [blockInf.isStoredToTreeId, blockInf.blockId];
}

export {
    createBlockTreeInsertAtOpArgs,
    createBlockTreeMoveToOpArgs,
};
