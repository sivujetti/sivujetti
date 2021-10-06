import {__, env} from '@sivujetti-commons';
import {hookForm, InputGroup, InputGroupInline, Input, InputError} from '../../../commons/Form.jsx';
import QuillEditor from '../../../commons/QuillEditor.jsx';
import {formValidation} from '../constants.js';
import setFocusTo from './auto-focusers.js';

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
        setFocusTo(this.editor);
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
                    name="paragraph-text"
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
        }, env.normalTypingDebounceMillis);
        return newState;
    }
}

export default () => {
    const initialData = {text: __('Paragraph text'), cssClass: ''};
    return {
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
