import {env} from '@sivujetti-commons-for-web-pages';
import {validationConstraints} from './constants.js';
import {__, events} from './edit-app-singletons.js';
import FileUploader from './FileUploader.jsx';
import {currentInstance as floatingDialog} from './FloatingDialog.jsx';
import {hookForm, reHookValues, Input} from './Form.jsx';
import {Icon} from './Icon.jsx';
import {timingUtils} from './utils.js';
import {mediaUrlValidatorImpl} from './validation.js';

class ImagePicker extends preact.Component {
    // srcInput;
    /**
     * @param {{onSrcCommitted: (newSrc: String|null, mime: String|null, srcWasTyped: Boolean) => void; src: String|null; inputId: String; omitClearButton?: Boolean;}} props
     */
    constructor(props) {
        super(props);
        this.srcInput = preact.createRef();
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const throttledEmitSrc = timingUtils.debounce((src, hasErrors, _source) => {
            if (!hasErrors)
                this.props.onSrcCommitted(src, null, true);
        }, env.normalTypingDebounceMillis);
        this.setState(hookForm(this, [
            {name: 'srcManual', value: this.props.src || '', validations: [
                [mediaUrlValidatorImpl],
                ['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]
            ], label: __('Image file'), onAfterValueChanged: throttledEmitSrc},
        ]));
    }
    /**
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.src !== this.state.values.srcManual)
            reHookValues(this, [{name: 'srcManual', value: props.src || ''}]);
    }
    /**
     * @access protected
     */
    render({src, inputId, omitClearButton}, {values}) {
        if (src !== undefined) {
            const [inputWrapCls, clearSrcBtnCls] = src && !omitClearButton
                ? ['has-icon-right', '']
                : ['',               ' d-none'];
            return <div class="flex-centered">
                <div class={ inputWrapCls } style="flex: 1 0">
                    <Input vm={ this } prop="srcManual" id={ inputId } ref={ this.srcInput } title={ values.srcManual }/>
                    <button
                        onClick={ () => this.props.onSrcCommitted(null, null, false) }
                        class={ `sivujetti-form-icon btn no-color${clearSrcBtnCls}` }
                        type="button">
                        <Icon iconId="x" className="size-xs color-dimmed"/>
                    </button>
                </div>
                <button onClick={ this.openPickerDialog.bind(this) } class="btn btn-sm btn-primary ml-1 pt-1" type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler tabler-folder-open size-xs" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 19l2.757 -7.351a1 1 0 0 1 .936 -.649h12.307a1 1 0 0 1 .986 1.164l-.996 5.211a2 2 0 0 1 -1.964 1.625h-14.026a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2h4l3 3h7a2 2 0 0 1 2 2v2" /></svg>
                </button>
            </div>;
        }
    }
    /**
     * @param {Event} e
     * @access private
     */
    openPickerDialog(e) {
        e.preventDefault();
        floatingDialog.open(PickImageDialog, {
            title: __('Choose a picture'),
            className: 'image-picker-dialog',
        }, {
            selectedImagePath: this.props.src,
            onSelected: file => {
                this.props.onSrcCommitted(...(file
                    ? [file.fileName, file.mime, true]
                    : [null,          null,      false]
                ));
            }
        });
        this.srcInput.current.inputEl.current.blur();
    }
}

class PickImageDialog extends preact.Component {
    /**
     * @param {{selectedImagePath: String; onSelected: (img: UploadsEntry) => void;}} props
     * @access protected
     */
    render({onSelected}) {
        return [
            <FileUploader
                mode="pick"
                onEntryClicked={ imageEntry => {
                    onSelected(imageEntry);
                    floatingDialog.close();
                } }
                onlyImages/>,
            <button
                onClick={ () => floatingDialog.close() }
                class="btn mt-8"
                type="button">{ __('Close') }</button>
        ];
    }
}

export default ImagePicker;
