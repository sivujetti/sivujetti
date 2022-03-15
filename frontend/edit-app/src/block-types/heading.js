import {__, env, hookForm, unhookForm, reHookValues, Input, InputErrors, FormGroup, FormGroupInline, Icon} from '@sivujetti-commons-for-edit-app';
import QuillEditor from '../commons/QuillEditor.jsx';
import {validationConstraints} from '../constants.js';
import {unParagraphify} from './paragraph.js';
import setFocusTo from './auto-focusers.js';

class HeadingBlockEditForm extends preact.Component {
    // editor;
    /**
     * @param {RawBlockData} snapshot
     * @access public
     */
    overrideValues(snapshot) {
        this.editor.current.replaceContents(snapshot.text);
        this.setState({level: snapshot.level.toString()});
        reHookValues(this, [{name: 'cssClass', value: snapshot.cssClass}]);
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const {block, onValueChanged} = this.props;
        this.editor = preact.createRef();
        this.setState(hookForm(this, [
            {name: 'text', value: block.text, validations: [['required'], ['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]],
             label: __('Content'), onAfterValueChanged: (value, hasErrors) => { onValueChanged(value, 'text', hasErrors, env.normalTypingDebounceMillis); }},
            {name: 'cssClass', value: block.cssClass, validations: [['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]], label: __('Css classes'),
             onAfterValueChanged: (value, hasErrors) => { onValueChanged(value, 'cssClass', hasErrors, env.normalTypingDebounceMillis); }},
        ], {
            level: block.level.toString(),
        }));
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
    render({blockTree, block, onValueChanged}, {level}) {
        if (!this.state.values) return;
        return <>
            <FormGroup>
                <QuillEditor
                    name="text"
                    value={ block.text }
                    onChange={ markup => {
                        this.inputApis.text.triggerInput(unParagraphify(markup));
                    } }
                    onBlur={ e => this.inputApis.text.onBlur(e) }
                    toolbarBundle="simplest"
                    ref={ this.editor }/>
                <InputErrors vm={ this } prop="text"/>
            </FormGroup>
            <div class="form-horizontal pt-0">
                <FormGroupInline>
                    <label htmlFor="cssClass" class="form-label">{ __('Link') }</label>
                    <select value={ level } onChange={ e => onValueChanged(parseInt(e.target.value), 'level', false, env.normalTypingDebounceMillis) } class="form-input form-select">{ [1, 2, 3, 4, 5, 6].map(n =>
                        <option value={ n }>{ `<h${n}>` }</option>
                    ) }</select>
                </FormGroupInline>
                <FormGroupInline>
                    <label htmlFor="cssClass" class="form-label">{ __('Css classes') }</label>
                    <Input vm={ this } prop="cssClass"/>
                    <InputErrors vm={ this } prop="cssClass"/>
                </FormGroupInline>
            </div>
            <a onClick={ e => (e.preventDefault(), blockTree.appendBlockToTreeAfter(block)) }
                class="btn btn-link btn-sm text-tiny with-icon-inline color-dimmed"
                href="#add-block-after">
                <Icon iconId="plus" className="size-xs mr-1"/> { __('Add block after') }
            </a>
        </>;
    }
}

export default () => {
    const initialData = {text: __('Heading text'), level: 2, cssClass: ''};
    const name = 'Heading';
    return {
        name,
        friendlyName: 'Heading',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        icon: 'heading',
        reRender({level, text, cssClass}, renderChildren) {
            return `<h${level}${cssClass? ` class="${cssClass}"` : ''} data-block-type="${name}">${text}${renderChildren()}</h${level}>`;
        },
        createSnapshot: from => ({
            text: from.text,
            level: from.level,
            cssClass: from.cssClass,
        }),
        editForm: HeadingBlockEditForm,
    };
};
