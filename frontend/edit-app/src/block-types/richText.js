import {__, env, hookForm, unhookForm, InputErrors, FormGroup,
        validationConstraints} from '@sivujetti-commons-for-edit-app';
import QuillEditor from '../quill/QuillEditor.jsx';
import setFocusTo from './auto-focusers.js';

class RichTextBlockEditForm extends preact.Component {
    // editor;
    // editorId;
    // initialHtml;
    /**
     * @access protected
     */
    componentWillMount() {
        const {getBlockCopy, emitValueChanged, grabChanges} = this.props;
        this.editor = preact.createRef();
        const {html, id} = getBlockCopy();
        this.editorId = `rich-text-${id}`;
        this.initialHtml = html;
        this.setState(hookForm(this, [
            {name: 'html', value: html, validations: [['required'], ['maxLength', validationConstraints.MAX_PROSE_HTML_LENGTH]],
             label: __('Content'), onAfterValueChanged: (value, hasErrors, source) => { if (source !== 'undo') emitValueChanged(value, 'html', hasErrors, env.normalTypingDebounceMillis); }},
        ]));
        grabChanges((block, _origin, isUndo) => {
            if (isUndo && this.state.values.html !== block.html)
                this.editor.current.replaceContents(block.html, 'undo');
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
     * @param {BlockEditFormProps} props
     * @access protected
     */
    render() {
        return <FormGroup>
            <QuillEditor
                name={ this.editorId }
                value={ this.initialHtml }
                onChange={ (markup, source) => {
                    this.inputApis.html.triggerInput(markup, source);
                } }
                onBlur={ e => this.inputApis.html.onBlur(e) }
                toolbarBundle="simple"
                ref={ this.editor }/>
            <InputErrors vm={ this } prop="html"/>
        </FormGroup>;
    }
}

export default () => {
    const initialData = {html: `<p>${__('Rich text content')}</p>`};
    const name = 'RichText';
    return {
        name,
        friendlyName: 'Rich text',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        icon: 'blockquote',
        reRender: ({html, id, styleClasses}, renderChildren) =>
            ['<div class="j-', name, styleClasses ? ` ${styleClasses}` : '',
                '" data-block-type="', name, '" data-block="', id, '">',
                html,
                renderChildren(),
            '</div>'].join('')
        ,
        createSnapshot: from => ({
            html: from.html,
        }),
        editForm: RichTextBlockEditForm,
    };
};
