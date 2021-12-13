import {__} from './commons/main.js';
import Icon from './commons/Icon.jsx';
import blockTypes from './block-types/block-types.js';
import BlockTrees from './BlockTrees.jsx';
import store, {pushItemToOpQueue} from './store.js';

/**
 * @type {preact.FunctionalComponent<{block: Block; blockTreeCmp: preact.Component; base: Block|null;}>}
 */
const BlockEditForm2 = ({block, blockTreeCmp, base}, ctx) => {
    const blockType = blockTypes.get(block.type);
    const EditFormImpl = blockType.editForm;
    ctx.snapshot = preactHooks.useMemo(() => blockType.createSnapshot(block), []);
    const funcsIn = preactHooks.useMemo(() => ({onValueChanged: (value, key, hasErrors = false) => {
        if (ctx.undoTimeout !== undefined) { return; }
        //
        const oldValue = Object.assign({}, ctx.snapshot);
        const newValue = Object.assign({}, ctx.snapshot, {[key]: value});
        // 1. Re-render
        block.overwritePropsData(newValue);
        BlockTrees.currentWebPage.reRenderBlockInPlace(block);
        // 2. Commit to queue
        const s = createSaveBlockOpQueueArg(block, base, blockTreeCmp);
        if (!hasErrors) {
        store.dispatch(pushItemToOpQueue(`update-${s.blockIsStoredTo}-block`, {
            /**
             * @param {RawBlockData} _newVal
             * @param {RawBlockData} _oldVal
             * @param {SaveBlockOpSettings} settings
             * @returns {Promise<false|any>}
             */
            doHandle: (_newVal, _oldVal, {blockTree, blockIsStoredTo, globalBlockTreeId}) =>
                BlockTrees.saveExistingBlocksToBackend(blockTree, blockIsStoredTo, globalBlockTreeId)
            ,
            /**
             * @param {RawBlockData} _newVal
             * @param {RawBlockData} oldVal
             * @param {SaveBlockOpSettings} settings
             */
            doUndo: (_newVal, oldVal, {block}) => {
                block.overwritePropsData(oldVal);
                BlockTrees.currentWebPage.reRenderBlockInPlace(block);
                ctx.undoTimeout = setTimeout(() => { ctx.undoTimeout = undefined; }, 200);
                funcsOut.resetValues(oldVal);
                ctx.snapshot = oldVal;
            },
            args: [newValue, oldValue, s],
        }));
        }
        ctx.snapshot = newValue;
    }}));
    const funcsOut = {};
    //
    return <>
        <div class="with-icon pb-1">
            <Icon iconId="box" className="size-sm color-accent mr-1"/>
            { __(block.type) }
        </div>
        <div class="mt-2">
            <EditFormImpl block={ block } funcsIn={ funcsIn } funcsOut={ funcsOut }/>
        </div>
    </>;
};

/**
 * @param {Block} block
 * @param {Block|null} base
 * @param {preact.Component} allOverblockTreeCmprides
 * @returns {SaveBlockOpSettings} The last argument for the 'update-page-block' etc. command
 */
function createSaveBlockOpQueueArg(block, base, blockTreeCmp) {
    const blockIsStoredTo = !base || !base.useOverrides
        ? block.isStoredTo
        : base.isStoredTo;
    //
    const doUseOverrides = false;
    if (doUseOverrides) {
        const overrides = base.propsData.find(({key}) => key === 'overrides');
        overrides.value = setOverridesOf(block, JSON.parse(overrides.value));
        base.overrides = overrides.value;
    }
    //
    const blockTree = blockIsStoredTo !== 'globalBlockTree'
        ? blockTreeCmp.getTree()
        : blockTreeCmp.getTreeFor(block);
    //
    const globalBlockTreeId = blockIsStoredTo !== 'globalBlockTree'
        ? null
        : block.globalBlockTreeId;
    return {blockTree, blockIsStoredTo, globalBlockTreeId, block};
}

/**
 * @param {Block} block The block whose props to add to $allOverrides
 * @param {{[blockId: String]: Object;}} allOverrides
 * @returns {String} Jsonified $allOverrides which now contains overrides for $block
 */
function setOverridesOf(block, allOverrides) {
    allOverrides[block.id] = block.propsData.reduce((out, propData) => {
        out[propData.key] = propData.value;
        return out;
    }, {});
    return JSON.stringify(allOverrides);
}

/**
 * @typedef SaveBlockOpSettings
 * @prop {Array<Block>} blockTree
 * @prop {'page'|'globalBlockTree'} blockIsStoredTo
 * @prop {String|null} globalBlockTreeId
 * @prop {Block} block
 */

export default BlockEditForm2;
