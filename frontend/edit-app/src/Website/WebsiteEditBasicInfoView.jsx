import {__, http, hookForm, unhookForm, handleSubmit, FormGroupInline, Input,
        Textarea, InputErrors, LoadingSpinner} from '@sivujetti-commons-for-edit-app';
import {validationConstraints} from '../constants.js';
import OverlayView from '../commons/OverlayView.jsx';
import toasters from '../commons/Toaster.jsx';
import store2 from '../store2.js';
import setFocusTo from '../block-types/auto-focusers.js';

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
        this.createState(store2.get().theWebsiteBasicInfo);
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
    render(_, {langTag, formIsSubmittingClass}) {
        return <OverlayView>
            <h2>{ __('Edit website info') }</h2>
            <p style="font-size:.8rem">{ __('todo11') }</p>
            <form onSubmit={ e => handleSubmit(this, this.boundHandleSubmit, e) } class="form-horizontal pt-1">{ langTag ? [
                <FormGroupInline>
                    <label htmlFor="name" class="form-label">{ __('Name') }</label>
                    <Input vm={ this } prop="name" ref={ this.nameInput }/>
                    <InputErrors vm={ this } prop="name"/>
                </FormGroupInline>,
                <FormGroupInline>
                    <label htmlFor="description" class="form-label">{ __('Description') }</label>
                    <Textarea vm={ this } prop="description"/>
                    <InputErrors vm={ this } prop="description"/>
                </FormGroupInline>,
                <FormGroupInline>
                    <label htmlFor="description" class="form-label">{ __('Language') }</label>
                    <select
                        value={ langTag }
                        onChange={ this.handleLangChanged.bind(this) }
                        class="form-input form-select">{ this.selectableLangs.map(code =>
                        <option value={ code }>{ code }</option>
                    ) }</select>
                </FormGroupInline>,
                <button class={ `btn btn-primary mt-8${formIsSubmittingClass}` } type="submit">{ __('Save changes') }</button>
            ] : <LoadingSpinner/> }
            </form>
        </OverlayView>;
    }
    /**
     * @param {TheWebsiteBasicInfo} websiteBasicInfo
     * @access private
     */
    createState(websiteBasicInfo) {
        this.setState(hookForm(this, [
            {name: 'name', value: websiteBasicInfo.name, validations: [['required'],
                ['maxLength', validationConstraints.INDEX_STR_MAX_LENGTH]], label: __('Name')},
            {name: 'description', value: websiteBasicInfo.description, validations: [
                ['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]], label: __('Description')},
        ], {
            langTag: websiteBasicInfo.langTag,
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
        };
        return http.put('/api/the-website/basic-info', data)
            .then(resp => {
                if (resp.ok !== 'ok') throw new Error;
                store2.dispatch('theWebsiteBasicInfo/set', [{
                    name: data.name,
                    langTag: `${data.lang}_${data.country}`,
                    description: data.description,
                }]);
                toasters.editAppMain(__('Saved website\'s basic info.'), 'success');
            });
    }
}

export default WebsiteEditBasicInfoView;
