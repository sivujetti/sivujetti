import {
    __,
    api,
    env,
    FormGroupInline,
    hookForm,
    http,
    Input,
    InputErrors,
    LoadingSpinner,
    Textarea,
    unhookForm,
    urlValidatorImpl,
    validationConstraints,
} from '@sivujetti-commons-for-edit-app';

class PageTypeBasicInfoConfigurationForm extends preact.Component {
    /**
     * @returns {PageTypeStub}
     * @access public
     */
    getResult() {
        return {
            ...this.state.values,
            defaultLayoutId: this.state.defaultLayoutId,
            isListable: this.state.isListable,
        };
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const initial = api.saveButton.getInstance().getChannelState('pageTypes').at(-1);
        this.setState(hookForm(this, [
            {name: 'name', value: initial.name, validations: [['identifier'], ['maxLength', 64]],
             label: __('Name (for computers)')},
            {name: 'friendlyName', value: initial.friendlyName, validations: [['minLength', 1], ['maxLength', 92]],
             label: __('Name')},
            {name: 'friendlyNamePlural', value: initial.friendlyNamePlural, validations: [['minLength', 1], ['maxLength', 92]],
             label: __('Name (plural)')},
            {name: 'description', value: initial.description, validations: [['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]],
             label: __('Description')},
            {name: 'slug', value: initial.slug, validations: [['required'], ['maxLength', 92],
             [urlValidatorImpl, {allowExternal: false, allowEmpty: false}]], label: __('Slug')},
        ], {
            isListable: !!initial.isListable,
            defaultLayoutId: initial.defaultLayoutId.toString(),
        }));
        http.get('/api/layouts')
            .then(layouts => { this.setState({layouts}); })
            .catch(env.window.console.error);
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        if (this.state.values)
            unhookForm(this);
    }
    /**
     * @access protected
     */
    render(_, {isListable, defaultLayoutId, layouts, values}) {
        if (!values) return;
        return <div class="form-horizontal pt-0">
            <FormGroupInline>
                <label htmlFor="pageType_name" class="form-label">{ __('Name (for computers)') }</label>
                <Input vm={ this } prop="name" id="pageType_name" placeholder="Articles, Products"/>
                <InputErrors vm={ this } prop="name"/>
            </FormGroupInline>
            <FormGroupInline>
                <label htmlFor="pageType_friendlyName" class="form-label">{ __('Name') }</label>
                <Input vm={ this } prop="friendlyName" id="pageType_friendlyName" placeholder="Article, Product"/>
                <InputErrors vm={ this } prop="friendlyName"/>
            </FormGroupInline>
            <FormGroupInline>
                <label htmlFor="pageType_friendlyNamePlural" class="form-label">{ __('Name (plural)') }</label>
                <Input vm={ this } prop="friendlyNamePlural" id="pageType_friendlyNamePlural" placeholder="Articles, Products"/>
                <InputErrors vm={ this } prop="friendlyNamePlural"/>
            </FormGroupInline>
            <FormGroupInline>
                <label htmlFor="pageType_description" class="form-label">{ __('Description') }</label>
                <Textarea vm={ this } prop="description" id="pageType_description" rows="3"/>
                <InputErrors vm={ this } prop="description"/>
            </FormGroupInline>
            <FormGroupInline>
                <label htmlFor="pageType_slug" class="form-label">{ __('Slug') }</label>
                <Input vm={ this } prop="slug" id="pageType_slug" placeholder="/articles, /products"/>
                <InputErrors vm={ this } prop="slug"/>
            </FormGroupInline>
            <FormGroupInline>
                <span class="form-label">{ __('Listable') }?</span>
                <label class="form-checkbox mt-0">
                    <input
                        onClick={ e => this.setState({isListable: e.target.checked}) }
                        checked={ isListable }
                        type="checkbox"
                        class="form-input"/><i class="form-icon"></i>
                </label>
            </FormGroupInline>
            { layouts ? <FormGroupInline>
                <label class="form-label" htmlFor="pageType_layout">{ __('Default layout') }</label>
                <select
                    value={ defaultLayoutId }
                    onChange={ e => this.setState({defaultLayoutId: e.target.value}) }
                    class="form-select form-input tight"
                    name="layout"
                    id="pageType_layout">{ layouts.map(({id, friendlyName}) =>
                    <option value={ id }>{ __(friendlyName) }</option>
                ) }</select>
            </FormGroupInline> : <LoadingSpinner/> }
        </div>;
    }
}

export default PageTypeBasicInfoConfigurationForm;
