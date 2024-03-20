import {__, api} from '../../edit-app-singletons.js';
import {
    FormGroup,
    FormGroupInline,
    hookForm,
    InputErrors,
    unhookForm,
} from '../../Form.jsx';
import QuillEditor from '../../QuillEditor.jsx';
import setFocusTo from '../../auto-focusers.js';
import {validationConstraints} from '../../constants.js';
import {isUndoOrRedo} from '../../utils.js';
import PickUrlInputGroup from '../../includes-internal/PickUrlInputGroup.jsx';

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
            {name: tagTypes.LINK, friendlyName: `${__('Link element')} (<a>)`},
            {name: tagTypes.NORMAL_BUTTON, friendlyName: `${__('Normal button')} (<button>)`},
            {name: tagTypes.SUBMIT_BUTTON, friendlyName: `${__('Submit button')} (<button type="submit">)`},
        ];
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const {block, emitValueChangedThrottled} = this.props;
        const {html, linkTo, tagType} = block;
        this.initialHtml = html;
        this.setState(hookForm(this, [
            {name: 'html', value: html, validations: [['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]],
             label: __('Content'), onAfterValueChanged: (value, hasErrors, source) => {
                emitValueChangedThrottled(value, 'html', hasErrors, source);
            }},
        ], {
            tagType,
            linkTo,
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
    componentWillReceiveProps(props) {
        const {block} = props;
        if (block !== this.props.block) {
            if (isUndoOrRedo(props.lastBlockTreeChangeEventInfo.ctx) &&
                this.props.block.html !== block.html) {
                this.editor.current.replaceContents(
                    block.html,
                    props.lastBlockTreeChangeEventInfo.ctx
                );
            }
            if (this.state.tagType !== block.tagType)
                this.setState({tagType: block.tagType});
            if (this.state.linkTo !== block.linkTo)
                this.setState({linkTo: block.linkTo});
        }
    }
    /**
     * @access protected
     */
    render(_, {tagType, linkTo}) {
        return [
            <FormGroup>
                <QuillEditor
                    name="html"
                    value={ this.initialHtml }
                    onChange={ (markup, source) => {
                        this.inputApis.html.triggerInput(noEmptyBr(unParagraphify(markup)), source);
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
                        <select value={ tagType } onChange={ e => this.props.emitValueChanged(e.target.value, 'tagType') } class="form-input form-select" id="tagType">{
                            this.tagTypeOptions.map(({name, friendlyName}) =>
                                <option value={ name }>{ friendlyName }</option>
                            )
                        }</select>
                    </FormGroupInline>
                    : null
                }
                { tagType === tagTypes.LINK
                    ? <PickUrlInputGroup
                        linkTo={ linkTo }
                        onUrlPicked={ normalized => this.props.emitValueChanged(normalized, 'linkTo') }/>
                    : null
                }
            </div>
        ];
    }
}

/**
 * @param {String} str
 * @returns {String}
 */
function noEmptyBr(str) {
    return str !== '<br>' ? str : '';
}

const minPossibleLen = '<p></p>'.length;

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

export default ButtonBlockEditForm;
