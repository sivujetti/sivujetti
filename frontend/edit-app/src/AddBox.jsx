import {__} from './temp.js';
import services from './services.js';
import {createBlockData, tryToReRenderBlock, Block} from './EditBox.jsx';

const TODO = 282;

class AddContentBox extends preact.Component {
    /**
     * @param {{onBlockAdded: (block) => void;}} props
     */
    constructor(props) {
        super(props);
        this.state = {isOpen: false, newBlock: null};
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
                       newBlock: new Block(createBlockData({
                           type: 'paragraph',
                           section: 'main', // ??
                           id: newBlockRef.blockId
                        }), newBlockRef, [])});
    }
    /**
     * @acces protected
     */
    render({currentPageLayoutSections}, {isOpen, newBlock}) {
        if (!isOpen)
            return;
        const Form = services.blockTypes.get(newBlock.data.type).CreateFormImpl;
        const rect = newBlock.ref.position;
        return <form class="edit-box" style={ `left: ${TODO+rect.left}px; top: ${rect.top}px` }
             onSubmit={ this.applyNewContent.bind(this) }>
            <div class="edit-box__inner">
                { currentPageLayoutSections && currentPageLayoutSections.length > 1 ?
                <div><select value={ this.state.newBlock.data.section } onChange={ this.handleSectionTargetChanged.bind(this) }>
                    { currentPageLayoutSections.map(name =>
                        <option value={ name }>{ name[0].toUpperCase()+name.substr(1) }</option>)
                    }
                </select></div> : null }
                <div><select value={ newBlock.data.type } onChange={ this.handleBlockTypeChanged.bind(this) }>{ Array.from(services.blockTypes.entries()).map(([name, blockType]) =>
                    <option value={ name }>{ __(blockType.friendlyName) }</option>
                ) }</select></div>
                <Form onValueChanged={ this.handleBlockValueChanged.bind(this) } block={ newBlock } ref={ this.currentForm }/>
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
        const newBlockData = Object.assign({}, this.state.newBlock.data);
        newBlockData.section = e.target.value;
        const newBlockRef = this.props.EditApp.currentWebPage.moveBlock(this.state.newBlock.ref,
            newBlockData.section);
        if (!newBlockRef) // section element not found, @todo handle
            return;
        const ref = this.state.newBlock;
        ref.data = newBlockData;
        ref.ref = newBlockRef;
        this.setState({newBlock: ref});
    }
    /**
     * @todo
     * @access private
     */
    handleBlockTypeChanged(e) {
        const newBlockData = createBlockData({
            type: e.target.value,
            section: this.state.newBlock.data.section,
            id: this.state.newBlock.data.id});
        tryToReRenderBlock(this.state.newBlock.ref, newBlockData, this.state.newBlock.data, newBlockData.type);
        this.setState({newBlock: Object.assign(this.state.newBlock, {data: newBlockData})});
    }
    /**
     * @todo
     */
    handleBlockValueChanged(newData) {
        tryToReRenderBlock(this.state.newBlock.ref, newData, this.state.newBlock.data);
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
            pageId: this.props.EditApp.currentWebPage.id,
        }, this.state.newBlock.data)).then(_resp => {
            // todo update id (_resp.insertId)
            this.props.onBlockAdded(this.state.newBlock.ref, this.state.newBlock.data);
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
        this.state.newBlock.ref.destroy();
        this.setState({isOpen: false});
    }
}


export default AddContentBox;
