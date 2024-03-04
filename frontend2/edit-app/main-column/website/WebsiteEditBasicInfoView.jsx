import {
    __,
    FormGroupInline,
    handleSubmit,
    hookForm,
    http,
    Input,
    InputErrors,
    LoadingSpinner,
    setFocusTo,
    Textarea,
    unhookForm,
    validationConstraints,
} from '../../../sivujetti-commons-unified.js';
import globalData from '../../includes/globalData.js';
import toasters from '../../includes/toasters.jsx';
import OverlayView from '../OverlayView.jsx';

class WebsiteEditBasicInfoView extends preact.Component {
    // selectableLangs;
    // nameInput;
    // boundHandleSubmit;
    /**
     */
    constructor(props) {
        super(props);
        this.selectableLangs = ['fi_FI', 'en_US'];
        this.nameInput = preact.createRef();
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.boundHandleSubmit = this.saveChangesToBackend.bind(this);
        this.setStateAll(globalData.theWebsite);
    }
    /**
     * @access protected
     */
    componentDidMount() {
        setFocusTo(this.nameInput);
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        unhookForm(this);
    }
    /**
     * @access protected
     */
    render(_, {langTag, formIsSubmittingClass, hideFromSearchEngines}) {
        return <OverlayView>
            <h2>{ __('Edit website info') }</h2>
            <p style="font-size:.8rem">{ __('These details are visible to search engines and when sharing pages on social media channels.') }</p>
            <form onSubmit={ e => handleSubmit(this, this.boundHandleSubmit, e) } class="form-horizontal pt-1">{ langTag ? [
                <FormGroupInline>
                    <label htmlFor="name" class="form-label">{ __('Name') }</label>
                    <Input vm={ this } prop="name" id="name" ref={ this.nameInput }/>
                    <InputErrors vm={ this } prop="name"/>
                </FormGroupInline>,
                <FormGroupInline>
                    <label htmlFor="description" class="form-label">{ __('Description') }</label>
                    <Textarea vm={ this } prop="description" id="description"/>
                    <InputErrors vm={ this } prop="description"/>
                </FormGroupInline>,
                <FormGroupInline>
                    <label htmlFor="language" class="form-label">{ __('Language') }</label>
                    <select
                        value={ langTag }
                        onChange={ this.handleLangChanged.bind(this) }
                        class="form-input form-select"
                        id="language">{ this.selectableLangs.map(code =>
                        <option value={ code }>{ code }</option>
                    ) }</select>
                </FormGroupInline>,
                <FormGroupInline labelFlow="break">
                    <span class="form-label">{ __('Discourage search engines from indexing this site') }?</span>
                    <label class="form-checkbox mt-0">
                        <input
                            onClick={ e => this.setState({hideFromSearchEngines: e.target.checked}) }
                            checked={ hideFromSearchEngines }
                            type="checkbox"
                            class="form-input"/><i class="form-icon"></i>
                    </label>
                </FormGroupInline>,
                <button class={ `btn btn-primary mt-8${formIsSubmittingClass}` } type="submit">{ __('Save changes') }</button>
            ] : <LoadingSpinner/> }
            </form>
        </OverlayView>;
    }
    /**
     * @param {TheWebsite} website
     * @access private
     */
    setStateAll(website) {
        this.setState(hookForm(this, [
            {name: 'name', value: website.name, validations: [['required'],
                ['maxLength', validationConstraints.INDEX_STR_MAX_LENGTH]], label: __('Name')},
            {name: 'description', value: website.description, validations: [
                ['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]], label: __('Description')},
        ], {
            langTag: website.langTag,
            hideFromSearchEngines: website.hideFromSearchEngines,
        }));
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleLangChanged(e) {
        this.setState({langTag: e.target.value});
    }
    /**
     * @access private
     */
    saveChangesToBackend() {
        const [lang, country] = this.state.langTag.split('_');
        const data = {
            name: this.state.values.name,
            lang,
            country,
            description: this.state.values.description,
            hideFromSearchEngines: this.state.hideFromSearchEngines,
        };
        return http.put('/api/the-website/basic-info', data)
            .then(resp => {
                if (resp.ok !== 'ok') throw new Error;
                globalData.theWebsite = {
                    ...globalData.theWebsite,
                    ...{
                        name: data.name,
                        langTag: `${data.lang}_${data.country}`,
                        description: data.description,
                        hideFromSearchEngines: data.hideFromSearchEngines,
                    }
                };
                toasters.editAppMain(__('Saved website\'s basic info.'), 'success');
            });
    }
}

export default WebsiteEditBasicInfoView;
