import {__, hookForm, unhookForm, Input, Textarea, InputErrors, FormGroupInline,
        validationConstraints} from '@sivujetti-commons-for-edit-app';
import {urlValidatorImpl} from '../../validation.js';

class PageTypeBasicInfoConfigurationForm extends preact.Component {
    /**
     * @param {{data: PageType; onPropChanged: (key: String, val: String) => void; layouts: Array<Layout>;}} props
     */
    constructor(props) {
        super(props);
        this.state = hookForm(this, [
            {name: 'name', value: props.data.name, validations: [['identifier'], ['maxLength', 64]], label: __('Name (for computers)'),
             onAfterValueChanged: (value, hasErrors) => { if (!hasErrors) this.emitPropChanged('name', value); }},
            {name: 'friendlyName', value: props.data.friendlyName, validations: [['minLength', 1], ['maxLength', 92]], label: __('Name'),
             onAfterValueChanged: (value, hasErrors) => { if (!hasErrors) this.emitPropChanged('friendlyName', value); }},
            {name: 'friendlyNamePlural', value: props.data.friendlyNamePlural, validations: [['minLength', 1], ['maxLength', 92]], label: __('Name (plural)'),
             onAfterValueChanged: (value, hasErrors) => { if (!hasErrors) this.emitPropChanged('friendlyNamePlural', value); }},
            {name: 'description', value: props.data.description, validations: [['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]], label: __('Description'),
             onAfterValueChanged: (value, hasErrors) => { if (!hasErrors) this.emitPropChanged('description', value); }},
            {name: 'slug', value: props.data.slug, validations: [['required'], ['maxLength', 92],
                [urlValidatorImpl, {allowExternal: false, allowEmpty: false}]], label: __('Slug'),
             onAfterValueChanged: (value, hasErrors) => { if (!hasErrors) this.emitPropChanged('slug', value.startsWith('/') ? value : `/${value}`); }},
        ], {
            isListable: props.data.isListable,
            defaultLayoutId: props.data.defaultLayoutId,
        });
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
    render({layouts}, {isListable, defaultLayoutId}) {
        return <div class="form-horizontal pt-0">
            <FormGroupInline>
                <label htmlFor="name" class="form-label">{ __('Name (for computers)') }</label>
                <Input vm={ this } prop="name" placeholder="Articles, Products"/>
                <InputErrors vm={ this } prop="name"/>
            </FormGroupInline>
            <FormGroupInline>
                <label htmlFor="friendlyName" class="form-label">{ __('Name') }</label>
                <Input vm={ this } prop="friendlyName" placeholder="Article, Product"/>
                <InputErrors vm={ this } prop="friendlyName"/>
            </FormGroupInline>
            <FormGroupInline>
                <label htmlFor="friendlyNamePlural" class="form-label">{ __('Name (plural)') }</label>
                <Input vm={ this } prop="friendlyNamePlural" placeholder="Articles, Products"/>
                <InputErrors vm={ this } prop="friendlyNamePlural"/>
            </FormGroupInline>
            <FormGroupInline>
                <label htmlFor="description" class="form-label">{ __('Description') }</label>
                <Textarea vm={ this } prop="description" rows="3"/>
                <InputErrors vm={ this } prop="description"/>
            </FormGroupInline>
            <FormGroupInline>
                <label htmlFor="slug" class="form-label">{ __('Slug') }</label>
                <Input vm={ this } prop="slug" placeholder="/articles, /products"/>
                <InputErrors vm={ this } prop="slug"/>
            </FormGroupInline>
            <FormGroupInline>
                <span class="form-label">{ __('Listable') }?</span>
                <label class="form-checkbox mt-0">
                    <input
                        onClick={ this.emitPropChangeditIsListable.bind(this) }
                        checked={ isListable }
                        type="checkbox"
                        class="form-input"/><i class="form-icon"></i>
                </label>
            </FormGroupInline>
            { layouts.length ? <FormGroupInline>
                <label class="form-label" htmlFor="layout">{ __('Default layout') }</label>
                <select
                    value={ defaultLayoutId }
                    onChange={ this.handleDefaltLayoutChanged.bind(this) }
                    class="form-select form-input tight"
                    name="layout"
                    id="layout">{ layouts.map(({id, friendlyName}) =>
                    <option value={ id }>{ __(friendlyName) }</option>
                ) }</select>
            </FormGroupInline> : null }
        </div>;
    }
    /**
     * @param {keyof PageType} prop
     * @param {any} value
     * @access private
     */
    emitPropChanged(prop, value) {
        this.props.onPropChanged(prop,value);
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleDefaltLayoutChanged(e) {
        const defaultLayoutId = e.target.value;
        this.setState({defaultLayoutId});
        this.emitPropChanged('defaultLayoutId', defaultLayoutId);
    }
    /**
     * @param {Event} e
     * @access private
     */
    emitPropChangeditIsListable(e) {
        const isListable = e.target.checked ? 1 : 0;
        this.setState({isListable});
        this.emitPropChanged('isListable', isListable === 1);
    }
}

export default PageTypeBasicInfoConfigurationForm;
