import {__, env, hookForm, unhookForm, reHookValues, Input, InputErrors, FormGroup, FormGroupInline} from '@sivujetti-commons-for-edit-app';
import QuillEditor from '../commons/QuillEditor.jsx';
import {validationConstraints} from '../constants.js';
import setFocusTo from './auto-focusers.js';

const minPossibleLen = '<p></p>'.length;

class ParagraphBlockEditForm extends preact.Component {
    // editor;
    /**
     * @param {RawBlockData} snapshot
     * @access public
     */
    overrideValues(snapshot) {
        this.editor.current.replaceContents(snapshot.text);
        reHookValues(this, [{name: 'cssClass', value: snapshot.cssClass}]);
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const {block, onValueChanged} = this.props;
        this.editor = preact.createRef();
        this.setState(hookForm(this, [
            {name: 'text', value: block.text, validations: [['required'], ['maxLength', validationConstraints.HARD_LONG_TEXT_MAX_LEN]],
             label: __('Text'), onAfterValueChanged: (value, hasErrors) => { onValueChanged(value, 'text', hasErrors, env.normalTypingDebounceMillis); }},
            {name: 'cssClass', value: block.cssClass, validations: [['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]], label: __('Css classes'),
             onAfterValueChanged: (value, hasErrors) => { onValueChanged(value, 'cssClass', hasErrors, env.normalTypingDebounceMillis); }},
        ]));
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
     * @param {BlockEditFormProps} props
     * @access protected
     */
    render({blockTree, block}) {
        if (!this.state.values) return;
        return <>
            <FormGroup>
                <QuillEditor
                    name="paragraph-text"
                    value={ block.text }
                    onChange={ markup => {
                        this.inputApis.text.triggerInput(unParagraphify(markup));
                    } }
                    onBlur={ e => this.inputApis.text.onBlur(e) }
                    onInit={ editor => {
                        // https://stackoverflow.com/a/63803445
                        editor.quill.keyboard.bindings[13].unshift({
                            key: 13,
                            handler: (_range, _context) => {
                                blockTree.appendBlockToTreeAfter(block, '');
                                return false;
                            }
                        });
                    } }
                    toolbarBundle="simplestWithLink"
                    ref={ this.editor }/>
                <InputErrors vm={ this } prop="text"/>
            </FormGroup>
            <div class="form-horizontal pt-0">
                <FormGroupInline>
                    <label htmlFor="cssClass" class="form-label">{ __('Css classes') }</label>
                    <Input vm={ this } prop="cssClass"/>
                    <InputErrors vm={ this } prop="cssClass"/>
                </FormGroupInline>
            </div>
        </>;
    }
}

export default () => {
    const initialData = {text: __('Paragraph text'), cssClass: ''};
    const name = 'Paragraph';
    return {
        name,
        friendlyName: 'Paragraph',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        icon: 'letter-p',
        reRender({text, cssClass, id}, renderChildren) {
            return `<p${cssClass? ` class="${cssClass}"` : ''} data-block-type="${name}" data-block="${id}">${text}${renderChildren()}</p>`;
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
