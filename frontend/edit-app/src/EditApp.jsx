import {__} from './temp.js';

const TODO = 282;

const blockReRenderers = {
    'Heading': (newDataFromEditBoxForm, blockRef) => {
        // todo handle newDataFromEditBoxForm.level
        blockRef.reRenderWithText(newDataFromEditBoxForm.text);
    },
    'Paragraph': (newDataFromEditBoxForm, blockRef) => {
        blockRef.reRenderWithText(newDataFromEditBoxForm.text);
    },
    'Formatted text': (newDataFromEditBoxForm, blockRef) => {
        blockRef.tryToReRenderWithHtml(newDataFromEditBoxForm.html);
    },
};

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
        this.props.handleValueChange({text});
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

const blockForms = {
    'Heading': HeadingBlockFormInputs,
    'Paragraph': ParagraphBlockFormInputs,
    'Formatted text': FormattedTextBlockFormInputs,
};

class EditApp extends preact.Component {
    constructor(props) {
        super(props);
        this.state = {blocks: null};
        this.openedEditBox = preact.createRef();
    }
    /**
     * Kutsutaan ifamen sisältä joka kerta, kun siihen latautuu uusi sivu.
     * @todo
     * @todo
     */
    handleWebpageLoaded(currentWebPage, currentWebPageBlocks) {
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
                ? [blocks.map(b => <div>
                    <h3>{ b.type }</h3>
                    <button onClick={ () => this.openedEditBox.current.open(b, this.findBlockData(b)) }>{ __('Edit') }</button>
                </div>), <EditBox ref={ this.openedEditBox }/>]
                : <p>{ __('No blocks on this page') }</p>,
            <button title={ __('Add content to current page') }>Add content</button>
        ];
    }
    /**
     * @access private
     */
    findBlockData(blockRef) {
        return this.data.find(blockData => blockData.id === blockRef.blockId);
    }
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
        const Form = blockForms[blockRef.type];
        return <form class="edit-box" style={ `left: ${TODO+blockRef.position.left}px; top: ${blockRef.position.top}px` }
            onSubmit={ this.applyChanges.bind(this) }>
            <div class="edit-box__inner">
                <Form handleValueChange={ this.handleBlockValueChanged.bind(this) } blockData={ blockData } ref={ this.currentForm}/>
                <button class="btn btn-primary">{ __('Apply') }</button>
                <button class="btn btn-link" onClick={ this.cancelChanges.bind(this) } type="button">{ __('Cancel') }</button>
            </div>
        </form>;
    }
    /**
     * @todo
     * @access private
     */
    handleBlockValueChanged(newData) {
        const reRender = blockReRenderers[this.state.blockRef.type];
        if (!reRender)
            throw new Error('hoo');
        reRender(newData, this.state.blockRef);
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
    cancelChanges() {
        // @todo revert if changed
        this.setState({isOpen: false});
    }
}

export default EditApp;
