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
    bgImage: '',
    cssClass: 'light',
});

class SectionBlockCreateFormInputs extends preact.Component {
    constructor(props) {
        super(props);
        this.state = {bgImage: '',
                      cssClass: props.block.data.cssClass,};
    }
    render(_, {cssClass, bgImage}) {
        return <>
            <div class="form-group">
                <label>{ __('Background image') }</label>
                <input value={ bgImage } onInput={ e => this.handleInput(e, 'bgImage') } list="fosfos" class="form-input"/>
            </div>
            <datalist id="fosfos">
                <option value="Image 1"/>
                <option value="Image 2"/>
            </datalist>
            <div class="form-group">
                <label>{ __('Foo') }</label>
                <select value={ cssClass } onChange={ e => this.handleInput(e, 'cssClass') } class="form-select">
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                </select>
            </div>
        </>;
    }
    handleInput(e, p) {
        const s = this.state;
        s[p] = e.target.value;
        this.setState({[p]: s[p]});
        this.props.onValueChanged(s);
    }
    applyLatestValue() {
        this.props.block.data.cssClass = this.state.cssClass;
        this.props.block.data.bgImage = this.state.bgImage;
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
