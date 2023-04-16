import {__, env, hookForm, unhookForm, InputErrors, FormGroup, FormGroupInline,
        validationConstraints} from '@sivujetti-commons-for-edit-app';
import QuillEditor from '../quill/QuillEditor.jsx';
import {unParagraphify} from './paragraph.js';
import setFocusTo from './auto-focusers.js';

class HeadingBlockEditForm extends preact.Component {
    // editor;
    // initialText;
    /**
     * @access protected
     */
    componentWillMount() {
        const {getBlockCopy, emitValueChanged, grabChanges} = this.props;
        const {text, level} = getBlockCopy();
        this.editor = preact.createRef();
        this.initialText = text;
        this.setState(hookForm(this, [
            {name: 'text', value: text, validations: [['required'], ['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]],
             label: __('Content'), onAfterValueChanged: (value, hasErrors, source) => { if (source !== 'undo') emitValueChanged(value, 'text', hasErrors, env.normalTypingDebounceMillis); }},
        ], {
            level: level.toString(),
        }));
        grabChanges((block, _origin, isUndo) => {
            if (isUndo && this.state.values.text !== block.text)
                this.editor.current.replaceContents(block.text, 'undo');
            if (this.state.level !== block.level.toString())
                this.setState({level: block.level.toString()});
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
    render({emitValueChanged}, {level}) {
        return [
            <FormGroup>
                <QuillEditor
                    name="text"
                    value={ this.initialText }
                    onChange={ (markup, source) => {
                        this.inputApis.text.triggerInput(unParagraphify(markup), source);
                    } }
                    onBlur={ e => this.inputApis.text.onBlur(e) }
                    toolbarBundle="simplest"
                    ref={ this.editor }/>
                <InputErrors vm={ this } prop="text"/>
            </FormGroup>,
            <div class="form-horizontal pt-0">
                <FormGroupInline>
                    <label htmlFor="level" class="form-label">{ __('Level') }</label>
                    <select value={ level } onChange={ e => emitValueChanged(parseInt(e.target.value), 'level', false, env.normalTypingDebounceMillis) } class="form-input form-select" name="level" id="level">{ [1, 2, 3, 4, 5, 6].map(n =>
                        <option value={ n }>{ `<h${n}>` }</option>
                    ) }</select>
                </FormGroupInline>
            </div>
        ];
    }
}

export default () => {
    const initialData = {text: __('Heading text'), level: 2};
    const name = 'Heading';
    return {
        name,
        friendlyName: 'Heading',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        icon: 'heading',
        reRender({level, text, styleClasses, id}, renderChildren) {
            return `<h${level} class="j-${name}${styleClasses ? ` ${styleClasses}` : ''}" data-block-type="${name}" data-block="${id}">${text}${renderChildren()}</h${level}>`;
        },
        createSnapshot: from => ({
            text: from.text,
            level: from.level,
        }),
        editForm: HeadingBlockEditForm,
    };
};
