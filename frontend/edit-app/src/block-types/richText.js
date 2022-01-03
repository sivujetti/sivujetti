import {__, env} from '../commons/main.js';
import hookForm, {unhookForm, reHookValues, Input, InputErrors, FormGroup, FormGroupInline} from '../commons/Form3.jsx';
import QuillEditor from '../commons/QuillEditor.jsx';
import {formValidation} from '../constants.js';
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
            {name: 'html', value: block.html, validations: [['required'], ['maxLength', formValidation.HARD_LONG_TEXT_MAX_LEN]],
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
