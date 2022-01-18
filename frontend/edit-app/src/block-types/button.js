import {urlUtils, __, env, hookForm, unhookForm, reHookValues, Input, InputErrors, FormGroup, FormGroupInline} from '@sivujetti-commons-for-edit-app';
import QuillEditor from '../commons/QuillEditor.jsx';
import {validationConstraints} from '../constants.js';
import {unParagraphify} from './paragraph.js';
import setFocusTo from './auto-focusers.js';

const tagTypes = Object.freeze({
    LINK: 'link',
    NORMAL_BUTTON: 'button',
    SUBMIT_BUTTON: 'submit',
});

class ButtonBlockEditForm extends preact.Component {
    // editor;
    // tagTypeOptions;
    /**
     * @param {BlockEditFormProps} props
     */
    constructor(props) {
        super(props);
        this.tagTypeOptions = [
            {name: tagTypes.LINK, friendlyName: __('Link element')},
            {name: tagTypes.NORMAL_BUTTON, friendlyName: __('Normal button')},
            {name: tagTypes.SUBMIT_BUTTON, friendlyName: __('Submit button')},
        ];
    }
    /**
     * @param {RawBlockData} snapshot
     * @access public
     */
    overrideValues(snapshot) {
        this.editor.current.replaceContents(snapshot.html);
        reHookValues(this, [{name: 'linkTo', value: snapshot.linkTo},
                            {name: 'cssClass', value: snapshot.cssClass}]);
        this.setState({tagType: snapshot.tagType});
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const {block, onValueChanged} = this.props;
        this.editor = preact.createRef();
        this.setState(hookForm(this, [
            {name: 'html', value: block.html, validations: [['required'], ['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]],
             label: __('Content'), onAfterValueChanged: (value, hasErrors) => { onValueChanged(value, 'html', hasErrors, env.normalTypingDebounceMillis); }},
            {name: 'linkTo', value: block.linkTo, validations: [['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]], label: __('Link'),
             onAfterValueChanged: (value, hasErrors) => { onValueChanged(value, 'linkTo', hasErrors, env.normalTypingDebounceMillis); }},
            {name: 'cssClass', value: block.cssClass, validations: [['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]], label: __('Css classes'),
             onAfterValueChanged: (value, hasErrors) => { onValueChanged(value, 'cssClass', hasErrors, env.normalTypingDebounceMillis); }},
        ], {
            tagType: block.tagType,
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
     * @access protected
     */
    render({block}, {tagType}) {
        if (!this.state.values) return;
        return <>
            <FormGroup>
                <QuillEditor
                    name="html"
                    value={ block.html }
                    onChange={ markup => {
                        this.inputApis.html.triggerInput(unParagraphify(markup));
                    } }
                    onBlur={ e => this.inputApis.html.onBlur(e) }
                    toolbarBundle="simplest"
                    ref={ this.editor }/>
                <InputErrors vm={ this } prop="html"/>
            </FormGroup>
            <div class="form-horizontal pt-0">
                <FormGroupInline>
                    <label htmlFor="tagType" class="form-label">{ __('Tag type') }</label>
                    <select value={ tagType } onChange={ this.handleTagTypeChanged.bind(this) } class="form-input form-select">{
                        this.tagTypeOptions.map(({name, friendlyName}) =>
                            <option value={ name }>{ friendlyName }</option>
                        )
                    }</select>
                </FormGroupInline>
                { tagType === tagTypes.LINK
                    ? <FormGroupInline>
                        <label htmlFor="linkTo" class="form-label">{ __('Link') }</label>
                        <Input vm={ this } prop="linkTo"/>
                        <InputErrors vm={ this } prop="linkTo"/>
                    </FormGroupInline>
                    : null
                }
                <FormGroupInline>
                    <label htmlFor="cssClass" class="form-label">{ __('Css classes') }</label>
                    <Input vm={ this } prop="cssClass"/>
                    <InputErrors vm={ this } prop="cssClass"/>
                </FormGroupInline>
            </div>
        </>;
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleTagTypeChanged(e) {
        const newVal = e.target.value;
        this.setState({tagType: newVal});
        this.props.onValueChanged(newVal, 'tagType', false, env.normalTypingDebounceMillis);
    }
}

export default () => {
    const initialData = {html: `${__('Button text')}`, linkTo: '/', tagType: 'link', cssClass: ''};
    return {
        name: 'Button',
        friendlyName: 'Button',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        icon: 'hand-finger',
        reRender({html, linkTo, tagType, cssClass}, renderChildren) {
           const maybeExternalUrl = url => url.indexOf('.') < 0
                ? urlUtils.makeUrl(url)
                : `${url.startsWith('//') || url.startsWith('http') ? '' : '//'}${url}`;
            let [startInnerTag, closeInnerTag] = {
                [tagTypes.NORMAL_BUTTON]: ['<button type="button"', '</button>'],
                [tagTypes.SUBMIT_BUTTON]: ['<button type="submit"', '</button>'],
            }[tagType] || [`<a href="${maybeExternalUrl(linkTo)}"`, '</a>'];
            return ['<p class="button">', startInnerTag, ' class="btn',
                (cssClass ? ` ${cssClass}` : ''), '" data-block-root>',
                    html,
                    renderChildren(),
                closeInnerTag,
            '</p>'].join('');
        },
        createSnapshot: from => ({
            html: from.html,
            linkTo: from.linkTo,
            tagType: from.tagType,
            cssClass: from.cssClass,
        }),
        editForm: ButtonBlockEditForm,
    };
};
