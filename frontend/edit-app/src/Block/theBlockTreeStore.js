import blockTreeUtils from '../left-panel/Block/blockTreeUtils.js';
import {overrideData} from '../store.js';

function theBlockTreeStore(store) {
    store.on('theBlockTree/init',
    /**
     * @param {Object} state
     * @param {[Array<RawBlock>]} args
     * @returns {Object}
     */
    (_state, [theBlockTree]) =>
        ({theBlockTree})
    );

    store.on('theBlockTree/swap',
    /**
     * @param {Object} state
     * @param {[BlockDescriptor, BlockDescriptor, 'before'|'after'|'as-child']} args
     * @returns {Object}
     */
    ({theBlockTree}, [dragInf, dropInf, dropPos]) => {
        const clone = JSON.parse(JSON.stringify(theBlockTree));
        const dragBlocksTree = blockTreeUtils.getRootFor(dragInf.isStoredToTreeId, clone);
        const [dragBlock, dragBranch] = blockTreeUtils.findBlock(dragInf.blockId, dragBlocksTree);
        const dropBlocksTree = blockTreeUtils.getRootFor(dropInf.isStoredToTreeId, clone);
        const [dropBlock, dropBranch] = blockTreeUtils.findBlock(dropInf.blockId, dropBlocksTree);
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
        return {theBlockTree: clone};
    });

    store.on('theBlockTree/applySwap',
    /**
     * @param {Object} state
     * @param {[BlockDescriptorStub, BlockDescriptorStub]} args
     * @returns {Object}
     */
    ({theBlockTree}, _) =>
        ({theBlockTree})
    );

    store.on('theBlockTree/applyAdd(Drop)Block',
    /**
     * @param {Object} state
     * @param {[BlockDescriptorStub, BlockDescriptorStub]} args
     * @returns {Object}
     */
    ({theBlockTree}, _) =>
        ({theBlockTree})
    );

    store.on('theBlockTree/undo',
    /**
     * @param {Object} state
     * @param {[Array<RawBlock>, String, String]} args
     * @returns {Object}
     */
    (_state, [theBlockTree]) =>
        ({theBlockTree})
    );

    /**
     * @param {Object} state
     * @param {[todo]} args
     * @returns {Object}
     */
    const r = ({theBlockTree}, [id, isStoredToTreeId, _what, _wasCurrentlySelectedBlock]) => {
        const clone = JSON.parse(JSON.stringify(theBlockTree));
        const rootOrInnerTree = blockTreeUtils.getRootFor(isStoredToTreeId, clone);
        const [ref, refBranch] = blockTreeUtils.findBlock(id, rootOrInnerTree);
        refBranch.splice(refBranch.indexOf(ref), 1); // mutates clone
        return {theBlockTree: clone};
    };
    store.on('theBlockTree/deleteBlock',
    r);

    /**
     * @param {Object} state
     * @param {[SpawnDescriptor, BlockDescriptor, 'before'|'after'|'as-child']} args
     * @returns {Object}
     */
    const yer = ({theBlockTree}, [spawn, target, insertPos]) => {
        const blockOrBranch = spawn.block;
        const clone = JSON.parse(JSON.stringify(theBlockTree));
        const rootOrInnerTree = blockTreeUtils.getRootFor(target.isStoredToTreeId, clone);
        if (insertPos === 'before') {
            const [before, branch] = blockTreeUtils.findBlock(target.blockId, rootOrInnerTree);
            branch.splice(branch.indexOf(before), 0, blockOrBranch);
        } else if (insertPos === 'after') {
            const [after, branch] = blockTreeUtils.findBlock(target.blockId, rootOrInnerTree);
            branch.splice(branch.indexOf(after) + 1, 0, blockOrBranch);
        } else {
            const [asChildOf] = blockTreeUtils.findBlock(target.blockId, rootOrInnerTree);
            asChildOf.children.push(blockOrBranch);
        }
        return {theBlockTree: clone};
    };
    store.on('theBlockTree/addBlockOrBranch',
    yer);

    store.on('theBlockTree/undoAdd(Drop)Block',
    r);

    store.on('theBlockTree/updatePropsOf',
    /**
     * @param {Object} state
     * @param {[String, String, {[key: String]: any;}, Boolean, Number]} args
     * @returns {Object}
     */
    ({theBlockTree}, [blockId, blockIsStoredToTreeId, changes, _hasErrors, _debounceMillis]) => {
        const clone = JSON.parse(JSON.stringify(theBlockTree));
        const rootOrInnerTree = blockTreeUtils.getRootFor(blockIsStoredToTreeId, clone);
        const [block] = blockTreeUtils.findBlock(blockId, rootOrInnerTree);
        overrideData(block, changes);
        return {theBlockTree: clone};
    });

    store.on('theBlockTree/cloneItem',
    yer);
}

/**
 * @param {RawBlock} dragBlock
 * @param {Array<RawBlock>} dragBranch
 * @param {RawBlock} dropBlock
 * @param {Array<RawBlock>} dropBranch
 * @param {Boolean} isBefore
 */
function moveToBeforeOrAfter(dragBlock, dragBranch, dropBlock, dropBranch, isBefore) {
    const dragBranchIdx = dragBranch.indexOf(dragBlock);
    const dropBranchIdx = dropBranch.indexOf(dropBlock);
    const pos = dropBranchIdx + (isBefore ? 0 : 1);
    dropBranch.splice(pos, 0, dragBlock);
    dragBranch.splice(dragBranchIdx, 1);
}

export default theBlockTreeStore;
