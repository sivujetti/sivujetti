import {http, __, env, signals} from '@sivujetti-commons';
import Icon from '../../commons/Icon.jsx';
import blockTypes from './block-types/block-types.js';
import {EMPTY_OVERRIDES} from './block-types/globalBlockReference.js';
import BlockTrees from './BlockTrees.jsx';
import blockTreeUtils from './blockTreeUtils.js';
import store, {pushItemToOpQueue} from './store.js';
import {timingUtils} from './utils.js';

class BlockEditForm extends preact.Component {
    // a; // Current reRender function closure
    // b; // Current commitToQueue function closure
    // currentDebouceTime;
    // currentDebounceType;
    // blockType;
    // unregisterSignalListener;
    /**
     * @access protected
     */
    componentWillMount() {
        this.a = null;
        this.b = null;
        this.currentDebouceTime = null;
        this.currentDebounceType = null;
        this.blockType = blockTypes.get(this.props.block.type);
        this.setState({doUseOverrides: this.props.base && this.props.base.overrides !== EMPTY_OVERRIDES});
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
     * @param {{block: Block; blockTreeCmp: preact.Component; base: Block|null;}} props
     * @access protected
     */
    render({block, blockTreeCmp, base}, {doUseOverrides}) {
        return <>
            <div class="with-icon pb-1">
                <Icon iconId="type" className="size-xs color-accent mr-1"/>
                { __(block.type) }
            </div>
            <div class="mt-2">
                { base !== null
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
                            <Icon iconId="info"/>
                        </span>
                    </div>
                    : null
                }
                { preact.createElement(this.blockType.editForm, {
                    block,
                    blockTree: blockTreeCmp,
                    onValueChanged: this.handleBlockValueChanged.bind(this),
                    key: `${block.id}-${!doUseOverrides ? 'no-override' : 'with-overrides'}`,
                }) }
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
            this.setState({doUseOverrides: true});
        } else if (!newVal && curVal) {
            // Update base's (globalBlockRef) overrides
            const overrides = this.props.base.propsData.find(({key}) => key === 'overrides');
            overrides.value = removeOverridesFor(this.props.block, JSON.parse(overrides.value));
            this.props.base.overrides = overrides.value;
            // Restore global block's defaults to inner block (globalBlockRef.__blockTree['someBlock'])
            http.get(`/api/global-block-trees/${this.props.base.globalBlockTreeId}`)
                .then(({blocks}) => {
                    this.setState({doUseOverrides: false});
                    const defaultProps = blockTreeUtils.findBlock(this.props.block.id, blocks)[0];
                    this.b = () => this.commitChangeToQueue('page');
                    this.reRenderBlock(defaultProps); // Note: mutates globalBlockTreeBlocks.someTree
                })
                .catch(env.window.console.error);
        }
    }
    /**
     * @access private
     */
    reRenderBlock(newBlockPropsData) {
        this.props.block.overwritePropsData(newBlockPropsData);
        return BlockTrees.currentWebPage.reRenderBlockInPlace(this.props.block).then(() => {
            this.b();
        });
    }
    /**
     * @param {String|null} blockIsStoredTo = null
     * @access private
     */
    commitChangeToQueue(blockIsStoredTo = null) {
        if (!blockIsStoredTo) {
            blockIsStoredTo = !this.props.base || !this.state.doUseOverrides
                ? this.props.block.isStoredTo
                : this.props.base.isStoredTo;
        }
        //
        if (this.state.doUseOverrides) {
            const overrides = this.props.base.propsData.find(({key}) => key === 'overrides');
            overrides.value = addOverridesFor(this.props.block, JSON.parse(overrides.value));
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
                this.a = this.reRenderBlock.bind(this);
                this.b = timingUtils.debounce(this.commitChangeToQueue.bind(this), debounceMillis);
            // Throttle reRender, which throttles commitToQueue as well
            } else if (debounceType === 'debounce-re-render-and-commit-to-queue') {
                this.a = timingUtils.debounce(this.reRenderBlock.bind(this), debounceMillis);
                this.b = this.commitChangeToQueue.bind(this);
            // Run both immediately
            } else {
                this.a = this.reRenderBlock.bind(this);
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
function addOverridesFor(block, allOverrides) {
    allOverrides[block.id] = block.propsData.reduce((out, propData) => {
        out[propData.key] = propData.value;
        return out;
    }, {});
    return JSON.stringify(allOverrides);
}

/**
 * @param {Block} block The block whose props to remove from $allOverrides
 * @param {{[blockId: String]: Object;}} allOverrides
 * @returns {String} Jsonified $allOverrides which no longer contains overrides for $block
 */
function removeOverridesFor(block, allOverrides) {
    delete allOverrides[block.id];
    return JSON.stringify(allOverrides);
}

export default BlockEditForm;
