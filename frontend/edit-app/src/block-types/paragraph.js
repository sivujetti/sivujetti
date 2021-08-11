import {__} from '@sivujetti-commons';
import {hookForm, InputGroup, Input, InputError} from '../../../commons/Form.jsx';
import QuillEditor from '../../../commons/QuillEditor.jsx';
import {formValidation} from '../constants.js';

const minPossibleLen = '<p></p>'.length;

class ParagraphBlockEditForm extends preact.Component {
    // fieldKey;
    // editor;
    /**
     * @param {{block: Block; onValueChanged: (newBlockData: {[key: String]: any;}) => Promise<null>; autoFocus: Boolean;}} props
     */
    constructor(props) {
        super(props);
        this.state = {};
        this.fieldKey = `p-${props.block.id}`;
        this.editor = preact.createRef();
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState(Object.assign(hookForm(this, {
            cssClass: this.props.block.cssClass,
        }, {
            [this.fieldKey]: {
                value: this.props.block.text,
                validations: [['required'], ['maxLength', formValidation.HARD_LONG_TEXT_MAX_LEN]],
                label: __('Text'),
                props: {myOnChange: this.emitChange.bind(this)}
            },
        })));
    }
    /**
     * @access protected
     */
    componentDidMount() {
        if (this.props.autoFocus) {
            const quill = this.editor.current.quill;
            quill.setSelection(quill.getLength(), 0);
        }
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.form.destroy();
    }
    /**
     * @access protected
     */
    render({blockTree, block}, {classes, errors}) {
        return <>
            <InputGroup classes={ classes.text } className="has-error">
                <QuillEditor
                    name={ this.fieldKey }
                    value={ this.props.block.text }
                    onChange={ html => {
                        this.form.triggerChange(html, this.fieldKey);
                    } }
                    onBlur={ () => this.form.triggerBlur(this.fieldKey) }
                    onInit={ editor => {
                        // https://stackoverflow.com/a/63803445
                        editor.quill.keyboard.bindings[13].unshift({
                            key: 13,
                            handler: (_range, _context) => {
                                // signals.emit('on-paragraph-block-enter-pressed');
                                blockTree.appendBlockToTreeAfter(block);
                                return false;
                            }
                        });
                    } }
                    toolbarBundle="simplest"
                    ref={ this.editor }/>
                <InputError error={ errors[this.fieldKey] }/>
            </InputGroup>
            <InputGroup classes={ classes.cssClass }>
                <Input vm={ this } name="cssClass" id="cssClass" errorLabel={ __('Css class') }
                    validations={ [['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]] } myOnChange={ newState => this.emitChange(newState, 'cssClass') } className="tight" placeholder={ __('Css class') }/>
                <InputError error={ errors.cssClass }/>
            </InputGroup>
        </>;
    }
    /**
     * @param {Object} newState
     * @param {String} prop = null
     * @access private
     */
    emitChange(newState, prop = null) {
        let text;
        if (prop !== 'cssClass') {
            const html = newState.values[this.fieldKey];
            text = html.length > minPossibleLen
                ? html.substr(
                    3,                // <p>
                    html.length - 4-3 // </p>
                ).replace(/<\/p><p>/g, '<br>')
                : '';
        } else {
            text = newState.values[this.fieldKey];
        }
        this.props.onValueChanged({text, cssClass: newState.values.cssClass});
        return newState;
    }
}

const initialData = {text: __('Text here'), cssClass: ''};

export default {
    name: 'Paragraph',
    friendlyName: 'Paragraph',
    ownPropNames: Object.keys(initialData),
    initialData,
    defaultRenderer: 'sivujetti:block-auto',
    reRender({text, cssClass}, renderChildren) {
        return `<p${cssClass? ` class="${cssClass}"` : ''}>${text}${renderChildren()}</p>`;
    },
    editForm: ParagraphBlockEditForm,
};
