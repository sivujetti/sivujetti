import {
    api,
    arrayUtils,
    blockTreeUtils,
    objectUtils,
} from '@sivujetti-commons-for-edit-app';
import {createGbtsState} from '../../menu-column/block/block-edit-funcs.js';

/**
 * @param {Block} blockOrBranch
 * @param {string} targetTrid
 * @param {string} targetBlockId
 * @param {dropPosition} insertPos
 * @param {boolean} isReplace = false
 * @param {boolean} wasCurrentlySelectedBlock = false
 * @returns {['theBlockTree'|'globalBlockTrees', Array<Block>|Array<GlobalBlockTree>, StateChangeUserContext]}
 */
function createBlockTreeInsertOrReplaceAtOp(blockOrBranch, targetTrid, targetBlockId, insertPos, isReplace = false, wasCurrentlySelectedBlock = false) {
    const eventName = !isReplace ? 'insert-block-at' : 'replace-block';

    if (targetTrid === 'main')
        return [
            'theBlockTree',
            blockTreeUtils.createMutation(blockTreeUtils.getMainTree(), newTreeCopy => {
                if (!isReplace) insertAfterBeforeOrAsChild(blockOrBranch, newTreeCopy, targetBlockId, insertPos);
                else replaceAt(blockOrBranch, newTreeCopy, targetBlockId);
                return newTreeCopy;
            }),
            {event: eventName, wasCurrentlySelectedBlock}
        ];
    else
        return [
            'globalBlockTrees',
            objectUtils.cloneDeepWithChanges(createGbtsState(targetTrid), newGbtsCopy => {
                const gbt = arrayUtils.findById(newGbtsCopy, targetTrid);
                // mutates gbt.blocks (and thus gbt and newGbtsCopy)
                if (!isReplace) insertAfterBeforeOrAsChild(blockOrBranch, gbt.blocks, targetBlockId, insertPos);
                else replaceAt(blockOrBranch, gbt.blocks, targetBlockId);
                return newGbtsCopy;
            }),
            {event: eventName, wasCurrentlySelectedBlock}
        ];
}

/**
 * @param {BlockDescriptor} dragInf
 * @param {BlockDescriptor} dropInf
 * @param {dropPosition} dropPos
 * @returns {Array<['theBlockTree'|'globalBlockTrees', Array<Block>|Array<GlobalBlockTree>, StateChangeUserContext]>}
 */
function createBlockTreeMoveToOps(dragInf, dropInf, dropPos) {
    const [dragTreeId, dragBlockId] = getRealTarget(dragInf, null);
    const [dropTreeId, dropBlockId] = getRealTarget(dropInf, dropPos);

    if (dragTreeId === dropTreeId) {
        // main -> main
        if (dropTreeId === 'main') {
            return [createMoveWithinMainTreeOp(dragBlockId, dropBlockId, dropPos)];
        }
        // (same) gbt -> gbt
        return [createMoveWithinGbtOp(dragTreeId, dragBlockId, dropBlockId, dropPos)];
    } else {
        // gbt -> main
        if (dragTreeId !== 'main' && dropTreeId === 'main') {
            return createMoveFromGbtToMainTreeOps(dragBlockId, dragTreeId, dropBlockId, dropPos);
        }
        // main -> gbt
        if (dragTreeId === 'main' && dropTreeId !== 'main') {
            return createMoveFromMainToGbtTreeOps(dragBlockId, dropTreeId, dropBlockId, dropPos);
        }
        // gbt 1 -> gbt 2
        if (dragTreeId !== 'main' && dropTreeId !== 'main') {
            return [
                createMoveBetweenTwoGbtsOp(dragBlockId, dragTreeId, dropBlockId, dropTreeId, dropPos),
            ];
        }
    }
}

/**
 * @param {string} block1Id
 * @param {string} block2Id
 * @param {dropPosition} dropPos
 * @returns {['theBlockTree', Array<Block>, StateChangeUserContext]}
 */
