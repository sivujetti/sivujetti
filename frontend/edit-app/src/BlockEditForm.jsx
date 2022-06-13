import {http, __, api, signals, env, Icon} from '@sivujetti-commons-for-edit-app';
import Tabs from './commons/Tabs.jsx';
import {timingUtils} from './commons/utils.js';
import {getIcon} from './block-types/block-types.js';
import {EMPTY_OVERRIDES} from './block-types/globalBlockReference.js';
import BlockTrees from './BlockTrees.jsx';
import blockTreeUtils, {isGlobalBlockTreeRefOrPartOfOne} from './blockTreeUtils.js';
import store, {selectCurrentPage, createSelectBlockTree, pushItemToOpQueue, observeStore,
               createUpdateBlockTreeItemData} from './store.js';
import IndividualBlockStylesTab from './IndividualBlockStylesTab.jsx';
import BlockTypeBaseStylesTab from './BlockTypeBaseStylesTab.jsx';

/** @var {BlockTypes} */
let blockTypes;

const snapshots = new Map;

/**
 * @param {Block} block
 * @param {BlockType} blockType
 * @param {Boolean} override = false
 * @returns {RawBlockData}
 */
function putOrGetSnapshot(block, blockType, override = false) {
    let snap = !override ? snapshots.get(block.id) : undefined;
    if (!snap) {
        snapshots.set(block.id, blockType.createSnapshot(block));
        snap = snapshots.get(block.id);
    }
    return snap;
}

