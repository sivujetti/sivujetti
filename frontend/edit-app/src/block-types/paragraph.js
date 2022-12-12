import {__, env, hookForm, unhookForm, InputErrors, FormGroup} from '@sivujetti-commons-for-edit-app';
import QuillEditor from '../quill/QuillEditor.jsx';
import {validationConstraints} from '../constants.js';
import setFocusTo from './auto-focusers.js';

const minPossibleLen = '<p></p>'.length;

class ParagraphBlockEditForm extends preact.Component {
    // editor;
    // initialText;
    /**
     * @access protected
     */
    componentWillMount() {
        this.editor = preact.createRef();
        const {getBlockCopy, emitValueChanged, grabChanges} = this.props;
        const {text} = getBlockCopy();
        this.initialText = text;
        this.setState(hookForm(this, [
            {name: 'text', value: text, validations: [['required'], ['maxLength', validationConstraints.MAX_PROSE_HTML_LENGTH]],
             label: __('Text'), onAfterValueChanged: (value, hasErrors, source) => { if (source !== 'undo') emitValueChanged(value, 'text', hasErrors, env.normalTypingDebounceMillis); }},
        ]));
        grabChanges((block, _origin, isUndo) => {
            if (isUndo && this.state.values.text !== block.text)
                this.editor.current.replaceContents(block.text, 'undo');
        });
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
        unhookForm(this);
    }
    /**
     * @access protected
     */
    render() {
        return <FormGroup>
            <QuillEditor
                name="paragraph-text"
                value={ this.initialText }
                onChange={ (markup, source) => {
                    this.inputApis.text.triggerInput(unParagraphify(markup), source);
                } }
                onBlur={ e => this.inputApis.text.onBlur(e) }
                onInit={ _editor => {
                    // https://stackoverflow.com/a/63803445
                    // editor.quill.keyboard.bindings[13].unshift({
                    //     key: 13,
                    //     handler: (_range, _context) => {
                    //         // this.props.blockTree.appendBlockToTreeAfter(block, '');
                    //         return false;
                    //     }
                    // });
                } }
                toolbarBundle="simplestWithLink"
                ref={ this.editor }/>
            <InputErrors vm={ this } prop="text"/>
        </FormGroup>;
    }
}

export default () => {
    const initialData = {text: __('Paragraph text')};
    const name = 'Paragraph';
    return {
        name,
        friendlyName: 'Paragraph',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        icon: 'letter-p',
        reRender({text, styleClasses, id}, renderChildren) {
            return `<p class="j-${name}${styleClasses ? ` ${styleClasses}` : ''}" data-block-type="${name}" data-block="${id}">${text}${renderChildren()}</p>`;
        },
        createSnapshot: from => ({
            text: from.text,
        }),
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
