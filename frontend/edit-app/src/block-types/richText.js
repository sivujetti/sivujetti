import {__, env} from '@sivujetti-commons';
import {hookForm, InputGroup, InputError} from '../../../commons/Form.jsx';
import QuillEditor from '../../../commons/QuillEditor.jsx';
import {formValidation} from '../constants.js';
import setFocusTo from './auto-focusers.js';

class RichTextBlockEditForm extends preact.Component {
    // fieldKey;
    // editor;
    /**
     * @param {BlockEditFormProps} props
     */
    constructor(props) {
        super(props);
        this.state = {};
        this.fieldKey = `rt-${props.block.id}`;
        this.editor = preact.createRef();
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState(hookForm(this, null, {
            [this.fieldKey]: {
                value: this.props.block.html,
                validations: [['required'], ['maxLength', formValidation.HARD_LONG_TEXT_MAX_LEN]],
                label: __('Content'),
                props: {myOnChange: this.emitChange.bind(this)}
            },
        }));
    }
    /**
     * @access protected
     */
    componentDidMount() {
        setFocusTo(this.editor);
    }
    /**
     * @access protected
     */
    render(_, {classes, errors}) {
        return <InputGroup classes={ classes.html } className="has-error">
            <QuillEditor
                name={ this.fieldKey }
                value={ this.props.block.html }
                onChange={ html => {
                    this.form.triggerChange(html, this.fieldKey);
                } }
                onBlur={ () => this.form.triggerBlur(this.fieldKey) }
                toolbarBundle="simple"
                ref={ this.editor }/>
            <InputError error={ errors[this.fieldKey] }/>
        </InputGroup>;
    }
    /**
     * @param {Object} newState
     * @access private
     */
    emitChange(newState) {
        const html = newState.values[this.fieldKey];
        this.props.onValueChanged({html}, env.normalTypingDebounceMillis);
        return newState;
    }
}

export default () => {
    const initialData = {html: `<p>${__('Rich text content')}</p>`};
    return {
        name: 'RichText',
        friendlyName: 'Rich text',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        reRender({html}, renderChildren) {
            return `${html}${renderChildren()}`;
        },
        editForm: RichTextBlockEditForm,
    };
};
