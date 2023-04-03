import {__, api, env, hookForm, unhookForm, InputErrors, FormGroup,
        FormGroupInline, floatingDialog, urlUtils} from '@sivujetti-commons-for-edit-app';
import {determineModeFrom, getCompletedUrl} from '../quill/common.js';
import QuillEditor from '../quill/QuillEditor.jsx';
import {validationConstraints} from '../constants.js';
import {unParagraphify} from './paragraph.js';
import setFocusTo from './auto-focusers.js';
import PickUrlDialog, {getHeight} from '../popups/PickUrlDialog.jsx';

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
        ], {
            tagType,
            linkTo,
        }));
        grabChanges((block, _origin, isUndo) => {
            if (isUndo && this.state.values.html !== block.html)
                this.editor.current.replaceContents(block.html, 'undo');
            if (this.state.tagType !== block.tagType)
                this.setState({tagType: block.tagType});
            if (this.state.linkTo !== block.linkTo)
                this.setState({linkTo: block.linkTo});
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
    render(_, {tagType, linkTo}) {
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
                    ? <PickUrlInputGroup
                        linkTo={ linkTo }
                        onUrlPicked={ normalized => this.props.emitValueChanged(normalized, 'linkTo', false, env.normalTypingDebounceMillis) }/>
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

class PickUrlInputGroup extends preact.Component {
    /**
     * @param {{linkTo: String; onUrlPicked: (newNormalizedUrl: String) => void;}} props
     * @access protected
     */
    render({linkTo, onUrlPicked}) {
        return <FormGroupInline>
            <label htmlFor="linkTo" class="form-label">{ __('Link') }</label>
            <input value={ linkTo } name="linkTo" type="text" class="form-input"
                onClick={ e => this.openPickUrlDialog(e, linkTo, onUrlPicked) }/>
        </FormGroupInline>;
    }
    /**
     * @param {Event} e
     * @param {String} linkTo
     * @param {(newNormalizedUrl: String) => void} onPicked
     * @access private
     */
    openPickUrlDialog(e, linkTo, onPicked) {
        e.preventDefault();
        const normalized = getCompletedUrl(linkTo);
        const mode = determineModeFrom(normalized)[0];
        floatingDialog.open(PickUrlDialog, {
            width: 480,
            height: getHeight(mode, true)[0],
            title: __('Choose a link')
        }, {
            mode,
            url: normalized,
            dialog: floatingDialog,
            onConfirm: (url, mode) => {
                if (mode === 'pick-url') // '/sivujetti/index.php?q=/contact', '/contact'
                    onPicked(url.substring(urlUtils.baseUrl.length - 1));
                else if (mode === 'pick-file') // '/sivujetti/public/uploads/header1.jpg'
                    onPicked(url.substring(urlUtils.assetBaseUrl.length - 1));
                else // 'http://test.com'
                    onPicked(url);
            }
        });
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
            const [start, close] = {
                [tagTypes.NORMAL_BUTTON]: ['<button type="button"', '</button>'],
                [tagTypes.SUBMIT_BUTTON]: ['<button type="submit"', '</button>'],
            }[tagType] || [`<a href="${getCompletedUrl(linkTo)}"`, "</a>"];
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

export {PickUrlInputGroup};
