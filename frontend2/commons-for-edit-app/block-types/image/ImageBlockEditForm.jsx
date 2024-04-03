import setFocusTo from '../../auto-focusers.js';
import {validationConstraints} from '../../constants.js';
import {__} from '../../edit-app-singletons.js';
import {
    FormGroup,
    hookForm,
    InputErrors,
    reHookValues,
    Textarea,
    unhookForm,
} from '../../Form.jsx';
import {Icon} from '../../Icon.jsx';
import ImagePicker from '../../ImagePicker.jsx';

class ImageBlockEditForm extends preact.Component {
    // imagePicker;
    /**
     * @access protected
     */
    componentWillMount() {
        this.imagePicker = preact.createRef();
        const {emitValueChangedThrottled, block} = this.props;
        const {src, altText, caption} = block;
        this.setState(hookForm(this, [
            {name: 'altText', value: altText, validations: [['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]],
             label: __('Alt text'), onAfterValueChanged: (value, hasErrors, source) => {
                emitValueChangedThrottled(value, 'altText', hasErrors, source);
            }},
            {name: 'caption', value: caption, validations: [['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]],
             label: __('Caption'), onAfterValueChanged: (value, hasErrors, source) => {
                emitValueChangedThrottled(value, 'caption', hasErrors, source);
            }},
        ], {
            src,
        }));
    }
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        const {block} = props;
        if (block === this.props.block)
            return;
        if (props.lastBlockTreeChangeEventInfo.isUndoOrRedo && (
            this.state.values.altText !== block.altText ||
            this.state.values.caption !== block.caption
        )) {
            reHookValues(this, [
                {name: 'altText', value: block.altText},
                {name: 'caption', value: block.caption},
            ]);
        }
        if (this.state.src !== block.src)
            this.setState({src: block.src});
    }
    /**
     * @access protected
     */
    componentDidMount() {
        setFocusTo(this.imagePicker);
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
    render(_, {src}) {
        return [
            <FormGroup>
                <label htmlFor="src" class="form-label">{ __('Image file') }</label>
                <ImagePicker
                    src={ src }
                    onSrcCommitted={ this.emitNewSrc.bind(this) }
                    inputId="src"
                    ref={ this.imagePicker }/>
            </FormGroup>,
            <FormGroup labelFlow="break">
                <label htmlFor="altText" class="form-label with-icon" title={ __('Alt text') }>
                    { __('Alt text') }
                </label>
                <div class="p-relative">
                    <Textarea vm={ this } prop="altText" id="altText" rows="2" style="min-height:unset"/>
                    <span
                        class="tooltip tooltip-left p-absolute"
                        data-tooltip={ __('The text that a browser displays\nif the image cannot be loaded') }
                        style="right: .3rem; top: .3rem; z-index: 1">
                        <Icon iconId="info-circle" className="color-dimmed3 size-xs"/>
                    </span>
                </div>
                <InputErrors vm={ this } prop="altText"/>
            </FormGroup>,
            <FormGroup>
                <label htmlFor="caption" class="form-label with-icon" title={ __('Caption') }>
                    { __('Caption') }
                </label>
                <Textarea vm={ this } prop="caption" id="caption" rows="2" style="min-height:unset"/>
                <InputErrors vm={ this } prop="caption"/>
            </FormGroup>
        ];
    }
    /**
     * @param {String|null} src
     * @param {String|null} mime
     */
    emitNewSrc(src, mime) {
        const wasTyped = !mime;
        if (!wasTyped)
            this.props.emitValueChanged(src, 'src');
        else
            this.props.emitValueChangedThrottled(src, 'src');
    }
}

export default ImageBlockEditForm;
