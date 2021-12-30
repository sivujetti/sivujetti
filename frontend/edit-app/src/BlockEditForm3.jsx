import {http, __, signals, env} from './commons/main.js';
import Icon from './commons/Icon.jsx';
import {timingUtils} from './commons/utils.js';
import blockTypes, {getIcon} from './block-types/block-types.js';
import {EMPTY_OVERRIDES} from './block-types/globalBlockReference.js';
import BlockTrees from './BlockTrees.jsx';
import blockTreeUtils from './blockTreeUtils.js';
import store, {pushItemToOpQueue} from './store.js';

const snapshots = new Map;
/**
 * @param {Block} block
 * @param {BlockType} blockType
 * @returns {RawBlockData}
 */
function putOrGetSnapshot(block, blockType) {
    let snap = snapshots.get(block.id);
    if (!snap) {
        snapshots.set(block.id, blockType.createSnapshot(block));
        snap = snapshots.get(block.id);
    }
    return snap;
}

class BlockEditForm3 extends preact.Component {
    // isOutermostBlockOfGlobalBlockTree;
    // editFormImpl;
    // snapshot;
    // editFormImplRef;
    // currentMutateAndRenderFn;
    // currentEmitChangesOpFn;
    // currentDebounceTime;
    // currentDebounceType;
    // static currentInstance;
    /**
     * @access protected
     */
    componentWillMount() {
        const {block, base} = this.props;
        BlockEditForm3.currentInstance = this;
        this.isOutermostBlockOfGlobalBlockTree = base && block.id === base.__globalBlockTree.blocks[0].id;
        const blockType = blockTypes.get(block.type);
        this.editFormImpl = blockType.editForm;
        this.snapshot = putOrGetSnapshot(block, blockType);
        this.editFormImplRef = preact.createRef();
        this.setState({useOverrides: base && base.useOverrides});
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.isOutermostBlockOfGlobalBlockTree = undefined;
        this.editFormImpl = undefined;
        this.snapshot = undefined;
        this.editFormImplRef = undefined;
        this.currentMutateAndRenderFn = undefined;
        this.currentEmitChangesOpFn = undefined;
        this.currentDebounceTime = undefined;
        this.currentDebounceType = undefined;
    }
    /**
     * @param {{block: Block; blockTreeCmp: preact.Component; base: Block|null; inspectorPanel: preact.Component;}} props
     * @access protected
     */
    render({block, blockTreeCmp}, {useOverrides}) {
        const EditFormImpl = this.editFormImpl;
        return <div data-main>
            <div class={ `with-icon pb-1${preactHooks.useMemo(() => {
                    if (block.isStoredTo === 'globalBlockTree' || block.type === 'GlobalBlockReference') return ' global-block-tree-block';
                    if (block.type === 'PageInfo') return ' page-info-block';
                    return '';
                }, [])}` }>
                <Icon iconId={ getIcon(block.type) } className="size-xs mr-1"/>
                { __(block.type) }
            </div>
            <div class="mt-2">
                { this.isOutermostBlockOfGlobalBlockTree
                    ? <div class="input-group mini-toggle">
                        <label class="form-switch input-sm color-dimmed pr-0" title={ __('Specialize this global block') }>
                            <input
                                onChange={ this.handleDoInheritGlobalBlockValsChanged.bind(this) }
                                type="checkbox"
                                checked={ useOverrides }/>
                            <i class="form-icon"></i> { __('Specialize') }
                        </label>
                        <span
                            class="flex-centered tooltip tooltip-bottom"
                            data-tooltip={ __('Use edited values on this\npage only') }>
                            <Icon iconId="info-circle" className="size-xs"/>
                        </span>
                    </div>
                    : null
                }
                <EditFormImpl
                    block={ block }
                    blockTree={ blockTreeCmp }
                    onValueChanged={ this.handleValueChanged.bind(this) }
                    snapshot={ this.snapshot }
                    ref={ this.editFormImplRef }
                    key={ block.id }/>
            </div>
        </div>;
    }
    /**
     * @param {any} value
     * @param {String} key
     * @param {Boolean} hasErrors
     * @returns {CommandContext|null}
     * @access private
     */
    mutateAndRender(value, key, hasErrors) {
        const {block, base} = this.props;
        const valBefore = Object.assign({}, putOrGetSnapshot(block, blockTypes.get(block.type)));
        const valAfter = Object.assign({}, valBefore, {[key]: value});
        // - Mutate $block
        // - Tell emitCommitChangesFn to commit changes to the root tree using $block (block1.block)
        // - Instruct internalUndoVal to overwrite $block's data using block1.valBefore
        if (block.isStoredTo === 'page') {
            internalOverwriteData(valAfter, block);
            BlockTrees.currentWebPage.reRenderBlockInPlace(block);
            return !hasErrors ? {block1: {valBefore, valAfter, block}, block2: null} : null;
        } else {
            // - Mutate $block
            // - Instruct emitCommitChangesFn to commit changes to $block's global block tree
            // - Instruct internalUndoVal to overwrite $base's data using block1.valBefore
            if (!base.useOverrides) {
                internalOverwriteData(valAfter, block);
                BlockTrees.currentWebPage.reRenderBlockInPlace(block);
                return !hasErrors ? {block1: {valBefore, valAfter, block}, block2: {valBefore: null, valAfter: null, block: base}} : null;
            }
            // - Mutate $block and $base
            // - Tell emitCommitChangesFn to commit changes to the root tree using $base (block1.block)
            // - Instruct internalUndoVal to overwrite $block's data with block2.valBefore and $base's data using block1.valBefore
            internalOverwriteData(valAfter, block);
            BlockTrees.currentWebPage.reRenderBlockInPlace(block);
            const valBefore2 = Object.assign({}, putOrGetSnapshot(base, blockTypes.get(base.type)));
            const valAfter2 = Object.assign({}, valBefore2, {overrides: setOverridesOf(block, JSON.parse(valBefore2.overrides))});
            internalOverwriteData(valAfter2, base);
            return !hasErrors ? {block1: {valBefore: valBefore2, valAfter: valAfter2, block: base}, block2: {valBefore, valAfter, block}} : null;
        }
    }
    /**
     * @param {CommandContext} a
     * @param {CommandContext} b
     * @access private
     */
    emitCommitChangesFn(a, b) {
        store.dispatch(pushItemToOpQueue(`update-${a.block.blockIsStoredTo}-block`, {
            doHandle: ($a, _$b) =>
                BlockTrees.saveExistingBlocksToBackend(
                    $a.block.isStoredTo !== 'globalBlockTree' ? this.props.blockTreeCmp.getTree() : this.props.blockTreeCmp.getTreeFor($a.block),
                    $a.block.isStoredTo,
                    $a.block.globalBlockTreeId
                )
            ,
            doUndo: internalUndoVal,
            args: [a, b],
        }));
    }
    /**
     * @param {any} value
     * @param {String} key
     * @param {Boolean} hasErrors
     * @param {Number} debounceMillis = 0
     * @param {'debounce-commit-to-queue'|'debounce-re-render-and-commit-to-queue'|'debounce-none'} debounceType = 'debounce-commit-to-queue'
     * @access private
     */
    handleValueChanged(value, key, hasErrors = false, debounceMillis = 0, debounceType = 'debounce-commit-to-queue') {
        if (debounceMillis !== this.currentDebounceTime || debounceType !== this.currentDebounceType) {
            // Run reRender immediately, but throttle commitChangeOpToQueue
            if (debounceType === 'debounce-commit-to-queue') {
                this.currentMutateAndRenderFn = this.mutateAndRender.bind(this);
                this.currentEmitChangesOpFn = timingUtils.debounce(this.emitCommitChangesFn.bind(this), debounceMillis);
            // Throttle reRender, which throttles commitToQueue as well
            } else if (debounceType === 'debounce-re-render-and-commit-to-queue') {
                this.currentMutateAndRenderFn = timingUtils.debounce(this.mutateAndRender.bind(this), debounceMillis);
                this.currentEmitChangesOpFn = this.emitCommitChangesFn.bind(this);
            // Run both immediately
            } else {
                this.currentMutateAndRenderFn = this.mutateAndRender.bind(this);
                this.currentEmitChangesOpFn = this.emitCommitChangesFn.bind(this);
            }
            this.currentDebounceTime = debounceMillis;
            this.currentDebounceType = debounceType;
        }
        //
        const ret = this.currentMutateAndRenderFn(value, key, hasErrors);
        if (ret) this.currentEmitChangesOpFn(ret.block1, ret.block2);
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleDoInheritGlobalBlockValsChanged(e) {
        const oldVal = this.state.useOverrides;
        const newVal = e.target.checked;
        if (!oldVal && newVal) {
            const valBefore = Object.assign({}, putOrGetSnapshot(this.props.base, blockTypes.get('GlobalBlockReference')));
            const valAfter = Object.assign({}, valBefore, {useOverrides: 1});
            internalOverwriteData(valAfter, this.props.base);
            this.emitCommitChangesFn({valBefore, valAfter, block: this.props.base},
                                     {valBefore: null, valAfter: null, block: null});
        } else if (oldVal && !newVal) {
            //
        }
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
        } else if ($b.block) {
            internalOverwriteData($b.valBefore, $b.block);
            BlockTrees.currentWebPage.reRenderBlockInPlace($b.block);
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
    const $this = BlockEditForm3.currentInstance;
    if (block.id === $this.props.block.id) {
        $this.editFormImplRef.current.overrideValues($a.valBefore);
    } else if (isMetaBlock && block.id === $this.props.base.id) {
        $this.setState({useOverrides: $a.valBefore.useOverrides});
    }
}

/**
 * @typedef CommandContext
 * @prop {{valBefore: RawBlockData; valAfter: RawBlockData; block: Block;}} block1
 * @prop {{valBefore: RawBlockData|null; valAfter: RawBlockData|null; block: Block|null;}} block2
 */

export default BlockEditForm3;
