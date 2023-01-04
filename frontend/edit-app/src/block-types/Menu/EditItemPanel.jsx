import {__, api, hookForm, unhookForm, reHookValues, Input, InputErrors, FormGroupInline} from '@sivujetti-commons-for-edit-app';
import {validationConstraints} from '../../constants.js';

class EditItemPanel extends preact.Component {
    // link;
    /**
     * @param {{link: MenuLink; cssClass: String; onLinkUpdated: (mutatedLink: MenuLink) => void; endEditMode: () => void; panelHeight: Number;}} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.link && !this.link) {
            this.link = Object.assign({}, props.link);
            this.setState(hookForm(this, [
                {name: 'linkText', value: this.link.text, validations: [['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]], label: __('Link text'),
                onAfterValueChanged: (value, hasErrors) => { this.emitChange(value, 'text', hasErrors); }},
                {name: 'linkSlug', value: this.link.slug, validations: [['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]], label: __('Url'),
                onAfterValueChanged: (value, hasErrors) => { this.emitChange(value, 'slug', hasErrors); }},
            ]));
            api.inspectorPanel.getEl().scrollTo({top: 0});
        } else if (!props.link && this.link) {
            this.link = null;
        } else if (props.link && this.link && props.link !== this.props.link) { // undo
            this.link = Object.assign({}, props.link);
            reHookValues(this, [{name: 'linkText', value: this.link.text},
                                {name: 'linkSlug', value: this.link.slug}]);
        }
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
    render({panelHeight, cssClass, endEditMode}) {
        return <div class={ cssClass } style={ `top: -${panelHeight + 8}px` }>{ this.state.values ? [
            <button onClick={ endEditMode } class="btn btn-sm" type="button"> &lt; </button>,
            <div class="form-horizontal pt-0">
                <FormGroupInline>
                    <label htmlFor="linkText" class="form-label">{ __('Link text') }</label>
                    <Input vm={ this } prop="linkText"/>
                    <InputErrors vm={ this } prop="linkText"/>
                </FormGroupInline>
                <FormGroupInline>
                    <label htmlFor="linkSlug" class="form-label">{ __('Url') }</label>
                    <Input vm={ this } prop="linkSlug" placeholder={ __('e.g. %s or %s', '/my-page', 'https://page.com') }/>
                    <InputErrors vm={ this } prop="linkSlug"/>
                </FormGroupInline>
            </div>
        ] : null }</div>;
    }
    /**
     * @param {String} value
     * @param {String} prop 'text'|'slug'
     * @param {Boolean} hasErrors
     * @access private
     */
    emitChange(value, prop, hasErrors) {
        if (hasErrors) return;
        this.link[prop] = value;
        this.props.onLinkUpdated(this.link);
    }
}

export default EditItemPanel;
