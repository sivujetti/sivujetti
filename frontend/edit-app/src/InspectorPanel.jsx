import {__} from './temp.js';
import services from './services.js';
import {tryToReRenderBlock, saveBlockToBackend} from './EditBox.jsx';

class InspectorPanel extends preact.Component {
    /**
     * @todo
     */
    constructor(props) {
        super(props);
        this.state = {Renderer: null, rendererProps: null};
    }
    /**
     * @todo
     * @todo
     * @access public
     */
    show(viewName, props) {
        const Renderer = {
            'block-details': BlockShowDetails,
        }[viewName];
        if (!Renderer)
            throw new Error(`Unknown view "${viewName}"`);
        this.setState({Renderer, rendererProps: props});
    }
    render(_, {Renderer, rendererProps}) {
        if (!Renderer)
            return null;
        return preact.createElement(Renderer, rendererProps);
    }
}

class BlockShowDetails extends preact.Component {
    /**
     * @todo
     */
    constructor(props) {
        super(props);
        this.state = {hasChanges: false};
        this.currentForm = preact.createRef();
    }
    render({block}, {hasChanges}) {
        const t = services.blockTypes.get(block.data.type);
        const Form = t.EditFormImpl;
        return <div>
            { !hasChanges ? null : <div><button onClick={ this.saveChanges.bind(this) } type="button">{ __('Save changes') }</button></div> }
            <h2>{ t.friendlyName }</h2>
            <Form onValueChanged={ this.handleBlockValueChanged.bind(this) } block={ block } ref={ this.currentForm }/>
        </div>;
    }
    /**
     * @todo
     */
    handleBlockValueChanged(newData) {
        tryToReRenderBlock(this.props.block.ref, newData, this.props.block.data);
        this.setState({hasChanges: true});
    }
    /**
     * @todo
     */
    saveChanges() {
        this.currentForm.current.applyLatestValue(); // mutates this.props.block
        saveBlockToBackend(this.props.block.ref.blockId, this.props.block.data);
    }
}

export default InspectorPanel;
