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
                insertAfterBeforeOrAsChild(blockOrBranch, newTreeCopy, targetBlockId, insertPos);
                return newTreeCopy;
            }),
            {event: 'insert-block-at'}
        ];
    else
        return [
            'globalBlockTrees',
            objectUtils.cloneDeepWithChanges(api.saveButton.getInstance().getChannelState('globalBlockTrees'), newGbtsCopy => {
                const gbt = newGbtsCopy.find(({id}) => id === targetTrid);
                insertAfterBeforeOrAsChild(blockOrBranch, gbt.blocks, targetBlockId, insertPos); // mutates gbt.blocks (and thus gbt and newGbtsCopy)
                return newGbtsCopy;
            }),
            {event: 'insert-block-at'}
        ];
}

/**
 * @param {BlockDescriptor} dragInf
 * @param {BlockDescriptor} dropInf
 * @param {dropPosition} dropPos
 * @returns {Array<['theBlockTree'|'globalBlockTrees', Array<Block>|Array<GlobalBlockTree>, StateChangeUserContext]>}
 */
function createBlockTreeMoveToOpsArgs(dragInf, dropInf, dropPos) {
    const [dragTreeId, dragBlockId] = getRealTarget(dragInf, dropPos);
    const [dropTreeId, dropBlockId] = getRealTarget(dropInf, dropPos);

    if (dragTreeId === dropTreeId) {
        // main -> main
        if (dropTreeId === 'main') {
            return [createMoveWithinMainTreeOpArgs(dragBlockId, dropBlockId, dropPos)];
        }
        // (same) gbt -> gbt
        return [createMoveWithinGbtOpArgs(dragTreeId, dragBlockId, dropBlockId, dropPos)];
    } else {
        // gbt -> main
        if (dragTreeId !== 'main' && dropTreeId === 'main') {
            return createMoveFromGbtToMainTreeOpsArgs(dragBlockId, dragTreeId, dropBlockId, dropPos);
        }
        // main -> gbt
        if (dragTreeId === 'main' && dropTreeId !== 'main') {
            return createMoveFromMainToGbtTreeOpsArgs(dragBlockId, dropTreeId, dropBlockId, dropPos);
        }
        // gbt 1 -> gbt 2
        if (dragTreeId !== 'main' && dropTreeId !== 'main') {
            return [
                createMoveBetweenTwoGbtsOpArgs(dragBlockId, dragTreeId, dropBlockId, dropTreeId, dropPos),
            ];
        }
    }
}

/**
 * @param {string} dragBlockId
 * @param {string} dropBlockId
 * @param {dropPosition} dropPos
 * @returns {['theBlockTree', Array<Block>, StateChangeUserContext]}
 */
function createMoveWithinMainTreeOpArgs(dragBlockId, dropBlockId, dropPos) {
    return [
        'theBlockTree',
        blockTreeUtils.createMutation(api.saveButton.getInstance().getChannelState('theBlockTree'), newTreeCopy => {
            const [dragBlock, dragBranch] = blockTreeUtils.findBlock(dragBlockId, newTreeCopy);
            const [dropBlock, dropBranch] = blockTreeUtils.findBlock(dropBlockId, newTreeCopy);
            swapBlocksSameTree(dragBlock, dragBranch, dropBlock, dropBranch, dropPos);
            return newTreeCopy;
        }),
        {event: 'move-block-within'}
    ];
}

/**
 * @param {string} dragTreeId
 * @param {string} dragBlockId
 * @param {string} dropBlockId
 * @param {dropPosition} dropPos
 * @returns {['globalBlockTrees', Array<GlobalBlockTree>, StateChangeUserContext]}
 */
