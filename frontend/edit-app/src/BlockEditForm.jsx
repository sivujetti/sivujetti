import {__, signals} from '@sivujetti-commons';
import Icon from '../../commons/Icon.jsx';
import blockTypes from './block-types/block-types.js';
import BlockTrees from './BlockTrees.jsx';
import store, {pushItemToOpQueue} from './store.js';

class BlockEditForm extends preact.Component {
    // blockType;
    // doCleanSignalListeners;
    /**
     * @access protected
     */
    componentWillMount() {
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
     * @param {{[key: String]: any;}} newBlockPropsData
     * @returns {Promise<null>}
     * @access private
     */
    handleBlockValueChanged(newBlockPropsData) {
        this.props.block.overwritePropsData(newBlockPropsData);
        return BlockTrees.currentWebPage.reRenderBlockInPlace(this.props.block).then(() => {
            //
            store.dispatch(pushItemToOpQueue('update-tree-block',
                () => this.saveBlockTreeToBackend(null, this.props.blockTree,
                    this.props.blockTreeKind)));
        });
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

export default BlockEditForm;
