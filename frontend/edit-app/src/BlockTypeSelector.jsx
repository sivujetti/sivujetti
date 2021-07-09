import {__} from '../../commons/main.js';

const blockTypes = new Map;
blockTypes.set('Paragraph', {friendlyName: 'Paragraph', initialData: {text: __('Text here')}});

class BlockTypeSelector extends preact.Component {
    /**
     * @param {{onSelectionConfirmed: (blockType: BlockType, blockData: Object) => void; onSelectionDiscarded: (blockData: Object) => void; block: Block;}} props
     */
    constructor(props) {
        super(props);
        this.state = {blockData: Object.assign({}, props.block)};
    }
    /**
     * @access protected
     */
    render(_, {blockData}) {
        return <div>
            <div><select value={ blockData.type } onChange={ this.handleBlockTypeChanged.bind(this) }>{ Array.from(blockTypes.entries()).map(([name, blockType]) =>
                <option value={ name }>{ __(blockType.friendlyName) }</option>
            ) }</select></div>
            <button class="btn btn-sm btn-primary" onClick={ this.apply.bind(this) } type="button">{ __('Ok') }</button>
            <button class="btn btn-sm btn-link" onClick={ this.discard.bind(this) } type="button">{ __('Cancel') }</button>
        </div>;
    }
    /**
     * @param {InputEvent} e
     * @access private
     */
    handleBlockTypeChanged(e) {
        const newBlockData = {type: e.target.value};
        this.setState({blockData: Object.assign(this.state.blockData, newBlockData)});
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