function createMoveWithinGbtOpArgs(dragTreeId, dragBlockId, dropBlockId, dropPos) {
    return [
        'globalBlockTrees',
        objectUtils.cloneDeepWithChanges(api.saveButton.getInstance().getChannelState('globalBlockTrees'), newGbtsCopy => {
            const gbt = newGbtsCopy.find(({id}) => id === dragTreeId);
            const [dragBlock, dragBranch] = blockTreeUtils.findBlock(dragBlockId, gbt.blocks);
            const [dropBlock, dropBranch] = blockTreeUtils.findBlock(dropBlockId, gbt.blocks);
            swapBlocksSameTree(dragBlock, dragBranch, dropBlock, dropBranch, dropPos);
            return newGbtsCopy;
        }),
        {event: 'move-block-within'}
    ];
}

/**
 * @param {string} dragBlockId
 * @param {string} dragTreeId
 * @param {string} dropBlockId
 * @param {dropPosition} dropPos
 * @returns {[['theBlockTree', Array<Block>, StateChangeUserContext], ['globalBlockTrees', Array<GlobalBlockTree>, StateChangeUserContext]]}
 */
function createMoveFromGbtToMainTreeOpsArgs(dragBlockId, dragTreeId, dropBlockId, dropPos) {
    const gbts = api.saveButton.getInstance().getChannelState('globalBlockTrees');
    return [
        [
            'theBlockTree',
            blockTreeUtils.createMutation(api.saveButton.getInstance().getChannelState('theBlockTree'), newTreeCopy => {
                const block = blockTreeUtils.findBlock(dragBlockId, gbts.find(({id}) => id === dragTreeId).blocks)[0];
                insertAfterBeforeOrAsChild(block, newTreeCopy, dropBlockId, dropPos);
                return newTreeCopy;
            }),
            {event: 'move-block-into'}
        ],
        [
            'globalBlockTrees',
            objectUtils.cloneDeepWithChanges(gbts, newGbtsCopy => {
                const gbt = newGbtsCopy.find(({id}) => id === dragTreeId);
                const [b, br] = blockTreeUtils.findBlock(dragBlockId, gbt.blocks);
                removeFrom(b, br); // Mutates gbt.blocks (and thus newGbtsCopy)
                return newGbtsCopy;
            }),
            {event: 'move-block-from'}
        ],
    ];
}

/**
 * @param {string} dragBlockId
 * @param {string} dragTreeId
 * @param {string} dropBlockId
 * @param {string} dropTreeId
 * @param {dropPosition} dropPos
 * @returns {['globalBlockTrees', Array<GlobalBlockTree>, StateChangeUserContext]}
 */
function createMoveBetweenTwoGbtsOpArgs(dragBlockId, dragTreeId, dropBlockId, dropTreeId, dropPos) {
    return [
        'globalBlockTrees',
        objectUtils.cloneDeepWithChanges(api.saveButton.getInstance().getChannelState('globalBlockTrees'), newGbtsCopy => {
            const dragGbt = newGbtsCopy.find(({id}) => id === dragTreeId);
            const dropGbt = newGbtsCopy.find(({id}) => id === dropTreeId);
            const [dragBlock, dragBranch] = blockTreeUtils.findBlock(dragBlockId, dragGbt.blocks);
            insertAfterBeforeOrAsChild(dragBlock, dropGbt.blocks, dropBlockId, dropPos); // mutates dropGbt.blocks (and thus dropGbt and newGbtsCopy)
            removeFrom(dragBlock, dragBranch);
            return newGbtsCopy;
        }),
        {event: 'move-block-between'}
    ];
}

/**
 * @param {string} dragBlockId
 * @param {string} dropTreeId
 * @param {string} dropBlockId
 * @param {dropPosition} dropPos
 * @returns {[['theBlockTree', Array<Block>, StateChangeUserContext], ['globalBlockTrees', Array<GlobalBlockTree>, StateChangeUserContext]]}
 */
