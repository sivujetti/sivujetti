import blockTreeUtils from '../left-column/block/blockTreeUtils.js';
import {createBlockFromType, createGbtRefBlockProps} from './utils.js';

const muts = new Map;

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
     * @param {[BlockDescriptor, BlockDescriptor, dropPosition]} args
     * @returns {Object}
     */
    ({theBlockTree}, [dragInf, dropInf, dropPos]) => {
        const clone = cloneObjectDeep(theBlockTree);
        const [dragBlock, dragBranch] = blockTreeUtils.findBlockSmart(dragInf.blockId, clone);
        const [dropBlock, dropBranch] = blockTreeUtils.findBlockSmart(!(dropInf.isGbtRef && dropPos === 'as-child') ? dropInf.blockId : dropInf.data.refTreesRootBlockId, clone);
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

    /**
     * @param {Object} state
     * @param {[BlockDescriptor, BlockDescriptor, dropPosition, treeTransferType, TheBlockTreeReducerContext]} args
     * @returns {Object}
     */
    const applySwapOrDrop = (_, [_source, _target, _dropPos, _treeTransfer, {clone}]) => {
        return {theBlockTree: clone};
    };
    store.on('theBlockTree/applySwap', applySwapOrDrop);

    store.on('theBlockTree/applyAdd(Drop)Block', applySwapOrDrop);

    store.on('theBlockTree/undo',
    /**
     * @param {Object} state
     * @param {[Array<RawBlock>, String, 'default'|'delete'|'convertToGlobal']} args
     * @returns {Object}
     */
    (_state, [theBlockTree]) =>
        ({theBlockTree})
    );

    store.on('theBlockTree/undoUpdateDefPropsOf',
    /**
     * @param {Object} state
     * @param {[Array<RawBlock>, String, String, Boolean]} args
     * @returns {Object}
     */
    (_state, [theBlockTree]) =>
        ({theBlockTree})
    );

    /**
     * @param {Object} state
     * @param {[String, String, Boolean|null]} args
     * @returns {Object}
     */
    const deleteBlock = ({theBlockTree}, [blockId, _blockIsStoredToTreeId, _wasCurrentlySelectedBlock]) => {
        const clone = cloneObjectDeep(theBlockTree);
        const [ref, refBranch] = blockTreeUtils.findBlockSmart(blockId, clone);
        refBranch.splice(refBranch.indexOf(ref), 1); // mutates clone
        return {theBlockTree: clone};
    };
    store.on('theBlockTree/deleteBlock', deleteBlock);

    /**
     * @param {Object} state
     * @param {[SpawnDescriptor, BlockDescriptor, dropPosition]} args
     * @returns {Object}
     */
    const addBlock = ({theBlockTree}, [spawn, target, insertPos]) => {
        const blockOrBranch = spawn.block;
        const clone = cloneObjectDeep(theBlockTree);
        const {isStoredToTreeId, blockId} = !(target.isGbtRef && insertPos === 'as-child') ? target
            : {isStoredToTreeId: target.data.refTreeId, blockId: target.data.refTreesRootBlockId};
        const rootOrInnerTree = blockTreeUtils.findTree(isStoredToTreeId, clone);
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
        return {theBlockTree: clone};
    };
    store.on('theBlockTree/addBlockOrBranch', addBlock);

    store.on('theBlockTree/undoAdd(Drop)Block', deleteBlock);

    store.on('theBlockTree/updatePropsOf',
    /**
     * @param {Object} state
     * @param {[String, String, {[key: String]: any;}, Number, Number]} args
     * @returns {Object}
     */
    ({theBlockTree}, [blockId, _blockIsPartOfInnerTree, changes, _flags, _debounceMillis]) => {
        const clone = cloneObjectDeep(theBlockTree);
        const [block] = blockTreeUtils.findBlockSmart(blockId, clone);
        overrideData(block, changes);
        return {theBlockTree: clone};
    });

    store.on('theBlockTree/updateDefPropsOf',
    /**
     * @param {Object} state
     * @param {[String, String, {[key: String]: any;}, Boolean, String|null]} args
     * @returns {Object}
     */
    ({theBlockTree}, [blockId, blockIsStoredToTreeId, changes, _isOnlyStyleClassesChange, _prevData]) => {
        const asString = Object.keys(changes).toString();
        if (asString !== 'title' && asString !== 'styleClasses') throw new Error('Not supported yet');
        const clone = cloneObjectDeep(theBlockTree);
        const rootOrInnerTree = blockTreeUtils.findTree(blockIsStoredToTreeId, clone);
        const [block] = blockTreeUtils.findBlock(blockId, rootOrInnerTree);
        Object.assign(block, changes);
        return {theBlockTree: clone};
    });

    store.on('theBlockTree/cloneItem', addBlock);

    store.on('theBlockTree/convertToGbt',
    /**
     * @param {Object} state
     * @param {[String, String, RawGlobalBlockTree]} args args[2].blocks will always be empty at this point
     * @returns {Object}
     */
    ({theBlockTree}, [originalBlockId, idForTheNewBlock, newGbt]) => {
        const clone = cloneObjectDeep(theBlockTree);

        // Convert original to array, change isStoredToTreeIds recursively
        const [original] = blockTreeUtils.findBlock(originalBlockId, clone);
        original.title = newGbt.name;
        const newTree = [original];

        // Create new block, set $newTree as its .__globalBlockTree.blocks
        const converted = createBlockFromType('GlobalBlockReference',
            idForTheNewBlock, createGbtRefBlockProps(newGbt, newTree));

        // Replace the block
        const [ref, refBranch] = blockTreeUtils.findBlock(original.id, clone);
        refBranch[refBranch.indexOf(ref)] = converted; // mutates clone

        return {theBlockTree: clone};
    });
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

/**
 * @param {RawBlock} block
 * @param {{[key: String]: any;}} data
 */
function overrideData(block, data) {
    for (const key in data) {
        // b.*
        block[key] = data[key];
        if (['type', 'title', 'renderer', 'id', 'styleClasses'].indexOf(key) < 0) {
            // b.propsData[*]
            const idx = block.propsData.findIndex(p => p.key === key);
            if (idx > -1) block.propsData[idx].value = data[key];
            else block.propsData.push({key, value: data[key]});
        }
    }
}

/**
 * @param {any} obj
 * @returns {any}
 */
function cloneObjectDeep(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * @param {String} event
 * @param {(event: String, theBlockTree: Array<RawBlock>, blockTreeUtils: blockTreeUtils) => Array<{blockId: String; changes: {[key: String]: any;};}>} getMutationsFn
 */
function registerMutator(event, getMutationsFn) {
    muts.set(event, getMutationsFn);
}

/**
 * @param {String} event
 * @returns {(event: String, theBlockTree: Array<RawBlock>, blockTreeUtils: blockTreeUtils) => Array<{blockId: String; changes: {[key: String]: any;};}>}
 */
function getMutator(event) {
    return muts.get(event) || null;
}

/**
 * @param {Array<RawBlock>} theBlockTree
 * @returns {TheBlockTreeReducerContext}
 */
function createBlockTreeMutateEventContext(theBlockTree) {
    const clone = cloneObjectDeep(theBlockTree);
    const getMutsFn = getMutator('onTheBlockTreeMut');
    const mutations = !getMutsFn ? null : getMutsFn('onTheBlockTreeMut', cloneObjectDeep(theBlockTree), blockTreeUtils);
    if (!mutations || !mutations.length)
        return {clone, reRenderThese: []};
    //
    for (const itm of mutations) {
        const [b] = blockTreeUtils.findBlock(itm.blockId, clone);
        overrideData(b, itm.changes);
    }
    return {clone, reRenderThese: mutations.map(({blockId}) => blockId)};
}

export default theBlockTreeStore;
export {overrideData, cloneObjectDeep, registerMutator, createBlockTreeMutateEventContext};
