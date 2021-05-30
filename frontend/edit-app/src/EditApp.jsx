import {__} from './temp.js';

const TODO = 282;

const BLOCK_TYPE_HEADING = 0;

const blockTypeToString = [
    'Heading', // 0
    'Paragraph', // 1
    'Formatted text', // 2
];

const blockReRenderers = [
    /* Heading */ (newDataFromEditBoxForm, blockRef, prevData) => {
        if (newDataFromEditBoxForm.level === prevData.level)
            blockRef.reRenderWithText(newDataFromEditBoxForm.text);
        else {
            const newHNode = document.createElement(`h${newDataFromEditBoxForm.level}`);
            newHNode.textContent = newDataFromEditBoxForm.text;
            if (prevData.type === BLOCK_TYPE_HEADING) {
                const oldHNode = blockRef.startingCommentNode.nextElementSibling;
                for (const attr of oldHNode.attributes) newHNode.setAttribute(attr.name, attr.value);
            }
            blockRef.tryToReRenderWithHtml(newHNode.outerHTML);
        }
    },
    /* Paragraph */ (newDataFromEditBoxForm, blockRef, _prevData) => {
        blockRef.reRenderWithText(newDataFromEditBoxForm.text);
    },
    /* Formatted text */ (newDataFromEditBoxForm, blockRef, _prevData) => {
        blockRef.tryToReRenderWithHtml(newDataFromEditBoxForm.html);
    },
];

/*
interface FormInputs {
    handleInput(e);
    applyLatestValue();
}
*/

class HeadingBlockFormInputs extends preact.Component {
    constructor(props) {
        super(props);
        this.state = {text: props.blockData.text};
    }
    render(_, {text}) {
        return <>
            <select>{ [1,2,3,4,5,6].map(level =>
                <option value={ level }>Heading { level }</option>
            ) }</select>
            <textarea onInput={ this.handleInput.bind(this) }>{ text }</textarea>
        </>;
    }
    handleInput(e) {
        const text = e.target.value;
        this.setState({text});
        this.props.handleValueChange({text, level: this.props.blockData.level});
    }
    applyLatestValue() {
        this.props.blockData.text = this.state.text;
    }
}

class ParagraphBlockFormInputs extends preact.Component {
    constructor(props) {
        super(props);
        this.state = {text: props.blockData.text};
    }
    render(_, {text}) {
        return <textarea onInput={ this.handleInput.bind(this) }>{ text }</textarea>;
    }
    handleInput(e) {
        const text = e.target.value;
        this.setState({text});
        this.props.handleValueChange({text});
    }
    applyLatestValue() {
        this.props.blockData.text = this.state.text;
    }
}

class FormattedTextBlockFormInputs extends preact.Component {
    constructor(props) {
        super(props);
        this.state = {html: props.blockData.html};
    }
    render(_, {html}) {
        /* todo use quill editor */
        return <textarea onInput={ this.handleInput.bind(this) }>{ html }</textarea>;
    }
    handleInput(e) {
        const html = e.target.value;
        this.setState({html});
        this.props.handleValueChange({html});
    }
    applyLatestValue() {
        this.props.blockData.html = this.state.html;
    }
}

const blockForms = [
    /* Heading */ HeadingBlockFormInputs,
    /* Paragraph */ ParagraphBlockFormInputs,
    /* Formatted text */ FormattedTextBlockFormInputs,
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
                        <button onClick={ () => this.editBox.current.open(b, this.findBlockData(b)) } title={ __('Edit') }>{ __(blockTypeToString[this.findBlockData(b).type]) }</button>
                    </div>),
                    <EditBox ref={ this.editBox }/>,
                    <AddContentBox ref={ this.addBox } onBlockAdded={ this.addBlock.bind(this) }/>
                ]
                : <p>{ __('No blocks on this page') }</p>,
            <button onClick={ () => this.addBox.current.open(blocks[blocks.length - 1]) } title={ __('Add content to current page') }>Add content</button>
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
        const newBlockRef = EditApp.currentWebPage.addBlock(after, __('Text here'));
        this.setState({isOpen: true,
                       newBlockRef,
                       newBlockData: createBlockData({
                           type: 1,
                           slot: 'main',
                           renderer: 'auto',
                           id: newBlockRef.blockId
                        })/*??*/});
    }
    /**
     * @acces protected
     */
    render (_, {isOpen, newBlockRef, newBlockData}) {
        if (!isOpen)
            return;
        const Form = blockForms[newBlockData.type];
        const rect = newBlockRef.position;
        return <form class="edit-box" style={ `left: ${TODO+rect.left}px; top: ${rect.top}px` }
             onSubmit={ this.applyNewContent.bind(this) }>
            <div class="edit-box__inner">
                <div><select><option>Main</option><option>Sidebar</option></select></div>
                <div><select value={ newBlockData.type } onChange={ this.foo.bind(this) }>{ blockTypeToString.map((name, i) =>
                    <option value={ i }>{ __(name) }</option>
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
    foo(e) {
        const newBlockData = createBlockData({
            type: parseInt(e.target.value),
            slot: this.state.newBlockData.slot,
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
    const reRender = blockReRenderers[type];
    if (!reRender)
        throw new Error('hoo');
    reRender(newData, blockRef, currentData);
}

function createBlockData(from) { // ?? 
    const newBlockData = {type: from.type,
                          slot: from.slot,
                          renderer: from.renderer,
                          id: from.id};
    if (newBlockData.type === 0) {
        newBlockData.text = __('Heading here');
        newBlockData.level = 1;
    } else if (newBlockData.type === 1) {
        newBlockData.text = __('Text here');
    } else if (newBlockData.type === 2) {
        newBlockData.html = `<pre>{ __('Text here') ]</pre>`;
    } else {
        throw new Error('??');
    }
    return newBlockData;
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
        const Form = blockForms[blockData.type];
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
        const reRender = blockReRenderers[this.state.blockData.type];
        if (!reRender)
            throw new Error('hoo');
        reRender(newData, this.state.blockRef, this.state.blockData);
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
