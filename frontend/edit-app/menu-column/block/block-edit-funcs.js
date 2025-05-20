import {
    api,
    arrayUtils,
    blockTreeUtils,
    writeBlockProps,
} from '@sivujetti-commons-for-edit-app';

/**
 * @param {string} blockId
 * @param {(blockRefMut: Block) => {[key: string]: any;}} getChanges
 * @param {blockPropValueChangeFlags} flags = null
 * @param {SaveButton} saveButton = api.saveButton.getInstance()
 * @returns {['theBlockTree', Array<Block>, StateChangeUserContext, blockPropValueChangeFlags]|['globalBlockTrees', Array<GlobalBlockTree>, StateChangeUserContext, blockPropValueChangeFlags]}
 */
function createUpdateBlockPropOp(blockId, getChanges, flags = null, saveButton = api.saveButton.getInstance()) {
    const root1 = blockTreeUtils.findBlockMultiTree(blockId, blockTreeUtils.getMainTree(saveButton))[3];
    const treeId = blockTreeUtils.getIdFor(root1);
    if (treeId === 'main')
        return [
            'theBlockTree',
            blockTreeUtils.createMutation(blockTreeUtils.getMainTree(saveButton), newTreeCopy => {
                const [blockRefMut] = blockTreeUtils.findBlock(blockId, newTreeCopy);
                writeBlockProps(blockRefMut, getChanges(blockRefMut));
                return newTreeCopy;
            }),
            {event: 'update-single-block-prop', blockId},
            flags
        ];
    else
        return [
            'globalBlockTrees',
            createGbtsState(treeId, saveButton).map(gbt =>
                gbt.id !== treeId
                    ? gbt
                    : {...gbt, blocks: blockTreeUtils.createMutation(gbt.blocks, copy => {
                        const [blockRefMut] = blockTreeUtils.findBlock(blockId, copy);
                        writeBlockProps(blockRefMut, getChanges(blockRefMut));
                    })}
            ),
            {event: 'update-block-in', blockId},
            flags,
        ];
}

/**
 * Returns a new 'globalBlockTrees' state by adding all $treeIdOrTreeIds from
 * $saveButton.getSyncedState('globalBlockTrees'). Example:
 * ```
 * const saveButton = api.saveButton.getInstance();
 * cont noSynced = false;
 * console.log(saveButton.getChannelState('globalBlockTrees', noSynced)); // []
 * const someId = '<pushId>';
 * const newState = createGbtsState(someId, saveButton);
 * console.log(newState); // [{id: '<pushId>', blocks: ...}]
 * // Now you can mutate newState and pass it to saveButton.pushOp('globalBlockTrees', newState)
 * ```
 *
 * @param {string|Array<string>} treeIdOrTreeIds
 * @param {SaveButton} saveButton = api.saveButton.getInstance()
 * @returns {Array<GlobalBlockTree>}
 */
function createGbtsState(
    treeIdOrTreeIds,
    saveButton = api.saveButton.getInstance()
) {
    /** @type {Array<GlobalBlockTree>} */
    const state = saveButton.getChannelState('globalBlockTrees');
    const synced = saveButton.getSyncedState('globalBlockTrees');
    return (Array.isArray(treeIdOrTreeIds) ? treeIdOrTreeIds : [treeIdOrTreeIds]).reduce((out, id) =>
        arrayUtils.findById(out, id)
            // treeIdOrTreeIds[i] already exists in the state, do nothing
            ? out
            // treeIdOrTreeIds[i] not found in state, find it from repo and add to state as a shallow copy
            : [...out, {...arrayUtils.findById(synced, id)}]
    , state);
}

/**
 * @param {string} blockId
 * @param {{[key: string]: any;}|((blockRefMut: Block) => {[key: string]: any;})} changesOrGetChanges
 * @param {blockPropValueChangeFlags} flags = null
 */
function pushBlockChanges(blockId, changesOrGetChanges, flags = null) {
    const saveButton = api.saveButton.getInstance();
    saveButton.pushOp(...createUpdateBlockPropOp(
        blockId,
        typeof changesOrGetChanges === 'function' ? changesOrGetChanges : () => changesOrGetChanges,
        flags,
        saveButton
    ));
}

export {createGbtsState, createUpdateBlockPropOp, pushBlockChanges};
