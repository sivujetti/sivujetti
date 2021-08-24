import {__, signals} from '@sivujetti-commons';
import Icon from '../../commons/Icon.jsx';
import blockTypes from './block-types/block-types.js';
import BlockTrees from './BlockTrees.jsx';
import store, {pushItemToOpQueue} from './store.js';

class BlockEditForm extends preact.Component {
    // a; // Current reRender function closure
    // b; // Current commitToQueue function closure
    // currentDebouceTime;
    // currentDebounceType;
    // blockType;
    // doCleanSignalListeners;
    /**
     * @access protected
     */
    componentWillMount() {
        this.a = null;
        this.b = null;
        this.currentDebouceTime = null;
        this.currentDebounceType = null;
        this.blockType = blockTypes.get(this.props.block.type);
        this.doCleanSignalListeners = signals.on('on-block-deleted', (_block, wasCurrentlySelectedBlock) => {
            if (wasCurrentlySelectedBlock) this.props.inspectorPanel.close();
        });
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.doCleanSignalListeners();
    }
    /**
     * @param {{block: Block; blockTree: Array<Block>; blockTreeCmp: preact.Component; blockTreeKind: 'pageBlocks'|'layoutBlocks'; autoFocus: Boolean;}} props
     * @access protected
     */
    render({block, blockTreeCmp, autoFocus}) {
        return <>
            <div class="with-icon pb-1">
                <Icon iconId="type" className="size-xs color-accent mr-1"/>
                { __(block.type) }
            </div>
            <div class="mt-2">
                { preact.createElement(this.blockType.editForm, {
                    block,
                    blockTree: blockTreeCmp,
                    autoFocus,
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
        store.dispatch(pushItemToOpQueue('update-tree-block',
            () => this.saveBlockTreeToBackend(null, this.props.blockTree,
                this.props.blockTreeKind)));
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
                this.b = debounce(this.commitChangeToQueue.bind(this), debounceMillis);
            // Throttle reRender, which throttles commitToQueue as well
            } else if (debounceType === 'debounce-re-render-and-commit-to-queue') {
                this.a = debounce(this.reRenderBlock.bind(this), debounceMillis);
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
    /**
     * @param {Block} _block
     * @param {Array<Block>} blockTree
     * @param {'pageBlocks'|'layoutBlocks'} blockTreeKind
     * @access private
     */
    saveBlockTreeToBackend(_block, blockTree, blockTreeKind) {
        return BlockTrees.saveExistingPageBlocksToBackend(blockTree, blockTreeKind);
    }
}

/**
 * https://davidwalsh.name/javascript-debounce-function
 *
 * @param {Function} func
 * @param {Number} wait
 * @param {Boolean=} immediate
 */
function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

export default BlockEditForm;
