import {__, signals} from './commons/main.js';
import Icon from './commons/Icon.jsx';
import {timingUtils} from './commons/utils.js';
import blockTypes from './block-types/block-types.js';
import BlockTrees from './BlockTrees.jsx';
import store, {pushItemToOpQueue} from './store.js';

let currentRenderFn = null;
let currentCommitFn = null;
let currentDebounceTime = null;
let currentDebounceType = null;

/**
 * @type {preact.FunctionalComponent<{block: Block; blockTreeCmp: preact.Component; base: Block|null; inspectorPanel: preact.Component;}>}
 * @property {String} currentlyMountedBlockId
 */
const BlockEditForm2 = ({block, blockTreeCmp, base, inspectorPanel}, ctx) => {
    preactHooks.useEffect(() => {
        BlockEditForm2.currentlyMountedBlockId = block.id;
        const unregister = signals.on('on-block-deleted',
            /**
             * @param {Block} _block
             * @param {Boolean} wasCurrentlySelectedBlock
             */
            (_block, wasCurrentlySelectedBlock) => {
                if (wasCurrentlySelectedBlock) inspectorPanel.close();
            });
        return () => {
            BlockEditForm2.currentlyMountedBlockId = null;
            currentDebounceTime = null;
            currentDebounceType = null;
            unregister();
        };
    }, []);
    //
    const blockType = blockTypes.get(block.type);
    const EditFormImpl = blockType.editForm;
    ctx.snapshot = preactHooks.useMemo(() => blockType.createSnapshot(block), []);
    //
    const internalFuncs = preactHooks.useMemo(() => ({
        oldVals: [],
        /**
         * @param {RawBlockData} newValue
         * @param {RawBlockData} oldValue
         * @param {Boolean} hasErrors
         * @param {Block} block
         * @param {Block|null} base
         * @param {(newValue: RawBlockData, hasErrors: Boolean) => void} doCommit
         */
        overwritePropsAndRenderBlock: (newValue, oldValue, hasErrors, block, base, doCommit) => {
            internalFuncs.oldVals.push(oldValue);
            block.overwritePropsData(newValue);
            BlockTrees.currentWebPage.reRenderBlockInPlace(block);
            doCommit(newValue, internalFuncs.oldVals[0], hasErrors, block, base);
        },
        /**
         * @param {RawBlockData} newValue
         * @param {RawBlockData} oldValue
         * @param {Boolean} hasErrors
         * @param {Block} block
         * @param {Block|null} base
         * @param {Boolean} hasErrors
         */
        commitChangeOpToQueue: (newValue, oldValue, hasErrors, block, base) => {
            internalFuncs.oldVals = [];
            //
            if (!hasErrors) {
            const s = createSaveBlockOpQueueArg(block, base, blockTreeCmp);
            const {opKey, doHandle, onUndo, beforePushOp} = !funcsOut.commitOverrides ? {
                opKey: `update-${s.blockIsStoredTo}-block`,
                /**
                 * @param {RawBlockData} _newValue
                 * @param {RawBlockData} _oldValue
                 * @param {SaveBlockOpSettings} settings
                 * @returns {Promise<false|any>}
                 */
                doHandle: (_newValue, _oldValue, {blockTree, blockIsStoredTo, globalBlockTreeId}) =>
                    BlockTrees.saveExistingBlocksToBackend(blockTree, blockIsStoredTo, globalBlockTreeId),
                /**
                 * @param {RawBlockData} oldValue
                 * @param {Block} block
                 */
                onUndo: (oldValue, block) => {
                    block.overwritePropsData(oldValue);
                    BlockTrees.currentWebPage.reRenderBlockInPlace(block);
                },
                beforePushOp: (_newValue) => {},
            } : funcsOut.commitOverrides;
            //
            beforePushOp(newValue);
            store.dispatch(pushItemToOpQueue(opKey, {
                doHandle,
                /**
                 * @param {RawBlockData} _newValue
                 * @param {RawBlockData} oldValue
                 * @param {SaveBlockOpSettings} settings
                 */
                doUndo: (_newValue, oldValue, {block}) => {
                    onUndo(oldValue, block);
                    if (block.id === BlockEditForm2.currentlyMountedBlockId) {
                        ctx.undoTimeout = setTimeout(() => { ctx.undoTimeout = undefined; }, 200);
                        ctx.funcsOut.resetValues(oldValue);
                        ctx.snapshot = oldValue;
                    }
                },
                args: [newValue, oldValue, s],
            }));
            }
        },
    }), []);
    const funcsIn = preactHooks.useMemo(() => ({
        /**
         * @param {any} value
         * @param {String} key
         * @param {Boolean} hasErrors
         * @param {Number} debounceMillis = 0
         * @param {'debounce-commit-to-queue'|'debounce-re-render-and-commit-to-queue'|'debounce-none'} debounceType = 'debounce-commit-to-queue'
         */
        onValueChanged: (value, key, hasErrors = false, debounceMillis = 0, debounceType = 'debounce-commit-to-queue') => {
            if (ctx.undoTimeout !== undefined) { return; }
            //
            if (debounceMillis !== currentDebounceTime || debounceType !== currentDebounceType) {
                // Run reRender immediately, but throttle commitChangeOpToQueue
                if (debounceType === 'debounce-commit-to-queue') {
                    currentRenderFn = internalFuncs.overwritePropsAndRenderBlock;
                    currentCommitFn = timingUtils.debounce(internalFuncs.commitChangeOpToQueue, debounceMillis);
                // Throttle reRender, which throttles commitToQueue as well
                } else if (debounceType === 'debounce-re-render-and-commit-to-queue') {
                    currentRenderFn = timingUtils.debounce(internalFuncs.overwritePropsAndRenderBlock, debounceMillis);
                    currentCommitFn = internalFuncs.commitChangeOpToQueue;
                // Run both immediately
                } else {
                    currentRenderFn = internalFuncs.overwritePropsAndRenderBlock;
                    currentCommitFn = internalFuncs.commitChangeOpToQueue;
                }
                currentDebounceTime = debounceMillis;
                currentDebounceType = debounceType;
            }
            //
            const oldValue = Object.assign({}, ctx.snapshot);
            const newValue = Object.assign({}, ctx.snapshot, {[key]: value});
            currentRenderFn(newValue, oldValue, hasErrors, block, base, currentCommitFn);
            ctx.snapshot = newValue;
        }
    }), []);
    const funcsOut = preactHooks.useMemo(() => ({}), []); // A storage where EditFormImpl can publish its own api
    ctx.funcsOut = funcsOut;
    //
    return <>
        <div class="with-icon pb-1">
            <Icon iconId={ blockType.icon } className="size-xs color-accent mr-1"/>
            { __(block.type) }
        </div>
        <div class="mt-2">
            <EditFormImpl
                block={ block }
                blockTree={ blockTreeCmp }
                funcsIn={ funcsIn }
                funcsOut={ funcsOut }
                snapshot={ ctx.snapshot }
                key={ block.id }/>
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
