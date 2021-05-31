import {__} from './temp.js';
import headingBlockType from './headingBlockType.js';
import paragraphBlockType from './paragraphBlockType.js';
import formattedTextBlockType from './formattedTextBlockType.js';

const TODO = 282;

const blockTypes = [
    headingBlockType,
    paragraphBlockType,
    formattedTextBlockType,
];

class EditApp extends preact.Component {
    constructor(props) {
        super(props);
        this.state = {blocks: null};
        this.editBox = preact.createRef();
        this.addBox = preact.createRef();
        EditApp.currentWebpage = null;
    }
    /**
     * @todo
     * @return todo
     * @access public
     */
    registerBlockType(blockType) {
        blockTypes.push(blockType);
        return blockTypes.length - 1;
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
                    blocks.map(b => <div>
                        <button onClick={ () => this.editBox.current.open(b, this.findBlockData(b)) } title={ __('Edit') }>{ __(blockTypes[this.findBlockData(b).type].friendlyName) }</button>
                    </div>),
                    <EditBox ref={ this.editBox }/>,
                    <AddContentBox ref={ this.addBox } onBlockAdded={ this.addBlock.bind(this) }
                        findLastBlock={ sectionName => this.findLastBlock(sectionName) }/>
                ]
                : <p>{ __('No blocks on this page') }</p>,
            <button onClick={ () => this.addBox.current.open(this.findLastBlock('main')) } title={ __('Add content to current page') }>Add content</button>
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
            this.findBlockData(b).section === sectionName ? b : l
        , null);
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
        const paragraphInitialData = blockTypes[1].getInitialData();
        const newBlockRef = EditApp.currentWebPage.addBlock(paragraphInitialData.text, after);
        this.setState({isOpen: true,
                       newBlockRef,
                       newBlockData: createBlockData({
                           type: 1,
                           section: 'main', // ??
                           renderer: 'auto', // ??
                           id: newBlockRef.blockId
                        })});
    }
    /**
     * @acces protected
     */
    render (_, {isOpen, newBlockRef, newBlockData}) {
        if (!isOpen)
            return;
        const Form = blockTypes[newBlockData.type].FormImpl;
        const rect = newBlockRef.position;
        return <form class="edit-box" style={ `left: ${TODO+rect.left}px; top: ${rect.top}px` }
             onSubmit={ this.applyNewContent.bind(this) }>
            <div class="edit-box__inner">
                <div><select value={ this.state.newBlockData.section } onChange={ this.handleSectionTargetChanged.bind(this) }>
                    <option value="main">Main</option>
                    <option value="sidebar">Sidebar</option>
                </select></div>
                <div><select value={ newBlockData.type } onChange={ this.handleBlockTypeChanged.bind(this) }>{ blockTypes.map((blockType, i) =>
                    <option value={ i }>{ __(blockType.friendlyName) }</option>
                ) }</select></div>
                <Form handleValueChange={ this.handleBlockValueChanged.bind(this) } blockData={ newBlockData } ref={ this.currentForm }/>
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

        // todo handle oldBlockData.type instead of always adding a paragraph
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
            type: parseInt(e.target.value),
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
        // @todo http.posr() or hard-reload
        this.currentForm.current.applyLatestValue(); // mutates this.state.newBlockData
        this.props.onBlockAdded(this.state.newBlockRef, this.state.newBlockData);
        this.setState({isOpen: false});
    }
    /**
     * @access private
     */
    discardNewContent() {
        this.state.newBlockRef.destroy();
        this.setState({isOpen: false});
    }
}

function tryToReRenderBlock(blockRef, newData, currentData, type = currentData.type) {
    const blockType = blockTypes[type];
    if (!blockType)
        throw new Error('hoo');
    blockType.reRender(newData, blockRef, currentData);
}

function createBlockData(from) {
    return Object.assign({
        type: from.type,
        section: from.section,
        renderer: from.renderer,
        id: from.id
    }, blockTypes[from.type].getInitialData());
}

/**
 * Note: mutates props.blockData
 */
class EditBox extends preact.Component {
    constructor(props) {
        super(props);
        this.state = {isOpen: false, blockRef: null, blockData: null};
        this.currentForm = preact.createRef();
    }
    /**
     * @todo
     * @todo @todo combine these?
     * @acces public
     */
    open(blockRef, blockData) {
        this.setState({isOpen: true, blockRef: blockRef, blockData});
    }
    /**
     * @acces protected
     */
    render (_, {isOpen, blockRef, blockData}) {
        if (!isOpen)
            return;
        const Form = blockTypes[blockData.type].FormImpl;
        const rect = blockRef.position;
        return <form class="edit-box" style={ `left: ${TODO+rect.left}px; top: ${rect.top}px` }
            onSubmit={ this.applyChanges.bind(this) }>
            <div class="edit-box__inner">
                <Form handleValueChange={ this.handleBlockValueChanged.bind(this) } blockData={ blockData } ref={ this.currentForm }/>
                <button class="btn btn-primary">{ __('Apply') }</button>
                <button class="btn btn-link" onClick={ this.discardChanges.bind(this) } type="button">{ __('Cancel') }</button>
            </div>
        </form>;
    }
    /**
     * @todo
     * @access private
     */
    handleBlockValueChanged(newData) {
        tryToReRenderBlock(this.state.blockRef, newData, this.state.blockData);
    }
    /**
     * @todo
     * @access private
     */
    applyChanges(e) {
        e.preventDefault();
        // @todo http.put() or hard-reload
        this.currentForm.current.applyLatestValue();
        this.setState({isOpen: false});
    }
    /**
     * @access private
     */
    discardChanges() {
        // @todo revert if changed
        this.setState({isOpen: false});
    }
}

export default EditApp;
