import {__} from '../../commons/main.js';
import blockTypes from './block-types/all.js';
import Block from './Block.js';

class BlockTypeSelector extends preact.Component {
    /**
     * @param {{onSelectionConfirmed: (blockType: BlockType, blockData: Object) => void; onSelectionChanged: (blockType: BlockType, blockData: Object) => void; onSelectionDiscarded: (blockData: Object) => void; block: Block;};}} props
     */
    constructor(props) {
        super(props);
        this.state = {blockData: Object.assign({}, props.block)};
    }
    /**
     * @access protected
     */
    render(_, {blockData}) {
        return <div class="dashed p-2">
            <select
                value={ blockData.type }
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
        if (this.state.blockData.type === blockTypeName) return;
        //
        const blockType = blockTypes.get(blockTypeName);
        const blockData = Block.fromType(blockType);
        blockData.id = this.props.block.id;
        blockData._cref = this.props.block._cref;
        //
        this.setState({blockData});
        this.props.onSelectionChanged(blockType,
                                      blockData);
    }
    /**
     * @access private
     */
    apply() {
        this.props.onSelectionConfirmed(blockTypes.get(this.state.blockData.type),
                                        this.state.blockData);
    }
    /**
     * @access private
     */
    discard() {
        this.props.onSelectionDiscarded(this.state.blockData);
    }
}

export default BlockTypeSelector;
export {blockTypes};