class BlockEditForm extends preact.Component {
    // blockVals;
    // isOutermostBlockOfGlobalBlockTree;
    // userCanSpecializeGlobalBlocks;
    // blockType;
    // editFormImpl;
    // snapshot;
    // allowStylesEditing;
    // editFormImplRef;
    // unregistrables;
    // static currentInstance;
    // static undoingLockIsOn;
    /**
     * @param {{block: Block; blockTreeCmp: preact.Component; base: Block|null; inspectorPanel: preact.Component;}} props
     */
    constructor(props) {
        super(props);
        this.useFeatureReduxBlockTrees = window.useReduxBlockTree && this.props.block.type === 'Paragraph';
        blockTypes = api.blockTypes;
        this.state = {currentTabIdx: 0};
        this.userCanEditCss = api.user.can('editCssStyles');
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const {block, base} = this.props;
        this.blockVals = new BlockValMutator(this.props);
        BlockEditForm.undoingLockIsOn = false;
        this.isOutermostBlockOfGlobalBlockTree = base && block.id === base.__globalBlockTree.blocks[0].id;
        this.userCanSpecializeGlobalBlocks = api.user.can('specializeGlobalBlocks');
        this.blockType = blockTypes.get(block.type);
        this.editFormImpl = this.blockType.editForm;
        this.snapshot = putOrGetSnapshot(block, this.blockType);
        this.allowStylesEditing = !selectCurrentPage(store.getState()).webPage.data.page.isPlaceholderPage;
        this.editFormImplRef = preact.createRef();
        this.unregistrables = [signals.on('on-block-deleted', ({id}, isChildOfOrCurrentlyOpenBlock) => {
            if (isChildOfOrCurrentlyOpenBlock || id === block.id) this.props.inspectorPanel.close();
        })];
        this.setState({useOverrides: base && base.useOverrides,
                       currentTabIdx: 0});
        if (this.useFeatureReduxBlockTrees) {
            this.currentDebounceTime = null;
            this.currentDebounceType = null;
            this.boundEmitStickyChange = null;
            this.boundEmitFastChange = null;
            const trid = this.props.block.isStoredToTreeId;
            this.unregistrables = [observeStore(createSelectBlockTree(trid), ({tree, context}) => {
                if (!this.editFormImplsChangeGrabber)
                    return;
                if (context[0] !== 'update-single-value' && context[0] !== 'undo-single-value')
                    return;
                const block = blockTreeUtils.findBlock(this.props.block.id, tree)[0];
                if (context[1] !== block.id)
                    return;
                this.editFormImplsChangeGrabber(JSON.parse(JSON.stringify(block)), context[0]);
            })];
        }
    }
    /**
     * @access protected
     */
    componentDidMount() {
        if (!this.useFeatureReduxBlockTrees) {
        BlockEditForm.currentInstance = this;
        this.blockVals.setCurrentEditFormImplRef(BlockEditForm.currentInstance.editFormImplRef);
        }
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        if (!this.useFeatureReduxBlockTrees) {
        BlockEditForm.currentInstance = undefined;
        this.isOutermostBlockOfGlobalBlockTree = undefined;
        this.editFormImpl = undefined;
        this.snapshot = undefined;
        this.editFormImplRef = undefined;
        }
        this.unregistrables.forEach(unreg => unreg());
    }
    /**
     * @access protected
     */
    render({block, blockTreeCmp}, {useOverrides, currentTabIdx}) {
        const EditFormImpl = this.editFormImpl;
        return <div data-main>
        <div class={ `with-icon pb-1${preactHooks.useMemo(() => {
                if (isGlobalBlockTreeRefOrPartOfOne(block)) return ' global-block-tree-block';
                if (block.type === 'PageInfo') return ' page-info-block';
                return '';
            }, [])}` }>
            <Icon iconId={ getIcon(this.blockType) } className="size-xs mr-1"/>
            { __(block.title || this.blockType.friendlyName) }
        </div>
        { this.userCanEditCss
            ? <Tabs
                links={ [__('Content'), __('Own styles'), __('Base styles')] }
                onTabChanged={ toIdx => this.setState({currentTabIdx: toIdx}) }
                className="text-tinyish mt-0 mb-2"/>
            : null
        }
        <div class={ currentTabIdx === 0 ? '' : 'd-none' }>
            <div class="mt-2">
                { this.userCanSpecializeGlobalBlocks && this.isOutermostBlockOfGlobalBlockTree
                    ? <div class="input-group mini-toggle">
                        <label class="form-switch input-sm color-dimmed pr-0">
                            <input
                                onChange={ this.handleDoInheritGlobalBlockValsChanged.bind(this) }
                                type="checkbox"
                                checked={ useOverrides }/>
                            <i class="form-icon"></i> { __('Use specializations') }
                        </label>
                        <span
                            class="flex-centered tooltip tooltip-bottom"
                            data-tooltip={ __('If on, any changes made to this\nglobal block tree won\'t affect\nthe original') }>
                            <Icon iconId="info-circle" className="size-xs"/>
                        </span>
                    </div>
                    : null
                }
                { !this.useFeatureReduxBlockTrees ?
                <EditFormImpl
                    block={ block }
                    blockTree={ blockTreeCmp }
                    onValueChanged={ this.blockVals.handleSingleValueChanged.bind(this.blockVals) }
                    onManyValuesChanged={ this.blockVals.handleValuesChanged.bind(this.blockVals) }
                    snapshot={ this.snapshot }
                    ref={ this.editFormImplRef }
                    key={ block.id }/> :
                <EditFormImpl
                    blockId={ block.id }
                    blockIsStoredToTreeId={ block.isStoredToTreeId }
                    grabChanges={ withFn => { this.editFormImplsChangeGrabber = withFn; } }
                    emitValueChanged={ (val, key, hasErrors, debounceMillis) => { this.handleValueValuesChanged({[key]: val}, hasErrors, debounceMillis); } }
                    emitManyValuesChanged={ this.handleValueValuesChanged.bind(this) }
                    ref={ this.editFormImplRef }
                    key={ block.id }/> }
            </div>
        </div>
        { this.userCanEditCss ? [
        <IndividualBlockStylesTab block={ this.props.block }
            allowEditing={ this.allowStylesEditing }
            isVisible={ currentTabIdx === 1 }/>,
        <BlockTypeBaseStylesTab block={ this.props.block }
            allowEditing={ this.allowStylesEditing }
            isVisible={ currentTabIdx === 2 }
            blockTypeNameTranslated={ __(this.blockType.friendlyName) }/>
        ] : null }
        </div>;
    }
    /**
     * @param {Object} changes
     * @param {Boolean} hasErrors
     * @param {Number} debounceMillis = 0
     * @param {'debounce-commit-to-queue'|'debounce-re-render-and-commit-to-queue'|'debounce-none'} debounceType = 'debounce-commit-to-queue'
     * @access public
     */
    handleValueValuesChanged(changes, hasErrors = false, debounceMillis = 0, debounceType = 'debounce-commit-to-queue') {
        if (this.currentDebounceTime !== debounceMillis || this.currentDebounceType !== debounceType) {
            const boundEmitStickyChange = (oldData, partialContext) => {
                this.emitSticky(oldData, partialContext);
            };
            const boundEmitFastChange = (newData, oldData, partialContext, hasErrors) => {
                this.emitFast(newData, partialContext);
                if (!hasErrors) this.boundEmitStickyChange(oldData, partialContext);
                else env.console.log('Not implemented yet');
            };
            // Run reRender immediately, but throttle commitChangeOpToQueue
            if (debounceType === 'debounce-commit-to-queue') {
                this.boundEmitStickyChange = timingUtils.debounce(boundEmitStickyChange, debounceMillis);
                this.boundEmitFastChange = boundEmitFastChange;
            // Throttle reRender, which throttles commitToQueue as well
            } else if (debounceType === 'debounce-re-render-and-commit-to-queue') {
                this.boundEmitStickyChange = boundEmitStickyChange;
                this.boundEmitFastChange = timingUtils.debounce(boundEmitFastChange, debounceMillis);
            // Run both immediately
            } else {
                this.boundEmitStickyChange = boundEmitStickyChange;
                this.boundEmitFastChange = boundEmitFastChange;
            }
            this.currentDebounceTime = debounceMillis;
            this.currentDebounceType = debounceType;
        }
        const trid = this.props.block.isStoredToTreeId;
        const {tree} = createSelectBlockTree(trid)(store.getState());
        const block = blockTreeUtils.findBlock(this.props.block.id, tree)[0];
        const oldData = cloneFrom(Object.keys(changes), block);
        const partialContext = [block.id, block.type, trid];
        // Call emitFastChange, which then calls emitCommitChange
        this.boundEmitFastChange(changes, oldData, partialContext, hasErrors);
    }
    /**
     */
    emitFast(newData, partialContext) {
        store.dispatch(createUpdateBlockTreeItemData(partialContext[2])(
            newData,
            partialContext[0],
            ['update-single-value', ...partialContext]
        ));
    }
    /**
     */
    emitSticky(oldData, partialContext) {
        store.dispatch(pushItemToOpQueue(`update-page-block-data`, {
            doHandle: () => {
                // todo return if placeholder page
                const trid = partialContext[2];
                const {tree} = createSelectBlockTree(trid)(store.getState());
                return BlockTrees.saveExistingBlocksToBackend(tree, trid);
            },
            doUndo: () => {
                store.dispatch(createUpdateBlockTreeItemData(partialContext[2])(
                    oldData,
                    partialContext[0],
                    ['undo-single-value', ...partialContext]
                ));
            },
            args: [],
        }));
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleDoInheritGlobalBlockValsChanged(e) {
        const oldUseOverrides = this.state.useOverrides;
        const newUseOverrides = e.target.checked;
        const {base} = this.props;
        const valBefore = Object.assign({}, putOrGetSnapshot(base, blockTypes.get('GlobalBlockReference')));
        if (!oldUseOverrides && newUseOverrides) {
            const valAfter = Object.assign({}, valBefore, {useOverrides: 1});
            internalOverwriteData(valAfter, base);
            this.blockVals.handleValueChangedNoMutate(
                [{valBefore, valAfter, block: base}],
                {valBefore: null, valAfter: null, block: null}
            );
        } else if (oldUseOverrides && !newUseOverrides) {
            const valAfter = Object.assign({}, valBefore, {useOverrides: 0,
                                                           overrides: EMPTY_OVERRIDES});
            const current = base.__globalBlockTree.blocks;
            const ids = Object.keys(JSON.parse(base.overrides));
            const valBefore2 = [];
            // 1. Gather valBefore2
            ids.forEach(id => {
                const block = blockTreeUtils.findBlock(id, current)[0];
                valBefore2.push({block, snapshot: blockTypes.get(block.type).createSnapshot(block)});
            });
            // 2. Gather valAfter2 and mutate overridden blocks to their original state
            const valAfter2 = [];
            http.get(`/api/global-block-trees/${base.globalBlockTreeId}`)
                .then(({blocks}) => {
                    ids.forEach((id, i) => {
                        const blockOrigState = blockTreeUtils.findBlock(id, blocks)[0];
                        const block = valBefore2[i].block;
                        const lastIdx = valAfter2.push({block, snapshot: putOrGetSnapshot(blockOrigState, blockTypes.get(block.type), true)}) - 1;
                        internalOverwriteData(valAfter2[lastIdx].snapshot, block);
                        BlockTrees.currentWebPage.reRenderBlockInPlace(block);
                        if (this.props.block.id === block.id)
                            updateFormValues(this, valAfter2[lastIdx].snapshot);
                    });
                    // 3. Override reference block's overrides and commit
                    internalOverwriteData(valAfter, base);
                    this.blockVals.handleValueChangedNoMutate(
                        [{valBefore, valAfter, block: base}],
                        {valBefore: valBefore2, valAfter: valAfter2, block: null}
                    );
                })
                .catch(env.window.console.error);
        }
    }
}

/**
 * @param {Array<String>} keys
 * @param {Object} fromObject
 * @returns {Object}
 */
function cloneFrom(keys, fromObj) {
    return keys.reduce((out, key) => {
        const v = fromObj[key];
        if (Array.isArray(v))
            out[key] = v;
        else if (typeof v === 'object')
            out[key] = JSON.parse(JSON.stringify(v));
        else
            out[key] = v;
        return out;
    }, {});
}

class BlockValMutator {
    // props;
    // dirtyQueue;
    // editFormImplRef;
    // currentMutateAndRenderFn;
    // currentEmitChangesOpFn;
    // currentDebounceTime;
    // currentDebounceType;
    /**
     * @param {{block: Block; base: Block|null; blockTreeCmp: preact.Component;}} props
     */
    constructor(props) {
        this.props = props;
        this.dirtyQueue = [];
        this.editFormImplRef = null;
    }
    /**
     * @param {any} value
     * @param {String} key
     * @param {Boolean} hasErrors
     * @param {Number} debounceMillis = 0
     * @param {'debounce-commit-to-queue'|'debounce-re-render-and-commit-to-queue'|'debounce-none'} debounceType = 'debounce-commit-to-queue'
     * @access public
     */
    handleSingleValueChanged(value, key, hasErrors = false, debounceMillis = 0, debounceType = 'debounce-commit-to-queue') {
        this.handleValuesChanged({[key]: value}, hasErrors, debounceMillis, debounceType);
    }
    /**
     * @param {Object} obj
     * @param {Boolean} hasErrors
     * @param {Number} debounceMillis = 0
     * @param {'debounce-commit-to-queue'|'debounce-re-render-and-commit-to-queue'|'debounce-none'} debounceType = 'debounce-commit-to-queue'
     * @access public
     */
    handleValuesChanged(obj, hasErrors = false, debounceMillis = 0, debounceType = 'debounce-commit-to-queue') {
        if (BlockEditForm.undoingLockIsOn)
            return;
        if (debounceMillis !== this.currentDebounceTime || debounceType !== this.currentDebounceType) {
            // Run reRender immediately, but throttle commitChangeOpToQueue
            if (debounceType === 'debounce-commit-to-queue') {
                this.currentEmitChangesOpFn = timingUtils.debounce(this.emitCommitChangesFn.bind(this), debounceMillis);
                this.currentMutateAndRenderFn = this.mutateRenderAndThenCallCommit.bind(this);
            // Throttle reRender, which throttles commitToQueue as well
            } else if (debounceType === 'debounce-re-render-and-commit-to-queue') {
                this.currentEmitChangesOpFn = this.emitCommitChangesFn.bind(this);
                this.currentMutateAndRenderFn = timingUtils.debounce(this.mutateRenderAndThenCallCommit.bind(this), debounceMillis);
            // Run both immediately
            } else {
                this.currentEmitChangesOpFn = this.emitCommitChangesFn.bind(this);
                this.currentMutateAndRenderFn = this.mutateRenderAndThenCallCommit.bind(this);
            }
            this.currentDebounceTime = debounceMillis;
            this.currentDebounceType = debounceType;
        }
        // Call render, which then calls commit
        this.currentMutateAndRenderFn(obj, hasErrors);
    }
    /**
     * @param {Array<CommandContext>} aq
     * @param {CommandContext} b
     * @access public
     */
    handleValueChangedNoMutate(aq, b) {
        this.emitCommitChangesFn(aq, b);
    }
    /**
     * @param {preact.RefObject} editFormImplRef
     * @access public
     */
    setCurrentEditFormImplRef(editFormImplRef) {
        this.editFormImplRef = editFormImplRef;
    }
    /**
     * @returns {Block}
     * @access public
     */
    getBlock() {
        return this.props.block;
    }
    /**
     * @param {Object} obj
     * @param {Boolean} hasErrors
     * @returns {CommandContext|null}
     * @access private
     */
    mutateRenderAndThenCallCommit(obj, hasErrors) {
        const {block, base} = this.props;
        const valBefore = Object.assign({}, putOrGetSnapshot(block, blockTypes.get(block.type)));
        const valAfter = Object.assign({}, valBefore, obj);
        let ret;
        // - Mutate $block
        // - Tell emitCommitChangesFn to commit changes to the root tree using $block (block1.block)
        // - Instruct internalUndoVal to overwrite $block's data using block1.valBefore
        if (block.isStoredTo === 'page') {
            internalOverwriteData(valAfter, block);
            BlockTrees.currentWebPage.reRenderBlockInPlace(block);
            ret = !hasErrors ? {block1: {valBefore, valAfter, block}, block2: {valBefore: null, valAfter: null, block: null}} : null;
        } else {
            // - Mutate $block
            // - Instruct emitCommitChangesFn to commit changes to $block's global block tree
            // - Instruct internalUndoVal to overwrite $base's data using block1.valBefore
            if (!base.useOverrides) {
                internalOverwriteData(valAfter, block);
                BlockTrees.currentWebPage.reRenderBlockInPlace(block);
                ret = !hasErrors ? {block1: {valBefore, valAfter, block}, block2: {valBefore: null, valAfter: null, block: base}} : null;
            } else {
            // - Mutate $block and $base
            // - Tell emitCommitChangesFn to commit changes to the root tree using $base (block1.block)
            // - Instruct internalUndoVal to overwrite $block's data with block2.valBefore and $base's data using block1.valBefore
            internalOverwriteData(valAfter, block);
            BlockTrees.currentWebPage.reRenderBlockInPlace(block);
            const valBefore2 = Object.assign({}, putOrGetSnapshot(base, blockTypes.get(base.type)));
            const valAfter2 = Object.assign({}, valBefore2, {overrides: setOverridesOf(block, JSON.parse(valBefore2.overrides))});
            internalOverwriteData(valAfter2, base);
            ret = !hasErrors ? {block1: {valBefore: valBefore2, valAfter: valAfter2, block: base}, block2: {valBefore, valAfter, block}} : null;
            }
        }
        if (ret) {
            this.dirtyQueue.push(ret.block1);
            this.currentEmitChangesOpFn(this.dirtyQueue, ret.block2);
        }
    }
    /**
     * @param {Array<CommandContext>} aq
     * @param {CommandContext} b
     * @access private
     */
    emitCommitChangesFn(aq, b) {
        const getOverrides = this.editFormImplRef ? this.editFormImplRef.current.getCommitSettings : null;
        const {opKey, doHandle, onUndo, beforePushOp} = typeof getOverrides !== 'function'
            ? {
                opKey: `update-${aq[0].block.isStoredTo}-block`,
                doHandle: aq[0].block.isStoredTo === 'globalBlockTree' || !BlockTrees.currentWebPage.data.page.isPlaceholderPage
                    ? ([$a], _$b) => BlockTrees.saveExistingBlocksToBackend(
                        $a.block.isStoredTo !== 'globalBlockTree'
                            ? this.props.blockTreeCmp.getTree()
                            : this.props.blockTreeCmp.getTreeFor($a.block),
                        $a.block.isStoredTo,
                        $a.block.globalBlockTreeId
                    )
                    : null,
                onUndo: () => {},
                beforePushOp: () => {}
            }
            : getOverrides();
        //
        beforePushOp(aq[aq.length - 1]);
        store.dispatch(pushItemToOpQueue(opKey, {
            doHandle,
            doUndo: ($aq, $b) => {
                internalUndoVal($aq[0], $b);
                onUndo($aq[0], $b);
            },
            args: [aq, b],
        }));
        this.dirtyQueue = [];
    }
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
 * @param {RawBlockData} newData
 * @param {Block} $block
 * @access private
 */
function internalOverwriteData(newData, block) {
    block.overwritePropsData(newData); // Mutates block
    Object.assign(snapshots.get(block.id), newData); // Mutates snapshots[block.id]
}

/**
 * @param {CommandContext} a
 * @param {CommandContext} b
 * @access private
 */
function internalUndoVal($a, $b) { // todo add useOverrides snapshot para
    const block = $a.block;
    const base = $b.block;
    const isMetaBlock = block.type === 'GlobalBlockReference';
    if (block.isStoredTo === 'page') {
        internalOverwriteData($a.valBefore, $a.block);
        if (!isMetaBlock) {
            BlockTrees.currentWebPage.reRenderBlockInPlace(block);
        } else {
            if (Array.isArray($b.valBefore)) {
                $b.valBefore.forEach(({block, snapshot}) => {
                    internalOverwriteData(snapshot, block);
                    BlockTrees.currentWebPage.reRenderBlockInPlace(block);
                });
            } else if ($b.block) {
                internalOverwriteData($b.valBefore, $b.block);
                BlockTrees.currentWebPage.reRenderBlockInPlace($b.block);
            }
        }
    } else {
        if (!base || !base.useOverrides) {
            internalOverwriteData($a.valBefore, block);
            BlockTrees.currentWebPage.reRenderBlockInPlace(block);
        } else {
            internalOverwriteData($a.valBefore, block);
            const valBefore2 = Object.assign({}, snapshots.get(base.id));
            const valAfter2 = Object.assign({}, valBefore2, {overrides: setOverridesOf(block.id, JSON.parse(base.overrides))});
            internalOverwriteData(valAfter2, base);
            BlockTrees.currentWebPage.reRenderBlockInPlace(block);
        }
    }
    const $this = BlockEditForm.currentInstance;
    if (!$this) return;
    if (block.id === $this.props.block.id || (isMetaBlock && block.id === $this.props.base.id)) {
        const val = !isMetaBlock ? $a.valBefore : $b.valBefore;
        if (val) updateFormValues($this, val);
        if (isMetaBlock) $this.setState({useOverrides: $a.valBefore.useOverrides});
    }
}

/**
 * @param {preact.Component} $this
 * @param {RawBlockData} snapshot
 */
function updateFormValues($this, snapshot) {
    BlockEditForm.undoingLockIsOn = true;
    $this.editFormImplRef.current.overrideValues(snapshot);
    setTimeout(() => { BlockEditForm.undoingLockIsOn = false; }, 200);
}

/**
 * @typedef CommandContext
 * @prop {{valBefore: RawBlockData; valAfter: RawBlockData; block: Block;}} block1
 * @prop {{valBefore: RawBlockData|null; valAfter: RawBlockData|null; block: Block|null;}} block2
 */

export default BlockEditForm;
export {BlockValMutator};
