import {__, env} from '../commons/main.js';
import {useField, FormGroup, FormGroupInline, InputErrors} from '../commons/Form2.jsx';
import QuillEditor from '../commons/QuillEditor.jsx';
import {formValidation} from '../constants.js';
import setFocusTo from './auto-focusers.js';

const minPossibleLen = '<p></p>'.length;

/**
 * @type {preact.FunctionalComponent<BlockEditFormProps>}
 */
const ParagraphBlockEditForm = ({block, funcsIn, funcsOut, blockTree}) => {
    const text = useField('text', {value: block.text, validations: [['required'], ['maxLength', formValidation.HARD_LONG_TEXT_MAX_LEN]],
        label: __('Text'),
        onAfterValidation: (val, hasErrors) => { funcsIn.onValueChanged(val, 'text', hasErrors, env.normalTypingDebounceMillis); }});
    const editor = preactHooks.useMemo(() => preact.createRef(), []);
    const cssClass = useField('cssClass', {value: block.cssClass, validations: [['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]],
        label: __('Css classes'),
        onAfterValidation: (val, hasErrors) => { funcsIn.onValueChanged(val, 'cssClass', hasErrors, env.normalTypingDebounceMillis); }});
    //
    preactHooks.useEffect(() => {
        setFocusTo(editor);
    }, []);
    //
    funcsOut.resetValues = preactHooks.useCallback((newValue) => {
        editor.current.replaceContents(newValue.text);
        cssClass.triggerInput(newValue.cssClass);
    }, []);
    //
    return <>
        <FormGroup>
            <QuillEditor
                name="paragraph-text"
                value={ block.text }
                onChange={ markup => {
                    text.triggerInput(unParagraphify(markup));
                } }
                onBlur={ text.onBlur }
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
                ref={ editor }/>
            <InputErrors errors={ text.getErrors() }/>
        </FormGroup>
        <div class="form-horizontal pt-0">
            <FormGroupInline>
                <label htmlFor="cssClass" class="form-label">{ __('Css classes') }</label>
                <input { ...cssClass }/>
                <InputErrors errors={ cssClass.getErrors() }/>
            </FormGroupInline>
        </div>
    </>;
};

export default () => {
    const initialData = {text: __('Paragraph text'), cssClass: ''};
    return {
        name: 'Paragraph',
        friendlyName: 'Paragraph',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        icon: 'letter-p',
        reRender({text, cssClass}, renderChildren) {
            return `<p${cssClass? ` class="${cssClass}"` : ''}>${text}${renderChildren()}</p>`;
        },
        createSnapshot: from => ({
            text: from.text,
            cssClass: from.cssClass,
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
