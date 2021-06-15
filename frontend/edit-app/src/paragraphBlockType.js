import {__} from './temp.js';

const paragraphBlockReRender = (newDataFromForm, blockRef, prevData) => {
    if (!prevData.type) {
        blockRef.tryToReRenderWithHtml(`<p>${newDataFromForm.text}</p>`); // attrs ?
        return;
    }
    blockRef.reRenderWithText(newDataFromForm.text);
};

const paragraphBlockGetInitialData = () => ({
    text: __('Text here'),
});

/*
interface FormInputs {
    applyLatestValue();
}
*/

class ParagraphBlockFormInputs extends preact.Component {
    constructor(props) {
        super(props);
        this.state = {text: props.block.data.text};
    }
    render(_, {text}) {
        return <textarea onInput={ this.handleInput.bind(this) }>{ text }</textarea>;
    }
    handleInput(e) {
        const text = e.target.value;
        this.setState({text});
        this.props.onValueChanged({text});
    }
    applyLatestValue() {
        this.props.block.data.text = this.state.text;
    }
}

const blockType = {
    reRender: paragraphBlockReRender,
    getInitialData: paragraphBlockGetInitialData,
    EditFormImpl: ParagraphBlockFormInputs,
    CreateFormImpl: ParagraphBlockFormInputs,
    friendlyName: 'Paragraph',
    defaultRenderer: 'kuura:auto',
};

export default blockType;
