// ## import {__, api, hookForm, unhookForm, reHookValues, Input, InputErrors, FormGroupInline,
// ##         validationConstraints} from '@sivujetti-commons-for-edit-app';
// ## import {PickUrlInputGroup} from '../button.js';
// ## 
// ## class EditItemPanel extends preact.Component {
// ##     // isOpen;
// ##     /**
// ##      * @param {{link: MenuLink; cssClass: String; onLinkUpdated: (mutatedLink: MenuLink) => void; endEditMode: () => void; panelHeight: Number;}} props
// ##      * @access protected
// ##      */
// ##     componentWillReceiveProps(props) {
// ##         if (props.link && !this.isOpen) {
// ##             this.isOpen = true;
// ##             this.setState(hookForm(this, [
// ##                 {name: 'linkText', value: props.link.text, validations: [['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]], label: __('Link text'),
// ##                 onAfterValueChanged: (value, hasErrors, source) => { if (!hasErrors && source !== 'undo') this.props.onLinkPropUpdated(value, 'text'); }},
// ##             ], {
// ##                 linkTo: props.link.slug,
// ##             }));
// ##             api.inspectorPanel.getEl().scrollTo({top: 0});
// ##         } else if (this.isOpen && !props.link) {
// ##             this.isOpen = false;
// ##         } else if (this.isOpen && props.link) {
// ##             if (this.state.values.linkText !== props.link.text)
// ##                 reHookValues(this, [{name: 'linkText', value: props.link.text}]);
// ##             if (this.state.linkTo !== props.link.slug)
// ##                 this.setState({linkTo: props.link.slug});
// ##         }
// ##     }
// ##     /**
// ##      * @access protected
// ##      */
// ##     componentWillUnmount() {
// ##         unhookForm(this);
// ##     }
// ##     /**
// ##      * @access protected
// ##      */
// ##     render({panelHeight, cssClass, endEditMode}, {linkTo}) {
// ##         return <div class={ cssClass } style={ `top: -${panelHeight + 8}px` }>{ this.state.values ? [
// ##             <button onClick={ endEditMode } class="btn btn-sm" type="button"> &lt; </button>,
// ##             <div class="form-horizontal pt-0">
// ##                 <FormGroupInline>
// ##                     <label htmlFor="linkText" class="form-label">{ __('Link text') }</label>
// ##                     <Input vm={ this } prop="linkText" id="linkText"/>
// ##                     <InputErrors vm={ this } prop="linkText"/>
// ##                 </FormGroupInline>
// ##                 <PickUrlInputGroup linkTo={ linkTo } onUrlPicked={ normalized => {
// ##                     this.props.onLinkPropUpdated(normalized, 'slug');
// ##                 } }/>
// ##             </div>
// ##         ] : null }</div>;
// ##     }
// ## }
// ## 
// ## export default EditItemPanel;
