import {__} from '@sivujetti-commons';
import {hookForm, InputGroup, InputGroupInline, Input, InputError} from '../../../commons/Form.jsx';
import QuillEditor from '../../../commons/QuillEditor.jsx';
import {formValidation} from '../constants.js';

const minPossibleLen = '<p></p>'.length;

class ParagraphBlockEditForm extends preact.Component {
    // editor;
    /**
     * @param {BlockEditFormProps} props
     */
    constructor(props) {
        super(props);
        this.state = {};
        this.editor = preact.createRef();
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState(hookForm(this, {
            cssClass: this.props.block.cssClass,
        }, {
            text: {
                value: this.props.block.text,
                validations: [['required'], ['maxLength', formValidation.HARD_LONG_TEXT_MAX_LEN]],
                label: __('Text'),
                props: {myOnChange: this.emitChange.bind(this)}
            },
        }));
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
                    name="text"
                    value={ this.props.block.text }
                    onChange={ html => {
                        this.form.triggerChange(html, 'text');
                    } }
                    onBlur={ () => this.form.triggerBlur('text') }
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
                    toolbarBundle="simplestWithLink"
                    ref={ this.editor }/>
                <InputError error={ errors.text }/>
            </InputGroup>
            <div class="form-horizontal pt-0">
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
            text: unParagraphify(newState.values.text),
            linkTo: newState.values.linkTo,
            cssClass: newState.values.cssClass,
        });
        return newState;
    }
}

const initialData = {text: __('Paragraph text'), cssClass: ''};

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

/**
 * @param {String} quillOutput `<p>foo</p><p>bar</p>`
 * @returns {String} `foo<br>bar` or an empty string
 */
function unParagraphify(quillOutput) {
    if (!quillOutput.startsWith('<'))
        return quillOutput;
    if (quillOutput.length > minPossibleLen) {
        return quillOutput.substr(
            3,                       // <p>
            quillOutput.length - 4-3 // </p>
        ).replace(/<\/p><p>/g, '<br>');
    }
    return '';
}

export {unParagraphify};
