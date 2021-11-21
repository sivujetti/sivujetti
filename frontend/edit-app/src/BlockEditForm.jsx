import {__, signals} from '@sivujetti-commons';
import Icon from '../../commons/Icon.jsx';
import blockTypes from './block-types/block-types.js';
import BlockTrees from './BlockTrees.jsx';
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
     * @param {{block: Block; blockTreeCmp: preact.Component;}} props
     * @access protected
     */
    render({block, blockTreeCmp}) {
        return <>
            <div class="with-icon pb-1">
                <Icon iconId="type" className="size-xs color-accent mr-1"/>
                { __(block.type) }
            </div>
            <div class="mt-2">
                { preact.createElement(this.blockType.editForm, {
                    block,
                    blockTree: blockTreeCmp,
                    onValueChanged: this.handleBlockValueChanged.bind(this),
                }) }
            </div>
        </>;
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
     * @access private
     */
    commitChangeToQueue() {
        const blockIsStoredTo = !this.props.base
            ? this.props.block.isStoredTo
            : this.props.base.isStoredTo;
        //
        const blockTree = blockIsStoredTo !== 'globalBlockTree'
            ? this.props.blockTreeCmp.getTree()
            : this.props.blockTreeCmp.getTreeFor(this.props.block);
        //
        const blockTreeId = blockIsStoredTo !== 'globalBlockTree'
            ? null
            : this.props.block.globalBlockTreeId;
        //
        store.dispatch(pushItemToOpQueue(`update-${blockIsStoredTo}-block`, {
            doHandle: this.props.blockTreeCmp.props.onChangesApplied,
            args: [blockTree, blockIsStoredTo, blockTreeId],
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

export default BlockEditForm;
