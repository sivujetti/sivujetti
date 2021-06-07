import {__} from './temp.js';

const headingBlockReRender = (newDataFromForm, blockRef, prevData) => {
    if (newDataFromForm.level === prevData.level)
        blockRef.reRenderWithText(newDataFromForm.text);
    else {
        const newHNode = document.createElement(`h${newDataFromForm.level}`);
        newHNode.textContent = newDataFromForm.text;
        if (prevData.type === 0) {
            const oldHNode = blockRef.startingCommentNode.nextElementSibling;
            for (const attr of oldHNode.attributes) newHNode.setAttribute(attr.name, attr.value);
        }
        blockRef.tryToReRenderWithHtml(newHNode.outerHTML);
    }
};

const headingBlockGetInitialData = () => ({
    text: __('Heading here'),
    level: 1,
});

/*
interface FormInputs {
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
        this.props.onValueChanged({text, level: this.props.blockData.level});
    }
    applyLatestValue() {
        this.props.blockData.text = this.state.text;
    }
}

const blockType = {
    reRender: headingBlockReRender,
    getInitialData: headingBlockGetInitialData,
    EditFormImpl: HeadingBlockFormInputs,
    CreateFormImpl: HeadingBlockFormInputs,
    friendlyName: 'Heading',
    defaultRenderer: 'kuura:auto',
};

export default blockType;
