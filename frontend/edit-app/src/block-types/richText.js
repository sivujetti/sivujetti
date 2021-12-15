import {__, env} from '../commons/main.js';
import {useField, FormGroup, InputErrors} from '../commons/Form2.jsx';
import QuillEditor from '../commons/QuillEditor.jsx';
import {formValidation} from '../constants.js';
import setFocusTo from './auto-focusers.js';

/**
 * @type {preact.FunctionalComponent<BlockEditFormProps>}
 */
const RichTextBlockEditForm = ({block, funcsIn, funcsOut}) => {
    const html = useField('html', {value: block.html, validations: [['required'], ['maxLength', formValidation.HARD_LONG_TEXT_MAX_LEN]],
        label: __('Content'),
        onAfterValidation: (val, hasErrors) => { funcsIn.onValueChanged(val, 'html', hasErrors, env.normalTypingDebounceMillis); }});
    const editor = preactHooks.useMemo(() => preact.createRef(), []);
    //
    preactHooks.useEffect(() => {
        setFocusTo(editor);
    }, []);
    //
    funcsOut.resetValues = preactHooks.useCallback((newValue) => {
        editor.current.replaceContents(newValue.html);
    }, []);
    //
    return <FormGroup>
        <QuillEditor
            name={ preactHooks.useMemo(() => `rich-text-${block.id}`, []) }
            value={ block.html }
            onChange={ html.triggerInput }
            onBlur={ html.onBlur }
            toolbarBundle="simple"
            ref={ editor }/>
        <InputErrors errors={ html.getErrors() }/>
    </FormGroup>;
};

export default () => {
    const initialData = {html: `<p>${__('Rich text content')}</p>`};
    return {
        name: 'RichText',
        friendlyName: 'Rich text',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        icon: 'blockquote',
        reRender({html}, renderChildren) {
            return `${html}${renderChildren()}`;
        },
        createSnapshot: from => ({
            html: from.html,
        }),
        editForm: RichTextBlockEditForm,
    };
};
