import {__} from './temp.js';
import services from './services.js';

const todoIsBlockSavedToBackend = (_blockRef, blockData) =>
    !blockData.id.startsWith('new-')
;

const sectionBlockReRender = (newDataFromForm, blockRef, prevData) => {
    if (todoIsBlockSavedToBackend(blockRef, prevData)) {
        // ??
        return;
    }
    blockRef.tryToReRenderWithHtml(`<p>Loading ...</p>`);
    services.http.post('/api/defaults/section/render-template/kuura:generic-wrapper', newDataFromForm)
        .then(resp => blockRef.tryToReRenderWithHtml(resp.html))
        .catch(window.console.error);
};

const sectionBlockGetInitialData = () => ({
    cssClass: 'light',
});

class SectionBlockCreateFormInputs extends preact.Component {
    constructor(props) {
        super(props);
        this.state = {cssClass: props.block.data.cssClass};
    }
    render(_, {cssClass}) {
        return <>
            <select>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
            </select>
            <textarea onInput={ this.handleInput.bind(this) }>{ cssClass }</textarea>
        </>;
    }
    handleInput(e) {
        const cssClass = e.target.value;
        this.setState({cssClass});
        this.props.onValueChanged({cssClass});
    }
    applyLatestValue() {
        this.props.block.data.cssClass = this.state.cssClass;
    }
}

class SectionBlockEditFormInputs extends SectionBlockCreateFormInputs {
    //
}

const blockType = {
    reRender: sectionBlockReRender,
    getInitialData: sectionBlockGetInitialData,
    EditFormImpl: SectionBlockEditFormInputs,
    CreateFormImpl: SectionBlockCreateFormInputs,
    friendlyName: 'Section',
    defaultRenderer: 'section',
};

export default blockType;
