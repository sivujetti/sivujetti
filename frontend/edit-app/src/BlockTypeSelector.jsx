import {__} from '../../commons/main.js';
import blockTypes from './block-types/all.js';

class BlockTypeSelector extends preact.Component {
    /**
     * @param {{onSelectionConfirmed: (placeholderBlock: Block) => void; onSelectionChanged: (blockBluePrint: BlockBlueprint, placeholderBlock: Block) => void; onSelectionDiscarded: (placeholderBlock: Block) => void; block: Block;}} props
     */
    constructor(props) {
        super(props);
        this.state = {blockBluePrint: {blockType: props.block.type}};
    }
    /**
     * @access protected
     */
    render(_, {blockBluePrint}) {
        return <div class="dashed p-2">
            <select
                value={ blockBluePrint.blockType }
                onChange={ e => this.selectBlockType(e.target.value) }
                class="form-input form-select tight mb-2">{ Array.from(blockTypes.entries()).map(([name, blockType]) =>
                <option value={ name }>
                    { __(blockType.friendlyName) }
                </option>
            ) }</select>
            <button class="btn btn-sm btn-primary widen" onClick={ this.apply.bind(this) } type="button">Ok</button>
            <button class="btn btn-sm btn-link" onClick={ this.discard.bind(this) } type="button">{ __('Cancel') }</button>
        </div>;
    }
    /**
     * @param {string} blockTypeName
     * @access private
     */
    selectBlockType(blockTypeName) {
        if (this.state.blockBluePrint.blockType === blockTypeName) return;
        const blockType = blockTypes.get(blockTypeName);
        const providedInitialData = blockType.initialData; // BlockBlueprint|Object
        const blockBluePrint = !providedInitialData.blockType
            ? {blockType: blockType.name, data: providedInitialData, children: []}
            : providedInitialData;
        this.setState({blockBluePrint});
        this.props.onSelectionChanged(blockBluePrint, this.props.block);
    }
    /**
     * @access private
     */
    apply() {
        this.props.onSelectionConfirmed(this.props.block);
    }
    /**
     * @access private
     */
    discard() {
        this.props.onSelectionDiscarded(this.props.block);
    }
}

export default BlockTypeSelector;
export {blockTypes};
