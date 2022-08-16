import {__, api, env, urlUtils, hookForm, unhookForm, reHookValues, Input,
        InputErrors, FormGroup, FormGroupInline} from '@sivujetti-commons-for-edit-app';
import QuillEditor from '../Quill/QuillEditor.jsx';
import {validationConstraints} from '../constants.js';
import {unParagraphify} from './paragraph.js';
import setFocusTo from './auto-focusers.js';
import {urlValidatorImpl} from '../validation.js';

const tagTypes = Object.freeze({
    LINK: 'link',
    NORMAL_BUTTON: 'button',
    SUBMIT_BUTTON: 'submit',
});

class ButtonBlockEditForm extends preact.Component {
    // editor;
    // userCanChangeTagType;
    // tagTypeOptions;
    // initialHtml;
    /**
     * @param {BlockEditFormProps} props
     */
    constructor(props) {
        super(props);
        this.editor = preact.createRef();
        this.userCanChangeTagType = api.user.getRole() <= 1 << 2; // ROLE_ADMIN_EDITOR
        this.tagTypeOptions = [
            {name: tagTypes.LINK, friendlyName: __('Link element')},
            {name: tagTypes.NORMAL_BUTTON, friendlyName: __('Normal button')},
            {name: tagTypes.SUBMIT_BUTTON, friendlyName: __('Submit button')},
        ];
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const {getBlockCopy, emitValueChanged, grabChanges} = this.props;
        const {html, linkTo, tagType} = getBlockCopy();
        this.initialHtml = html;
        this.setState(hookForm(this, [
            {name: 'html', value: html, validations: [['required'], ['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]],
             label: __('Content'), onAfterValueChanged: (value, hasErrors, source) => { if (source !== 'undo') emitValueChanged(value, 'html', hasErrors, env.normalTypingDebounceMillis); }},
            {name: 'linkTo', value: linkTo, validations: [[urlValidatorImpl, {allowExternal: true, allowEmpty: true}],
                ['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]], label: __('Link'),
             onAfterValueChanged: (value, hasErrors) => { emitValueChanged(value, 'linkTo', hasErrors, env.normalTypingDebounceMillis); }},
        ], {
            tagType,
        }));
        grabChanges((block, _origin, isUndo) => {
            if (isUndo && this.state.values.html !== block.html)
                this.editor.current.replaceContents(block.html, 'undo');
            if (isUndo && this.state.values.linkTo !== block.linkTo)
                reHookValues(this, [{name: 'linkTo', value: block.linkTo}]);
            if (this.state.tagType !== block.tagType)
                this.setState({tagType: block.tagType});
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
     * @access protected
     */
    render(_, {tagType}) {
        return [
            <FormGroup>
                <QuillEditor
                    name="html"
                    value={ this.initialHtml }
                    onChange={ (markup, source) => {
                        this.inputApis.html.triggerInput(unParagraphify(markup), source);
                    } }
                    onBlur={ e => this.inputApis.html.onBlur(e) }
                    toolbarBundle="simplest"
                    ref={ this.editor }/>
                <InputErrors vm={ this } prop="html"/>
            </FormGroup>,
            <div class="form-horizontal pt-0">
                { this.userCanChangeTagType
                    ? <FormGroupInline>
                        <label htmlFor="tagType" class="form-label">{ __('Tag type') }</label>
                        <select value={ tagType } onChange={ this.handleTagTypeChanged.bind(this) } class="form-input form-select">{
                            this.tagTypeOptions.map(({name, friendlyName}) =>
                                <option value={ name }>{ friendlyName }</option>
                            )
                        }</select>
                    </FormGroupInline>
                    : null
                }
                { tagType === tagTypes.LINK
                    ? <FormGroupInline>
                        <label htmlFor="linkTo" class="form-label">{ __('Link') }</label>
                        <Input vm={ this } prop="linkTo"/>
                        <InputErrors vm={ this } prop="linkTo"/>
                    </FormGroupInline>
                    : null
                }
            </div>
        ];
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleTagTypeChanged(e) {
        const newVal = e.target.value;
        this.props.emitValueChanged(newVal, 'tagType', false, env.normalTypingDebounceMillis);
    }
}

export default () => {
    const initialData = {html: `${__('Button text')}`, linkTo: '/', tagType: 'link'};
    const name = 'Button';
    return {
        name,
        friendlyName: 'Button',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        icon: 'hand-finger',
        reRender({html, linkTo, tagType, styleClasses, id}, renderChildren) {
            const maybeExternalUrl = url => url.indexOf('.') < 0
                ? urlUtils.makeUrl(url)
                : `${url.startsWith('//') || url.startsWith('http') ? '' : '//'}${url}`;
            const [start, close] = {
                [tagTypes.NORMAL_BUTTON]: ['<button type="button"', '</button>'],
                [tagTypes.SUBMIT_BUTTON]: ['<button type="submit"', '</button>'],
            }[tagType] || [`<a href="${maybeExternalUrl(linkTo)}"`, "</a>"];
            return [start, ' class="j-', name, ' btn', (styleClasses ? ` ${styleClasses}` : ''),
                '" data-block-type="', name,
                '" data-block="', id, '">',
                html,
                renderChildren(),
            close].join('');
        },
        createSnapshot: from => ({
            html: from.html,
            linkTo: from.linkTo,
            tagType: from.tagType,
        }),
        editForm: ButtonBlockEditForm,
    };
};
