import {__} from '../../commons/main.js';
import Icon from '../../commons/Icon.jsx';
import {blockTypes} from './BlockTypeSelector.jsx';
import BlockTrees from './BlockTrees.jsx';
import store, {pushItemToOpQueue} from './store.js';

class BlockEditForm extends preact.Component {
    // blockType;
    /**
     * @access protected
     */
    componentWillMount() {
        this.blockType = blockTypes.get(this.props.block.type);
    }
    /**
     * @access protected
     */
    render({block}) {
        return <>
            <div class="with-icon pb-1">
                <Icon iconId="type" className="size-xs color-accent mr-1"/>
                { __(block.type) }
            </div>
            <div class="mt-2">
                { preact.createElement(this.blockType.editForm, {
                    block,
                    onValueChanged: this.handleBlockValueChanged.bind(this),
                }) }
            </div>
        </>;
    }
    /**
     * @param {{[key: String]: any;}} newBlockPropsData
     * @access private
     */
    handleBlockValueChanged(newBlockPropsData) {
        this.props.block.overwritePropsData(newBlockPropsData);
        BlockTrees.currentWebPage.reRenderBlockInPlace(this.props.block);
        //
        store.dispatch(pushItemToOpQueue('update-tree-block',
            () => this.saveBlockTreeToBackend(this.props.block, this.props.blockTree)));
    }
    /**
     * @param {Block} _block
     * @param {Array<Block>} blockTree
     * @access private
     */
    saveBlockTreeToBackend(_block, blockTree) {
        return BlockTrees.saveExistingPageBlocksToBackend(blockTree);
    }
}

export default BlockEditForm;
