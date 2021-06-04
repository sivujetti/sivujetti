import {__} from './temp.js';
import services from './services.js';
import EditBox, {createBlockData, tryToReRenderBlock} from './EditBox.jsx';

const TODO = 282;

class EditApp extends preact.Component {
    constructor(props) {
        super(props);
        this.state = {blocks: null};
        this.editBox = preact.createRef();
        this.addBox = preact.createRef();
        this.mainView = preact.createRef(); // public
        EditApp.currentWebpage = null;
    }
    /**
     * @param {string} name
     * @todo
     * @return todo
     * @access public
     */
    registerBlockType(name, blockType) {
        // @todo validate
        services.blockTypes.set(name, blockType);
    }
    /**
     * Kutsutaan ifamen sisältä joka kerta, kun siihen latautuu uusi sivu.
     * @todo
     * @todo
     */
    handleWebpageLoaded(currentWebPage, currentWebPageBlocks) {
        EditApp.currentWebPage = currentWebPage;
        this.data = currentWebPageBlocks;
        this.setState({blocks: currentWebPage.getBlockRefs()});
    }
    /**
     * @acces protected
     */
    render(_, {blocks}) {
        // The webpage iframe hasn't loaded yet
        if (blocks === null)
            return;
        return [
            blocks.length
                ? [
                    blocks.map(b => <div class={ `block` }>
                        <button onClick={ () => this.editBox.current.open(b, this.findBlockData(b)) } title={ __('Edit') } class="btn">{ services.blockTypes.get(b.blockType).friendlyName }{ !this.findBlockData(b).title ? null : <span>{ this.findBlockData(b).title }</span> }</button>
                    </div>),
                    <EditBox ref={ this.editBox }/>,
                    <AddContentBox ref={ this.addBox } onBlockAdded={ this.addBlock.bind(this) }
                        findLastBlock={ sectionName => this.findLastBlock(sectionName) }/>,
                    <MainView ref={ this.mainView }/>
                ]
                : <p>{ __('No blocks on this page') }</p>,
            <button onClick={ () => this.addBox.current.open(this.findLastBlock('main')) } title={ __('Add content to current page') } class="btn">{ __('Add content') }</button>
        ];
    }
    /**
     * @todo
     * @return todo
     * @access private
     */
    findBlockData(blockRef) {
        return this.data.find(blockData => blockData.id === blockRef.blockId);
    }
    /**
     * @todo
     * @todo
     * @access private
     */
    addBlock(newBlockRef, blockData) {
        this.data.push(blockData);
        this.setState({blocks: this.state.blocks.concat(newBlockRef)});
    }
    findLastBlock(sectionName) {
        return this.state.blocks.reduce((l, b) =>
            (this.findBlockData(b) || {}).section === sectionName ? b : l
        , null);
    }
}

class MainView extends preact.Component {
    /**
     * @param {todo} props
     */
    constructor(props) {
        super(props);
        this.state = {isOpen: false};
        this.rendererProps = null;
    }
    /**
     * @todo
     * @acces public
     */
    open(Renderer, props) {
        this.rendererProps = Object.assign({view: this}, props);
        this.setState({isOpen: true, Renderer});
    }
    /**
     * @acces public
     */
    close() {
        this.setState({isOpen: false});
    }
    /**
     * @acces protected
     */
    render(_, {isOpen, Renderer}) {
        if (!isOpen)
            return;
        return <div id="view" class={ !isOpen ? '' : 'open' }>{
            preact.createElement(Renderer, this.rendererProps)
        }</div>;
    }
}

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
        const newBlockRef = EditApp.currentWebPage.addBlock(services.blockTypes.get('paragraph').getInitialData().text, after);
        this.setState({isOpen: true,
                       newBlockRef,
                       newBlockData: createBlockData({
                           type: 'paragraph',
                           section: 'main', // ??
                           renderer: 'auto', // ??
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
        const newBlockRef = EditApp.currentWebPage.moveBlock(this.state.newBlockRef,
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
            renderer: this.state.newBlockData.renderer, // todo http.get('block-types/newBlockRef.type').defaultRenderer
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
            pageId: EditApp.currentWebPage.pageId,
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

export default EditApp;