function createMoveFromMainToGbtTreeOpsArgs(dragBlockId, dropTreeId, dropBlockId, dropPos) {
    const mainTree = api.saveButton.getInstance().getChannelState('theBlockTree');
    return [
        [
            'theBlockTree',
            blockTreeUtils.createMutation(mainTree, newTreeCopy => {
                const [block, branch] = blockTreeUtils.findBlock(dragBlockId, newTreeCopy);
                removeFrom(block, branch);
                return newTreeCopy;
            }),
            {event: 'move-block-from'}
        ],
        [
            'globalBlockTrees',
            objectUtils.cloneDeepWithChanges(api.saveButton.getInstance().getChannelState('globalBlockTrees'), newGbtsCopy => {
                const gbt = newGbtsCopy.find(({id}) => id === dropTreeId);
                const [dragBlock] = blockTreeUtils.findBlock(dragBlockId, mainTree);
                insertAfterBeforeOrAsChild(dragBlock, gbt.blocks, dropBlockId, dropPos); // mutates gbt.blocks (and thus gbt and newGbtsCopy)
                return newGbtsCopy;
            }),
            {event: 'move-block-into'}
        ],
    ];
}

/**
 * @param {Block} dragBlock
 * @param {Array<Block>} dragBranch
 * @param {Block} dropBlock
 * @param {Array<Block>} dropBranch
 * @param {dropPosition} dropPos
 */
function swapBlocksSameTree(dragBlock, dragBranch, dropBlock, dropBranch, dropPos) {
    const isBefore = dropPos === 'before';
    if (isBefore || dropPos === 'after') {
        if (dragBranch === dropBranch) {
            const toIdx = dragBranch.indexOf(dropBlock);
            const fromIndex = dragBranch.indexOf(dragBlock);
            const realTo = isBefore ? toIdx : toIdx + 1;
            dragBranch.splice(realTo, 0, dragBlock);
            removeFrom(fromIndex + (fromIndex > realTo ? 1 : 0), dragBranch);
        } else {
            moveToBeforeOrAfter(dragBlock, dragBranch, dropBlock, dropBranch, isBefore);
        }
    } else if (dropPos === 'as-child') {
        dropBlock.children.push(dragBlock);
        removeFrom(dragBlock, dragBranch);
    }
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
    removeFrom(dragBranchIdx, dragBranch);
}

/**
 * @param {Block} block Block to insert
 * @param {Array<Block>} arrMut Array to insert to
 * @param {string} refBlockId Id of block in $arrMut (for 'before'|'after')
 * @param {dropPosition} insertPos
 */
function insertAfterBeforeOrAsChild(block, arrMut, refBlockId, insertPos) {
    const [refBlock, branchMut] = blockTreeUtils.findBlock(refBlockId, arrMut);
    if (insertPos !== 'as-child')
        insertTo(block, branchMut, refBlock, insertPos);
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
 * @param {Block|number} block Block to remove or index
 * @param {Array<Block>} branchMut Array to remove from
 */
function removeFrom(blockOrIdx, branchMut) {
    const idx = typeof blockOrIdx !== 'number' ? branchMut.indexOf(blockOrIdx) : blockOrIdx;
    branchMut.splice(idx, 1);
}

/**
 * Returns #2 if target block (#1) is a global block tree's root block and insertPos = 'after' or 'before'. Otherwise, returns target as is.
 * ```
 * <GlobalBlockReferenceGlock>  <- #2
 *   <GlobalBlockTreeRootBlock> <- #1
 *     ...
 *   </GlobalBlockTreeRootBlock>
 * </GlobalBlockReferenceGlock>
 * ```
 *
 * @param {BlockDescriptor} target
 * @param {dropPosition} dropOrInsertPos
 * @returns {[string, string]} [isStoredToTreeId, blockId]
 */
function getRealTarget(target, dropOrInsertPos) {
    return dropOrInsertPos !== 'as-child' && target.data?.refBlockIsStoredToTreeId
        ? [target.data?.refBlockIsStoredToTreeId, target.data?.refBlockId]
        : [target.isStoredToTreeId, target.blockId];
}

export {
    createBlockTreeInsertAtOpArgs,
    createBlockTreeMoveToOpsArgs,
};
