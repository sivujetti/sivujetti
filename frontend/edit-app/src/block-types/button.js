import {urlUtils, __, env} from '../commons/main.js';
import {useField, FormGroup, FormGroupInline, InputErrors} from '../commons/Form2.jsx';
import QuillEditor from '../commons/QuillEditor.jsx';
import {formValidation} from '../constants.js';
import {unParagraphify} from './paragraph.js';
import setFocusTo from './auto-focusers.js';

/**
 * @type {preact.FunctionalComponent<BlockEditFormProps2>}
 */
const ButtonBlockEditForm = ({block, funcsIn, funcsOut}) => {
    const html = useField('html', {value: block.html, validations: [['required'], ['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]],
        label: __('Content'),
        onAfterValidation: (val, hasErrors) => { funcsIn.onValueChanged(val, 'html', hasErrors, env.normalTypingDebounceMillis); }});
    const editor = preact.createRef();
    const linkTo = useField('linkTo', {value: block.linkTo, validations: [['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]],
        label: __('Css classes'),
        onAfterValidation: (val, hasErrors) => { funcsIn.onValueChanged(val, 'linkTo', hasErrors, env.normalTypingDebounceMillis); }});
    const cssClass = useField('cssClass', {value: block.cssClass, validations: [['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]],
        label: __('Css classes'),
        onAfterValidation: (val, hasErrors) => { funcsIn.onValueChanged(val, 'cssClass', hasErrors, env.normalTypingDebounceMillis); }});
    //
    preactHooks.useEffect(() => {
        setFocusTo(editor);
    }, []);
    //
    funcsOut.resetValues = preactHooks.useCallback((newData) => {
        editor.current.replaceContents(newData.html);
        linkTo.triggerInput(newData.linkTo);
        cssClass.triggerInput(newData.cssClass);
    });
    //
    return <>
        <FormGroup>
            <QuillEditor
                name="html"
                value={ block.html }
                onChange={ markup => {
                    html.triggerInput(unParagraphify(markup));
                } }
                onBlur={ html.onBlur }
                toolbarBundle="simplest"
                ref={ editor }/>
            <InputErrors errors={ html.getErrors() }/>
        </FormGroup>
        <div class="form-horizontal pt-0">
            <FormGroupInline>
                <label htmlFor="cssClass" class="form-label">{ __('Link') }</label>
                <input { ...linkTo }/>
                <InputErrors errors={ linkTo.getErrors() }/>
            </FormGroupInline>
            <FormGroupInline>
                <label htmlFor="cssClass" class="form-label">{ __('Css classes') }</label>
                <input { ...cssClass }/>
                <InputErrors errors={ cssClass.getErrors() }/>
            </FormGroupInline>
        </div>
    </>;
};

export default () => {
    const initialData = {html: `${__('Button text')}`, linkTo: '/', cssClass: ''};
    return {
        name: 'Button',
        friendlyName: 'Button',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        icon: 'hand-finger',
        reRender({html, linkTo, cssClass}, renderChildren) {
            const href = linkTo.indexOf('.') < 0
                ? urlUtils.makeUrl(linkTo)
                : `${linkTo.startsWith('//') || linkTo.startsWith('http') ? '' : '//'}${linkTo}`;
            return ['<p class="button">',
                '<a href="', href, '" class="btn', (cssClass ? ` ${cssClass}` : ''), '" data-block-root>',
                    html,
                    renderChildren(),
                '</a>',
            '</p>'].join('');
        },
        createSnapshot: from => ({
            html: from.html,
            linkTo: from.linkTo,
            cssClass: from.cssClass,
        }),
        editForm: ButtonBlockEditForm,
    };
};
