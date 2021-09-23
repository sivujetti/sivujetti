import {urlUtils, __, env} from '@sivujetti-commons';
import {unParagraphify} from './paragraph.js';
import {hookForm, InputGroup, InputGroupInline, InputError, Input} from '../../../commons/Form.jsx';
import QuillEditor from '../../../commons/QuillEditor.jsx';
import {formValidation} from '../constants.js';

class ButtonBlockEditForm extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState(hookForm(this, {
            linkTo: this.props.block.linkTo,
            cssClass: this.props.block.cssClass,
        }, {
            html: {
                value: this.props.block.html,
                validations: [['required'], ['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]],
                label: __('Content'),
                props: {myOnChange: this.emitChange.bind(this)}
            },
        }));
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.form.destroy();
    }
    /**
     * @param {BlockEditFormProps} _
     * @access protected
     */
    render(_, {classes, errors}) {
        return <>
            <InputGroup classes={ classes.html } className="has-error">
                <QuillEditor
                    name="html"
                    value={ this.props.block.html }
                    onChange={ html => {
                        this.form.triggerChange(html, "html");
                    } }
                    onBlur={ () => this.form.triggerBlur("html") }
                    toolbarBundle="simplest"/>
                <InputError error={ errors.html }/>
            </InputGroup>
            <div class="form-horizontal pt-0">
            <InputGroupInline classes={ classes.linkTo }>
                <label class="form-label" htmlFor="linkTo">{ __('Link') }</label>
                <Input vm={ this } name="linkTo" id="linkTo" errorLabel={ __('Link') } validations={ [['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]] } myOnChange={ this.emitChange.bind(this) }/>
                <InputError error={ errors.linkTo }/>
            </InputGroupInline>
            <InputGroupInline classes={ classes.cssClass }>
                <label class="form-label" htmlFor="cssClass" title={ __('Css classes') }>{ __('Css classes') }</label>
                <Input vm={ this } name="cssClass" id="cssClass" errorLabel={ __('Css classes') } validations={ [['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]] } myOnChange={ this.emitChange.bind(this) }/>
                <InputError error={ errors.cssClass }/>
            </InputGroupInline>
            </div>
        </>;
    }
    /**
     * @param {Object} newState
     * @access private
     */
    emitChange(newState) {
        this.props.onValueChanged({
            html: unParagraphify(newState.values.html),
            linkTo: newState.values.linkTo,
            cssClass: newState.values.cssClass,
        }, env.normalTypingDebounceMillis);
        return newState;
    }
}

export default () => {
    const initialData = {html: `${__('Button text')}`, linkTo: '/', cssClass: ''};
    return {
        name: 'Button',
        friendlyName: 'Button',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        reRender({html, linkTo, cssClass}, renderChildren) {
            const href = linkTo.indexOf('.') < 0
                ? urlUtils.makeUrl(linkTo)
                : `${linkTo.startsWith('//') || linkTo.startsWith('http') ? '' : '//'}${linkTo}`;
            return `<p><a href="${href}" class="btn${cssClass ? ` ${cssClass}` : ''}">${html}${renderChildren()}</a></p>`;
        },
        editForm: ButtonBlockEditForm,
    };
};
