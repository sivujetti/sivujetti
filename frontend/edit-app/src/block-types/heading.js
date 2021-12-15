import {__, env} from '../commons/main.js';
import {useField, FormGroup, FormGroupInline, InputErrors} from '../commons/Form2.jsx';
import QuillEditor from '../commons/QuillEditor.jsx';
import Icon from '../commons/Icon.jsx';
import {formValidation} from '../constants.js';
import {unParagraphify} from './paragraph.js';
import setFocusTo from './auto-focusers.js';

/**
 * @type {preact.FunctionalComponent<BlockEditFormProps>}
 */
const HeadingBlockEditForm = ({block, funcsIn, funcsOut, blockTree}) => {
    const text = useField('text', {value: block.text, validations: [['required'], ['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]],
        label: __('Content'),
        onAfterValidation: (val, hasErrors) => { funcsIn.onValueChanged(val, 'text', hasErrors, env.normalTypingDebounceMillis); }});
    const editor = preactHooks.useMemo(() => preact.createRef(), []);
    const level = useField('level', {value: block.level, validations: [],
        label: __('Level'),
        onAfterValidation: (val, hasErrors) => { funcsIn.onValueChanged(parseInt(val), 'level', hasErrors, env.normalTypingDebounceMillis); },
        className: 'form-input form-select'});
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
        level.triggerInput(newValue.level.toString());
        cssClass.triggerInput(newValue.cssClass);
    }, []);
    //
    return <>
        <FormGroup>
            <QuillEditor
                name="text"
                value={ block.text }
                onChange={ markup => {
                    text.triggerInput(unParagraphify(markup));
                } }
                onBlur={ text.onBlur }
                toolbarBundle="simplest"
                ref={ editor }/>
            <InputErrors errors={ text.getErrors() }/>
        </FormGroup>
        <div class="form-horizontal pt-0">
            <FormGroupInline>
                <label htmlFor="cssClass" class="form-label">{ __('Link') }</label>
                <select { ...level }>{ [1, 2, 3, 4, 5, 6].map(n =>
                    <option value={ n }>{ `<h${n}>` }</option>
                ) }</select>
                <InputErrors errors={ level.getErrors() }/>
            </FormGroupInline>
            <FormGroupInline>
                <label htmlFor="cssClass" class="form-label">{ __('Css classes') }</label>
                <input { ...cssClass }/>
                <InputErrors errors={ cssClass.getErrors() }/>
            </FormGroupInline>
        </div>
        <a onClick={ e => (e.preventDefault(), blockTree.appendBlockToTreeAfter(block)) }
            class="btn btn-link btn-sm text-tiny with-icon-inline color-dimmed"
            href="#add-block-after">
            <Icon iconId="plus" className="size-xs mr-1"/> { __('Add block after') }
        </a>
    </>;
};

export default () => {
    const initialData = {text: __('Heading text'), level: 2, cssClass: ''};
    return {
        name: 'Heading',
        friendlyName: 'Heading',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        icon: 'heading',
        reRender({level, text, cssClass}, renderChildren) {
            return `<h${level}${cssClass? ` class="${cssClass}"` : ''}>${text}${renderChildren()}</h${level}>`;
        },
        createSnapshot: from => ({
            text: from.text,
            level: from.level,
            cssClass: from.cssClass,
        }),
        editForm: HeadingBlockEditForm,
    };
};
