import {__} from './temp.js';
import services from './services.js';
import {createBlockData, tryToReRenderBlock} from './EditBox.jsx';

const TODO = 282;

class AddContentBox extends preact.Component {
    /**
     * @param {{onBlockAdded: (blockRef, blockData) => void;}} props
     */
    constructor(props) {
        super(props);
        this.state = {isOpen: false, newBlockRef: null, newBlockData: null};
        this.currentForm = preact.createRef();
    }
    /**
     * @todo
     * @todo @todo combine these?
     * @acces public
     */
    open(after) {
        const newBlockRef = this.props.EditApp.currentWebPage.addBlock(services.blockTypes.get('paragraph').getInitialData().text, after);
        this.setState({isOpen: true,
                       newBlockRef,
                       newBlockData: createBlockData({
                           type: 'paragraph',
                           section: 'main', // ??
                           id: newBlockRef.blockId
                        })});
    }
    /**
     * @acces protected
     */
    render(_, {isOpen, newBlockRef, newBlockData}) {
        if (!isOpen)
            return;
        const Form = services.blockTypes.get(newBlockData.type).CreateFormImpl;
        const rect = newBlockRef.position;
        return <form class="edit-box" style={ `left: ${TODO+rect.left}px; top: ${rect.top}px` }
             onSubmit={ this.applyNewContent.bind(this) }>
            <div class="edit-box__inner">
                <div><select value={ this.state.newBlockData.section } onChange={ this.handleSectionTargetChanged.bind(this) }>
                    <option value="main">Main</option>
                    <option value="sidebar">Sidebar</option>
                </select></div>
                <div><select value={ newBlockData.type } onChange={ this.handleBlockTypeChanged.bind(this) }>{ Array.from(services.blockTypes.entries()).map(([name, blockType]) =>
                    <option value={ name }>{ __(blockType.friendlyName) }</option>
                ) }</select></div>
                <Form onValueChanged={ this.handleBlockValueChanged.bind(this) } blockData={ newBlockData } ref={ this.currentForm }/>
                <button class="btn btn-primary">{ __('Apply') }</button>
                <button class="btn btn-link" onClick={ this.discardNewContent.bind(this) } type="button">{ __('Cancel') }</button>
            </div>
        </form>;
    }
    /**
     * @todo
     * @access private
     */
    handleSectionTargetChanged(e) {
        const newBlockData = Object.assign({}, this.state.newBlockData);
        newBlockData.section = e.target.value;
        const newBlockRef = this.props.EditApp.currentWebPage.moveBlock(this.state.newBlockRef,
            newBlockData.section);
        if (!newBlockRef) // section element not found, @todo handle
            return;
        this.setState({newBlockRef, newBlockData});
    }
    /**
     * @todo
     * @access private
     */
    handleBlockTypeChanged(e) {
        const newBlockData = createBlockData({
            type: e.target.value,
            section: this.state.newBlockData.section,
            renderer: this.state.newBlockData.renderer,
            id: this.state.newBlockData.id});
        tryToReRenderBlock(this.state.newBlockRef, newBlockData, this.state.newBlockData, newBlockData.type);
        this.setState({newBlockData});
    }
    /**
     * @todo
     */
    handleBlockValueChanged(newData) {
        tryToReRenderBlock(this.state.newBlockRef, newData, this.state.newBlockData);
    }
    /**
     * @todo
     * @access private
     */
    applyNewContent(e) {
        e.preventDefault();
        this.currentForm.current.applyLatestValue(); // mutates this.state.newBlockData
        this.setState({isOpen: false});
        services.http.post('/api/blocks', Object.assign({
            pageId: this.props.EditApp.currentWebPage.pageId,
        }, this.state.newBlockData)).then(_resp => {
            // todo update id (_resp.insertId)
            this.props.onBlockAdded(this.state.newBlockRef, this.state.newBlockData);
        })
        .catch(err => {
            // ??
            window.console.error(err);
        });
    }
    /**
     * @access private
     */
    discardNewContent() {
        this.state.newBlockRef.destroy();
        this.setState({isOpen: false});
    }
}

export default AddContentBox;
