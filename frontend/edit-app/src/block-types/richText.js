import {__, env, hookForm, unhookForm, InputErrors, FormGroup} from '@sivujetti-commons-for-edit-app';
import QuillEditor from '../Quill/QuillEditor.jsx';
import {validationConstraints} from '../constants.js';
import setFocusTo from './auto-focusers.js';

class RichTextBlockEditForm extends preact.Component {
    // editor;
    /**
     * @param {RawBlockData} snapshot
     * @access public
     */
    overrideValues(snapshot) {
        this.editor.current.replaceContents(snapshot.html);
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const {block, onValueChanged} = this.props;
        this.editor = preact.createRef();
        this.setState(hookForm(this, [
            {name: 'html', value: block.html, validations: [['required'], ['maxLength', validationConstraints.HARD_LONG_TEXT_MAX_LEN]],
             label: __('Content'), onAfterValueChanged: (value, hasErrors) => { onValueChanged(value, 'html', hasErrors, env.normalTypingDebounceMillis); }},
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
    render({block}) {
        if (!this.state.values) return;
        return <FormGroup>
            <QuillEditor
                name={ `rich-text-${block.id}` }
                value={ block.html }
                onChange={ markup => {
                    this.inputApis.html.triggerInput(markup);
                } }
                onBlur={ e => this.inputApis.html.onBlur(e) }
                toolbarBundle="simple"
                ref={ this.editor }/>
            <InputErrors vm={ this } prop="html"/>
        </FormGroup>;
    }
}

class RichTextBlockEditForm2 extends preact.Component {
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
            {name: 'html', value: html, validations: [['required'], ['maxLength', validationConstraints.HARD_LONG_TEXT_MAX_LEN]],
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
     * @param {BlockEditFormProps2} props
     * @access protected
     */
    render() {
        if (!this.state.values) return;
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
        // @featureFlagConditionUseReduxBlockTree
        reRender: !window.useReduxBlockTree
            ? ({html}, renderChildren) => `${html}${renderChildren()}`
            : ({html, id}, renderChildren) => ['<div data-block-type="', name, '" data-block="', id, '">',
                html,
                renderChildren(),
            '</div>'].join('')
        ,
        createSnapshot: from => ({
            html: from.html,
        }),
        // @featureFlagConditionUseReduxBlockTree
        editForm: !window.useReduxBlockTree ? RichTextBlockEditForm : RichTextBlockEditForm2,
    };
};