function createMoveWithinMainTreeOp(block1Id, block2Id, dropPos) {
    return [
        'theBlockTree',
        blockTreeUtils.createMutation(blockTreeUtils.getMainTree(), newTreeCopy => {
            const [block1, branch1] = blockTreeUtils.findBlock(block1Id, newTreeCopy);
            const [block2, branch2] = blockTreeUtils.findBlock(block2Id, newTreeCopy);
            swapBlocksSameTree(block1, branch1, block2, branch2, dropPos);
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
function createMoveWithinGbtOp(dragTreeId, dragBlockId, dropBlockId, dropPos) {
    return [
        'globalBlockTrees',
        objectUtils.cloneDeepWithChanges(createGbtsState(dragTreeId), newGbtsCopy => {
            const gbt = arrayUtils.findById(newGbtsCopy, dragTreeId);
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
function createMoveFromGbtToMainTreeOps(dragBlockId, dragTreeId, dropBlockId, dropPos) {
    return [
        [
            'theBlockTree',
            blockTreeUtils.createMutation(blockTreeUtils.getMainTree(), newTreeCopy => {
                const block = blockTreeUtils.findBlock(dragBlockId, blockTreeUtils.getTree(dragTreeId).blocks)[0];
                insertAfterBeforeOrAsChild(block, newTreeCopy, dropBlockId, dropPos);
                return newTreeCopy;
            }),
            {event: 'move-block-into'}
        ],
        [
            'globalBlockTrees',
            objectUtils.cloneDeepWithChanges(createGbtsState(dragTreeId), newGbtsCopy => {
                const gbt = arrayUtils.findById(newGbtsCopy, dragTreeId);
                const [block, branch] = blockTreeUtils.findBlock(dragBlockId, gbt.blocks);
                removeFrom(block, branch); // Mutates gbt.blocks (and thus gbt and newGbtsCopy)
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
function createMoveBetweenTwoGbtsOp(dragBlockId, dragTreeId, dropBlockId, dropTreeId, dropPos) {
    return [
        'globalBlockTrees',
        objectUtils.cloneDeepWithChanges(createGbtsState([dragTreeId, dropTreeId]), newGbtsCopy => {
            const dragGbt = arrayUtils.findById(newGbtsCopy, dragTreeId);
            const dropGbt = arrayUtils.findById(newGbtsCopy, dropTreeId);
            const [dragBlock, dragBranch] = blockTreeUtils.findBlock(dragBlockId, dragGbt.blocks);
            insertAfterBeforeOrAsChild(dragBlock, dropGbt.blocks, dropBlockId, dropPos);
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
function createMoveFromMainToGbtTreeOps(dragBlockId, dropTreeId, dropBlockId, dropPos) {
    const mainTree = blockTreeUtils.getMainTree();
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
            objectUtils.cloneDeepWithChanges(createGbtsState(dropTreeId, api.saveButton.getInstance()), newGbtsCopy => {
                const gbt = arrayUtils.findById(newGbtsCopy, dropTreeId);
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
 * @param {string} refBlockId Id of the block in $arrMut (for 'before'|'after')
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
 * @param {number} replace = 0 0 = no, 1 = yes
 * @param {dropPosition} pos
 */
function insertTo(block, branchMut, refBlock, pos, replace = 0) {
    const idx = branchMut.indexOf(refBlock);
    const posAdj = idx + (pos === 'before' || replace ? 0 : 1);
    branchMut.splice(posAdj, replace, block);
}

/**
 * @param {Block} block Block to replace with
 * @param {Array<Block>} arrMut Array in which to replace
 * @param {string} refBlockId Id of the block in $arrMut
 */
function replaceAt(block, arrMut, refBlockId) {
    const [refBlock, branchMut] = blockTreeUtils.findBlock(refBlockId, arrMut);
    branchMut[branchMut.indexOf(refBlock)] = block;
}

/**
 * @param {Block|number} blockOrIdx Block to remove or index
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
 * @param {dropPosition|null} dropOrInsertPos
 * @returns {[string, string]} [isStoredToTreeId, blockId]
 */
function getRealTarget(target, dropOrInsertPos) {
    return dropOrInsertPos !== 'as-child' && target.data?.refBlockIsStoredToTreeId
        ? [target.data.refBlockIsStoredToTreeId, target.data.refBlockId]
        : [target.isStoredToTreeId, target.blockId];
}

export {
    createBlockTreeInsertOrReplaceAtOp,
    createBlockTreeMoveToOps,
    createMoveWithinMainTreeOp,
    getRealTarget,
    removeFrom,
    replaceAt,
};
