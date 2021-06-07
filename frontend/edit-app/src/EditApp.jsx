import {__} from './temp.js';
import services from './services.js';
import EditBox from './EditBox.jsx';
import AddBox from './AddBox.jsx';

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
                    <AddBox ref={ this.addBox } onBlockAdded={ this.addBlock.bind(this) }
                        findLastBlock={ sectionName => this.findLastBlock(sectionName) }
                        EditApp={ EditApp }/>,
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

export default EditApp;
