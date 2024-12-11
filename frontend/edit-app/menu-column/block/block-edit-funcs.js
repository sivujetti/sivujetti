import {
    api,
    blockTreeUtils,
    writeBlockProps,
} from '@sivujetti-commons-for-edit-app';

/**
 * @param {string} blockId
 * @param {(blockRefMut: Block) => {[key: string]: any;}} getChanges
 * @param {blockPropValueChangeFlags} flags = null
 * @param {SaveButton} saveButton = api.saveButton.getInstance()
 * @returns {['theBlockTree', Array<Block>, StateChangeUserContext]|['globalBlockTrees', Array<GlobalBlockTree>, StateChangeUserContext]}
 */
function createUpdateBlockPropOp(blockId, getChanges, flags = null, saveButton = api.saveButton.getInstance()) {
    const root1 = blockTreeUtils.findBlockMultiTree(blockId, saveButton.getChannelState('theBlockTree'))[3];
    const trid = blockTreeUtils.getIdFor(root1);
    if (trid === 'main')
        return [
            'theBlockTree',
            blockTreeUtils.createMutation(saveButton.getChannelState('theBlockTree'), newTreeCopy => {
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
            saveButton.getChannelState('globalBlockTrees').map(gbt =>
                gbt.id !== trid
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
 * @param {string} blockId
 * @param {{[key: string]: any;}|(blockRefMut: Block) => {[key: string]: any;}} changesOrGetChanges
 * @param {blockPropValueChangeFlags} flags = null
 * @returns {['theBlockTree', Array<Block>, StateChangeUserContext]}
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

export {createUpdateBlockPropOp, pushBlockChanges};
