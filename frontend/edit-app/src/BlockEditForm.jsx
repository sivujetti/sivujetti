import {http, __, env, signals} from './commons/main.js';
import Icon from './commons/Icon.jsx';
import {timingUtils} from './commons/utils.js';
import blockTypes from './block-types/block-types.js';
import {EMPTY_OVERRIDES} from './block-types/globalBlockReference.js';
import BlockTrees from './BlockTrees.jsx';
import blockTreeUtils from './blockTreeUtils.js';
import store, {pushItemToOpQueue} from './store.js';

class BlockEditForm extends preact.Component {
    // a; // Current reRender function closure
    // b; // Current commitToQueue function closure
    // currentDebouceTime;
    // currentDebounceType;
    // blockType;
    // unregisterSignalListener;
    /**
     * @param {{block: Block; blockTreeCmp: preact.Component; base: Block|null;}} props
     * @access protected
     */
    componentWillMount() {
        this.a = null;
        this.b = null;
        this.currentDebouceTime = null;
        this.currentDebounceType = null;
        this.blockType = blockTypes.get(this.props.block.type);
        const doUseOverrides = this.props.base && this.props.base.useOverrides;
        const isOuterMost = this.props.base && this.props.block.id === this.props.base.__globalBlockTree.blocks[0].id;
        this.setState({doUseOverrides, isOuterMost});
        this.unregisterSignalListener = signals.on('on-block-deleted',
            /**
             * @param {Block} _block
             * @param {Boolean} wasCurrentlySelectedBlock
             */
            (_block, wasCurrentlySelectedBlock) => {
                if (wasCurrentlySelectedBlock) this.props.inspectorPanel.close();
            });
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unregisterSignalListener();
    }
    /**
     * @access protected
     */
    render({block, blockTreeCmp}, {doUseOverrides, isOuterMost}) {
        const EditFormImpl = this.blockType.editForm;
        return <>
            <div class="with-icon pb-1">
                <Icon iconId={ this.blockType.icon } className="size-xs color-accent mr-1"/>
                { __(block.type) }
            </div>
            <div class="mt-2">
                { isOuterMost
                    ? <div class="input-group mini-toggle">
                        <label class="form-switch input-sm color-dimmed pr-0" title={ __('Specialize this global block') }>
                            <input
                                onChange={ this.handleDoInheritGlobalBlockValsChanged.bind(this) }
                                type="checkbox"
                                checked={ doUseOverrides }/>
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
                <EditFormImpl {...{
                    block,
                    blockTree: blockTreeCmp,
                    onValueChanged: this.handleBlockValueChanged.bind(this),
                    key: `${block.id}-${!doUseOverrides ? 'no-override' : 'with-overrides'}`,
                }}/>
            </div>
        </>;
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleDoInheritGlobalBlockValsChanged(e) {
        const newVal = e.target.checked;
        const curVal = this.state.doUseOverrides;
        if (newVal && !curVal) {
            this.props.base.overwritePropsData({overrides: EMPTY_OVERRIDES,
                useOverrides: 1,
                globalBlockTreeId: this.props.base.globalBlockTreeId});
            this.setState({doUseOverrides: true});
        } else if (!newVal && curVal) {
            const cur = this.props.base.__globalBlockTree.blocks;
            http.get(`/api/global-block-trees/${this.props.base.globalBlockTreeId}`)
                .then(({blocks}) => {
                    this.setState({doUseOverrides: false});
                    // Restore inner blocks' defaults (globalBlockRef.__blockTree[*])
                    const k = Object.keys(JSON.parse(this.props.base.overrides));
                    const l = k.length-1;
                    for (let i = 0; i <= l; ++i) {
                        const defaultProps = blockTreeUtils.findBlock(k[i], blocks)[0];
                        const block = blockTreeUtils.findBlock(k[i], cur)[0];
                        this.overwritePropsAndRenderBlock(defaultProps, block, () => {
                            BlockTrees.currentWebPage.registerBlockMouseListeners(block._cref);
                        });
                    }
                    // Restore globalBlockRef's defaults
                    const overrides = this.props.base.propsData.find(({key}) => key === 'overrides');
                    overrides.value = '{}';
                    this.props.base.useOverrides = 0;
                    this.props.base.overrides = overrides.value;
                    this.commitChangeToQueue('page', false);
                })
                .catch(env.window.console.error);
        }
    }
    /**
     * @param {{[key: String]: any;}} newBlockPropsData
     * @param {Block} block = this.props.block
     * @param {() => void} then = null
     * @access private
     */
    overwritePropsAndRenderBlock(newBlockPropsData, block = this.props.block, then = null) {
        block.overwritePropsData(newBlockPropsData);
        return BlockTrees.currentWebPage.reRenderBlockInPlace(block).then(() => {
            (then || this.b)();
        });
    }
    /**
     * @param {String|null} blockIsStoredTo = null
     * @param {Boolean} doUseOverrides = this.state.doUseOverrides
     * @access private
     */
    commitChangeToQueue(blockIsStoredTo = null, doUseOverrides = this.state.doUseOverrides) {
        if (!blockIsStoredTo) {
            blockIsStoredTo = !this.props.base || !this.props.base.useOverrides
                ? this.props.block.isStoredTo
                : this.props.base.isStoredTo;
        }
        //
        if (doUseOverrides) {
            const overrides = this.props.base.propsData.find(({key}) => key === 'overrides');
            overrides.value = setOverridesOf(this.props.block, JSON.parse(overrides.value));
            this.props.base.overrides = overrides.value;
        }
        //
        const blockTree = blockIsStoredTo !== 'globalBlockTree'
            ? this.props.blockTreeCmp.getTree()
            : this.props.blockTreeCmp.getTreeFor(this.props.block);
        //
        const globalBlockTreeId = blockIsStoredTo !== 'globalBlockTree'
            ? null
            : this.props.block.globalBlockTreeId;
        //
        store.dispatch(pushItemToOpQueue(`update-${blockIsStoredTo}-block`, {
            doHandle: this.props.blockTreeCmp.props.onChangesApplied,
            args: [blockTree, blockIsStoredTo, globalBlockTreeId],
        }));
    }
    /**
     * @param {{[key: String]: any;}} newBlockPropsData
     * @param {Number=} debounceMillis = 0
     * @param {'debounce-commit-to-queue'|'debounce-re-render-and-commit-to-queue'|'debounce-none'=} debounceType = 'debounce-none'
     * @returns {Promise<null>}
     * @access private
     */
    handleBlockValueChanged(newBlockPropsData, debounceMillis = 0, debounceType = 'debounce-commit-to-queue') {
        if (debounceMillis !== this.currentDebouceTime || debounceType !== this.currentDebounceType) {
            // Run reRender immediately, but throttle commitChangeToQueue
            if (debounceType === 'debounce-commit-to-queue') {
                this.a = this.overwritePropsAndRenderBlock.bind(this);
                this.b = timingUtils.debounce(this.commitChangeToQueue.bind(this), debounceMillis);
            // Throttle reRender, which throttles commitToQueue as well
            } else if (debounceType === 'debounce-re-render-and-commit-to-queue') {
                this.a = timingUtils.debounce(this.overwritePropsAndRenderBlock.bind(this), debounceMillis);
                this.b = this.commitChangeToQueue.bind(this);
            // Run both immediately
            } else {
                this.a = this.overwritePropsAndRenderBlock.bind(this);
                this.b = this.commitChangeToQueue.bind(this);
            }
            this.currentDebouceTime = debounceMillis;
            this.currentDebounceType = debounceType;
        }
        this.a(newBlockPropsData);
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

export default BlockEditForm;
