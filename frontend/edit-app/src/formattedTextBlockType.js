import {__} from './temp.js';

const formattedTextBlockReRender = (newDataFromForm, blockRef, _prevData) => {
    blockRef.tryToReRenderWithHtml(newDataFromForm.html);
};

const formattedTextBLockGetInitialData = () => ({
    html: `<pre>${__('Text here')}</pre>`,
});

/*
interface FormInputs {
    applyLatestValue();
}
*/

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
        this.props.onValueChanged({html});
    }
    applyLatestValue() {
        this.props.blockData.html = this.state.html;
    }
}

const blockType = {
    reRender: formattedTextBlockReRender,
    getInitialData: formattedTextBLockGetInitialData,
    FormImpl: FormattedTextBlockFormInputs,
    friendlyName: 'Formatted text',
};

export default blockType;
