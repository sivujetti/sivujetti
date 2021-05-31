import {__} from './temp.js';

const paragraphBlockReRender = (newDataFromEditBoxForm, blockRef, _prevData) => {
    blockRef.reRenderWithText(newDataFromEditBoxForm.text);
};

const paragraphBLockGetInitalData = () => ({
    text: __('Text here'),
});

/*
interface FormInputs {
    handleInput(e);
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
        this.props.handleValueChange({text});
    }
    applyLatestValue() {
        this.props.blockData.text = this.state.text;
    }
}

const blockType = {
    reRender: paragraphBlockReRender,
    getInitialData: paragraphBLockGetInitalData,
    FormImpl: ParagraphBlockFormInputs,
    friendlyName: 'Paragraph',
};

export default blockType;
