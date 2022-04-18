import {http, __, api, signals, env, Icon, InputError} from '@sivujetti-commons-for-edit-app';
import {compileSivujettiFlavoredCss} from '../../webpage/src/EditAppAwareWebPage.js';
import Tabs from './commons/Tabs.jsx';
import {timingUtils} from './commons/utils.js';
import toasters from './commons/Toaster.jsx';
import {getIcon} from './block-types/block-types.js';
import {EMPTY_OVERRIDES} from './block-types/globalBlockReference.js';
import BlockTrees from './BlockTrees.jsx';
import blockTreeUtils, {isGlobalBlockTreeRefOrPartOfOne} from './blockTreeUtils.js';
import store, {observeStore, selectGlobalBlockTreeBlocksStyles, pushItemToOpQueue,
               setGlobalBlockTreeBlocksStyles, selectPageBlockStyles, setPageBlockStyles,
               selectCurrentPage} from './store.js';

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
    // blockType;
    // isPartOfGlobalBlockTree;
    // editFormImpl;
    // snapshot;
    // editFormImplRef;
    // helperStyleEl;
    // borrowedStyles;
    // stylesResourceUrl;
    // unregistrables;
    // static currentInstance;
    // static undoingLockIsOn;
    /**
     * @param {{block: Block; blockTreeCmp: preact.Component; base: Block|null; inspectorPanel: preact.Component;}} props
     */
    constructor(props) {
        super(props);
        blockTypes = api.blockTypes;
        this.state = {currentTabIdx: 0, stylesString: undefined, stylesError: ''};
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const {block, base} = this.props;
        this.blockVals = new BlockValMutator(this.props);
        BlockEditForm.undoingLockIsOn = false;
        this.isOutermostBlockOfGlobalBlockTree = base && block.id === base.__globalBlockTree.blocks[0].id;
        this.blockType = blockTypes.get(block.type);
        this.isPartOfGlobalBlockTree = block.isStoredTo === 'globalBlockTree';
        this.editFormImpl = this.blockType.editForm;
        this.snapshot = putOrGetSnapshot(block, this.blockType);
        this.editFormImplRef = preact.createRef();
        this.helperStyleEl = document.createElement('style');
        document.head.appendChild(this.helperStyleEl);
        //
        const [selectStateFunc, findBlockStylesFunc] = !this.isPartOfGlobalBlockTree
            ? [selectPageBlockStyles, findBlockStyles]
            : [selectGlobalBlockTreeBlocksStyles, findStylesForGlobalBlockTreeBlocks];
        const state = store.getState();
        this.borrowedStyles = selectStateFunc(state);
        if (!this.isPartOfGlobalBlockTree) {
            const page = selectCurrentPage(state).webPage.data.page;
            this.stylesResourceUrl = `/api/pages/${page.type}/${page.id}/block-styles/${api.getActiveTheme().id}`;
        } else {
            this.stylesResourceUrl = `/api/global-block-trees/${block.globalBlockTreeId}/block-styles/${api.getActiveTheme().id}`;
        }
        //
        this.unregistrables = [observeStore(s => selectStateFunc(s),
        /**
         * @param {Array<RawBlockStyle>|Array<RawGlobalBlockTreeBlocksStyles>} allStyles
         */
        allStyles => {
            const latest = findBlockStylesFunc(allStyles, block);
            if (!latest)
                return;
            if (this.state.stylesString !== latest.styles) {
                this.setState({stylesString: latest.styles,
                               stylesStringNotCommitted: latest.styles,
                               stylesError: ''});
                this.borrowedStyles = allStyles;
            }
        }),
        signals.on('on-block-deleted', ({id}) => {
            if (id === block.id) this.props.inspectorPanel.close();
        })];
        this.handleCssInputChangedThrottled = timingUtils.debounce(
            handleCssInputChanged.bind(this),
            env.normalTypingDebounceMillis);
        //
        const styles = this.borrowedStyles.length ? findBlockStylesFunc(this.borrowedStyles, block) : null;
        const stylesString = styles ? styles.styles : '';
        this.setState({useOverrides: base && base.useOverrides,
                       currentTabIdx: 0,
                       stylesString,
                       stylesStringNotCommitted: stylesString,
                       stylesError: ''});
    }
    /**
     * @access protected
     */
    componentDidMount() {
        BlockEditForm.currentInstance = this;
        this.blockVals.setCurrentEditFormImplRef(BlockEditForm.currentInstance.editFormImplRef);
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        BlockEditForm.currentInstance = undefined;
        this.isOutermostBlockOfGlobalBlockTree = undefined;
        this.editFormImpl = undefined;
        this.snapshot = undefined;
        this.editFormImplRef = undefined;
        this.unregistrables.forEach(unreg => unreg());
        document.head.removeChild(this.helperStyleEl);
    }
    /**
     * @access protected
     */
    render({block, blockTreeCmp}, {useOverrides, currentTabIdx, stylesStringNotCommitted, stylesError}) {
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
        <Tabs
            links={ [__('Content'), __('Styles')] }
            onTabChanged={ toIdx => this.setState({currentTabIdx: toIdx}) }
            className="text-tinyish mt-0 mb-2"/>
        <div class={ currentTabIdx === 0 ? '' : 'd-none' }>
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
                    onValueChanged={ this.blockVals.handleSingleValueChanged.bind(this.blockVals) }
                    onManyValuesChanged={ this.blockVals.handleValuesChanged.bind(this.blockVals) }
                    snapshot={ this.snapshot }
                    ref={ this.editFormImplRef }
                    key={ block.id }/>
            </div>
        </div>
        <div class={ currentTabIdx === 0 ? 'd-none' : '' }>{ this.stylesResourceUrl.indexOf('/-') < 0
            ? <>
                <textarea
                    value={ stylesStringNotCommitted }
                    onInput={ this.handleCssInputChangedThrottled }
                    class={ `form-input${!stylesError ? '' : ' is-error border-default'}` }
                    rows="4"></textarea>
                <InputError errorMessage={ stylesError }/>
            </>
            : <div style="color: var(--color-fg-dimmed)">Tyylejä voi muokata sivun luomisen jälkeen.</div>
        }</div>
        </div>;
    }
    /**
     * @param {Array<RawBlockStyle>|Array<RawGlobalBlockTreeBlocksStyles>} newStyles
     * @param {Block} block
     * @returns {() => Promise<Boolean>}
     * @access private
     */
    createCommitFn(newStylesAll, block) {
        return () => {
            const newStyles = !this.isPartOfGlobalBlockTree
                ? newStylesAll
                : newStylesAll.find(bag => bag.globalBlockTreeId === block.globalBlockTreeId).styles;
            return http.put(this.stylesResourceUrl, {styles: newStyles})
                .then(resp => {
                    if (resp.ok !== 'ok') throw new Error('-');
                    return true;
                })
                .catch(err => {
                    env.window.console.error(err);
                    toasters.editAppMain(__('Something unexpected happened.'), 'error');
                    return false;
                });
        };
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
 * @param {Event} e
 */
function handleCssInputChanged(e) {
    const input = e.target.value;
    const committed = this.state.stylesString;
    // Empty input -> do not commit
    if (input.length < 3) {
        this.setState({stylesStringNotCommitted: input, stylesError: ''});
        return;
    }
    const compiled = compileSivujettiFlavoredCss('[data-dummy="dummy"]', input);
    const styleEl = this.helperStyleEl;
    styleEl.innerHTML = compiled;
    // Had non-empty input, but css doesn't contain any rules -> do not commit
    if (!styleEl.sheet.cssRules.length) {
        this.setState({stylesStringNotCommitted: input, stylesError: __('Styles must contain at least one CSS-rule')});
        return;
    }
    // Had non-empty input, and css does contain rules -> commit changes to the store
    const {block} = this.props;
    const newAll = dispatchNewBlockStyles(this.borrowedStyles, input,
                                          block, this.isPartOfGlobalBlockTree);
    //
    const commit = this.createCommitFn(newAll, block);
    const revert = () => {
        dispatchNewBlockStyles(this.borrowedStyles, committed, block, this.isPartOfGlobalBlockTree);
    };
    //
    store.dispatch(pushItemToOpQueue(`update-or-create-theme-${this.stylesResourceUrl}-block-styles`, {
        doHandle: ($commit, _$revert) => $commit(),
        doUndo(_$commit, $revert) { $revert(); },
        args: [commit, revert],
    }));
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
        const ret = this.currentMutateAndRenderFn(obj, hasErrors);
        if (ret) {
            this.dirtyQueue.push(ret.block1);
            this.currentEmitChangesOpFn(this.dirtyQueue, ret.block2);
        }
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
    mutateAndRender(obj, hasErrors) {
        const {block, base} = this.props;
        const valBefore = Object.assign({}, putOrGetSnapshot(block, blockTypes.get(block.type)));
        const valAfter = Object.assign({}, valBefore, obj);
        // - Mutate $block
        // - Tell emitCommitChangesFn to commit changes to the root tree using $block (block1.block)
        // - Instruct internalUndoVal to overwrite $block's data using block1.valBefore
        if (block.isStoredTo === 'page') {
            internalOverwriteData(valAfter, block);
            BlockTrees.currentWebPage.reRenderBlockInPlace(block);
            return !hasErrors ? {block1: {valBefore, valAfter, block}, block2: {valBefore: null, valAfter: null, block: null}} : null;
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
 * @param {Array<RawBlockStyle>|Array<RawGlobalBlockTreeBlocksStyles>} allStyles
 * @param {String} newVal e.g. '{ color: red; }'
 * @param {Block} block
 * @param {Boolean} isPartOfGlobalBlockTree
 * @returns {Array<RawBlockStyle>|Array<RawGlobalBlockTreeBlocksStyles>}
 */
function dispatchNewBlockStyles(allStyles, newVal, block, isPartOfGlobalBlockTree) {
    const clone = JSON.parse(JSON.stringify(allStyles));

    // 1. Find containing array
    const stylesRef = (function () {
        // Page block, style are always in the same array
        if (!isPartOfGlobalBlockTree) return clone;
        // Global tree block, find or create the array
        const {globalBlockTreeId} = block;
        let bag = clone.find(bag => bag.globalBlockTreeId === globalBlockTreeId);
        if (!bag) {
            const newBag = {globalBlockTreeId: block.globalBlockTreeId, styles: []};
            const newLen = clone.push(newBag);
            bag = clone[newLen - 1];
        }
        return bag.styles;
    })();

    // 2. Mutate the array or styles object in it
    // currentStyle references to pageBlockStyles[blockPos] (if isPartOfGlobalBlockTree = true)
    //                            globalBlockTreeBlocksStyles[globalTreeIdPos].styles[blockPos] (if isPartOfGlobalBlockTree = false)
    const currentStyles = findBlockStyles(stylesRef, block);
    if (currentStyles) {
        currentStyles.styles = newVal;
    } else {
        stylesRef.push({blockId: block.id, styles: newVal});
    }

    // 3. Commit
    const updateStateFunc = !isPartOfGlobalBlockTree
        ? setPageBlockStyles
        : setGlobalBlockTreeBlocksStyles;
    store.dispatch(updateStateFunc(clone)); // see also observeStore from this.componentWillMount
                                            // and observeStore @ EditApp.constructor
    return clone;
}

/**
 * @param {Array<RawBlockStyle>} from
 * @param {Block} block
 * @returns {RawBlockStyle|undefined}
 */
function findBlockStyles(from, {id}) {
    return from.find(s => s.blockId === id);
}

/**
 * @param {Array<RawGlobalBlockTreeBlocksStyles>} from
 * @param {Block} block
 * @returns {RawBlockStyle|undefined}
 */
function findStylesForGlobalBlockTreeBlocks(from, block) {
    const {globalBlockTreeId} = block;
    const bag = from.find(bag => bag.globalBlockTreeId === globalBlockTreeId);
    if (!bag) return undefined;
    return findBlockStyles(bag.styles, block);
}

/**
 * @typedef CommandContext
 * @prop {{valBefore: RawBlockData; valAfter: RawBlockData; block: Block;}} block1
 * @prop {{valBefore: RawBlockData|null; valAfter: RawBlockData|null; block: Block|null;}} block2
 */

export default BlockEditForm;
export {BlockValMutator};
