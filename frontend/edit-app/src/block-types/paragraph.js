import {__} from '@kuura-commons';
import {hookForm, InputGroup, InputError} from '../../../commons/Form.jsx';
import QuillEditor from '../../../commons/QuillEditor.jsx';

const HARD_LONG_TEXT_MAX_LEN = 128000;
const minPossibleLen = '<p></p>'.length;

class ParagraphBlockEditForm extends preact.Component {
    // fieldKey;
    /**
     * @param {{block: Block;}} props
     */
    constructor(props) {
        super(props);
        this.state = {cssClass: ''};
        this.fieldKey = `p-${props.block.id}`;
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState(Object.assign({cssClass: this.props.block.cssClass}, hookForm(this, null, {
            [this.fieldKey]: {
                value: this.props.block.text,
                validations: [['required'], ['maxLength', HARD_LONG_TEXT_MAX_LEN]],
                label: __('Text'),
                props: {myOnChange: this.emitChange.bind(this)}
            },
        })));
    }
    /**
     * @access protected
     */
    render(_, {classes, errors}) {
        return <InputGroup classes={ classes.text } className="has-error">
            <QuillEditor
                name={ this.fieldKey }
                value={ this.props.block.text }
                onChange={ html => {
                    this.form.triggerChange(html, this.fieldKey);
                } }
                onBlur={ () => this.form.triggerBlur(this.fieldKey) }
                toolbarBundle="simplest"/>
            <InputError error={ errors[this.fieldKey] }/>
        </InputGroup>;
    }
    /**
     * @param {Object} newState
     * @access private
     */
    emitChange(newState) {
        const html = newState.values[this.fieldKey];
        this.props.onValueChanged({text: html.length > minPossibleLen
            ? html.substr(
                3,                // <p>
                html.length - 4-3 // </p>
            ).replace(/<\/p><p>/g, '<br>')
            : '', cssClass: this.state.cssClass});
        return newState;
    }
}

const initialData = {text: __('Text here'), cssClass: ''};

export default {
    name: 'Paragraph',
    friendlyName: 'Paragraph',
    ownPropNames: Object.keys(initialData),
    initialData,
    defaultRenderer: 'kuura:block-auto',
    reRender({text, cssClass}, renderChildren) {
        return `<p${cssClass? ` class="${cssClass}"` : ''}>${text}${renderChildren()}</p>`;
    },
    editForm: ParagraphBlockEditForm,
};
