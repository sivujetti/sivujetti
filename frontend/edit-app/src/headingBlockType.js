import {__} from './temp.js';

const headingBlockReRender = (newDataFromEditBoxForm, blockRef, prevData) => {
    if (newDataFromEditBoxForm.level === prevData.level)
        blockRef.reRenderWithText(newDataFromEditBoxForm.text);
    else {
        const newHNode = document.createElement(`h${newDataFromEditBoxForm.level}`);
        newHNode.textContent = newDataFromEditBoxForm.text;
        if (prevData.type === 0) {
            const oldHNode = blockRef.startingCommentNode.nextElementSibling;
            for (const attr of oldHNode.attributes) newHNode.setAttribute(attr.name, attr.value);
        }
        blockRef.tryToReRenderWithHtml(newHNode.outerHTML);
    }
};

const headingBLockGetInitalData = () => ({
    text: __('Heading here'),
    level: 1,
});

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

const blockType = {
    reRender: headingBlockReRender,
    getInitialData: headingBLockGetInitalData,
    FormImpl: HeadingBlockFormInputs,
    friendlyName: 'Heading',
};

export default blockType;
