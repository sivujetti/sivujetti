import {__} from './temp.js';

const paragraphBlockReRender = (newDataFromForm, blockRef, _prevData) => {
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
        this.state = {text: props.blockData.text};
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
        this.props.blockData.text = this.state.text;
    }
}

const blockType = {
    reRender: paragraphBlockReRender,
    getInitialData: paragraphBlockGetInitialData,
    FormImpl: ParagraphBlockFormInputs,
    friendlyName: 'Paragraph',
};

export default blockType;
