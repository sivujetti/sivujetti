import {__} from '@sivujetti-commons';
import {unParagraphify} from './paragraph.js';
import {hookForm, InputGroup, InputGroupInline, InputError, Input, Select} from '../../../commons/Form.jsx';
import QuillEditor from '../../../commons/QuillEditor.jsx';
import Icon from '../../../commons/Icon.jsx';
import {formValidation} from '../constants.js';

class HeadingBlockEditForm extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState(hookForm(this, {
            level: this.props.block.level,
            cssClass: this.props.block.cssClass,
        }, {
            text: {
                value: this.props.block.text,
                validations: [['required'], ['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]],
                label: __('Text'),
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
     * @param {BlockEditFormProps} props
     * @access protected
     */
    render({block, blockTree}, {classes, errors}) {
        return <>
            <InputGroup classes={ classes.html } className="has-error">
                <QuillEditor
                    name="text"
                    value={ this.props.block.text }
                    onChange={ html => {
                        this.form.triggerChange(html, 'text');
                    } }
                    onBlur={ () => this.form.triggerBlur('text') }
                    toolbarBundle="simplest"
                    ref={ this.editor }/>
                <InputError error={ errors.text }/>
            </InputGroup>
            <div class="form-horizontal pt-0">
            <InputGroupInline>
                <label class="form-label" title={ __('Level') }>{ __('Level') }</label>
                <Select vm={ this } name="level" id="level" myOnChange={ this.emitChange.bind(this) }>{
                    [1, 2, 3, 4, 5, 6].map(n =>
                        <option value={ n }>{ `<h${n}>` }</option>
                    ) }</Select>
            </InputGroupInline>
            <InputGroupInline classes={ classes.cssClass }>
                <label class="form-label" htmlFor="cssClass" title={ __('Css classes') }>{ __('Css classes') }</label>
                <Input vm={ this } name="cssClass" id="cssClass" errorLabel={ __('Css classes') } validations={ [['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]] } myOnChange={ this.emitChange.bind(this) }/>
                <InputError error={ errors.cssClass }/>
            </InputGroupInline>
            </div>
            <a onClick={ e => (e.preventDefault(), blockTree.appendBlockToTreeAfter(block)) }
                class="btn btn-link btn-sm text-tiny with-icon-inline color-dimmed">
                <Icon iconId="plus" className="size-xs"/> { __('Add block after') }
            </a>
        </>;
    }
    /**
     * @param {Object} newState
     * @access private
     */
    emitChange(newState) {
        this.props.onValueChanged({
            text: unParagraphify(newState.values.text),
            level: newState.values.level,
            cssClass: newState.values.cssClass,
        });
        return newState;
    }
}

const initialData = {text: __('Heading text'), level: 2, cssClass: ''};

export default {
    name: 'Heading',
    friendlyName: 'Heading',
    ownPropNames: Object.keys(initialData),
    initialData,
    defaultRenderer: 'sivujetti:block-auto',
    reRender({level, text, cssClass}, renderChildren) {
        return `<h${level}${cssClass? ` class="${cssClass}"` : ''}>${text}${renderChildren()}</h${level}>`;
    },
    editForm: HeadingBlockEditForm,
};
