import {__} from '../../commons/main.js';
import Icon from '../../commons/Icon.jsx';
import {blockTypes} from './BlockTypeSelector.jsx';
import BlockTrees from './BlockTrees.jsx';
import Block from './Block.js';
import store, {pushItemToOpQueue} from './store.js';

class BlockEditForm extends preact.Component {
    // blockType;
    // blockClone;
    /**
     * @access protected
     */
    componentWillMount() {
        this.blockType = blockTypes.get(this.props.block.type);
        this.blockClone = Block.clone(this.props.block);
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
                { preact.createElement(this.blockType.EditForm, {
                    block,
                    onValueChanged: this.handleBlockValueChanged.bind(this),
                }) }
            </div>
        </>;
    }
    /**
     * @param {{[key: String]: any;}} newValue
     * @access private
     */
    handleBlockValueChanged(newValue) {
        Object.assign(this.blockClone, newValue);
        BlockTrees.currentWebPage.renderBlockInPlace(this.blockClone);
        //
        store.dispatch(pushItemToOpQueue('update-tree-block',
            () => this.saveBlockTreeToBackend(this.blockClone, this.props.blockTree)));
    }
    /**
     * @param {Block} blockClone
     * @param {Array<Block>} blockTree
     * @access private
     */
    saveBlockTreeToBackend(blockClone, blockTree) {
        const block = BlockTrees.findBlock(blockClone.id, blockTree)[0];
        //
        const newPropsMeta = [];
        for (const key of blockTypes.get(blockClone.type).ownPropNames) {
            block[key] = blockClone[key]; // Mutates block and blockTree
            newPropsMeta.push({key, value: block[key]});
        }
        block.ownProps = newPropsMeta;
        //
        return BlockTrees.saveExistingPageBlocksToBackend(blockTree);
    }
}

export default BlockEditForm;
