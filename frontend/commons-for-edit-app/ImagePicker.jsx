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
    // dialogIsOpen;
    // unregistrables;
    /**
     * @param {{onSrcCommitted: (newSrc: string|null, mime: string|null, srcWasTyped: boolean) => void; src: string|null; inputId: string; omitClearButton?: boolean; showClearItem?: boolean;}} props
     */
    constructor(props) {
        super(props);
        this.srcInput = preact.createRef();
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.dialogIsOpen = false;
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
        const closeDialogIfOpen = () => {
            if (this.dialogIsOpen) this.closePickerDialog();
        };
        this.unregistrables = [
            events.on('inspector-panel-closed', closeDialogIfOpen),
            events.on('inspector-panel-opened', closeDialogIfOpen), // Re-opened with different block
        ];
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
    componentWillUnmount() {
        this.unregistrables.forEach(unreg => unreg());
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
        this.dialogIsOpen = true;
        floatingDialog.open(PickImageDialog, {
            title: __('Choose a picture'),
            className: 'image-picker-dialog',
        }, {
            showClearItem: !!this.props.showClearItem,
            selectedImagePath: this.props.src,
            onSelected: file => {
                this.props.onSrcCommitted(...(file
                    ? [file.fileName, file.mime, false]
                    : [null,          null,      false]
                ));
                this.closePickerDialog();
            }
        });
        this.srcInput.current.inputEl.current.blur();
    }
    /**
     * @access private
     */
    closePickerDialog() {
        this.dialogIsOpen = false;
        floatingDialog.close();
    }
}

class PickImageDialog extends preact.Component {
    /**
     * @param {{selectedImagePath: string; onSelected: (img: UploadsEntry|null) => void; showClearItem: boolean;}} props
     * @access protected
     */
    render({onSelected, showClearItem}) {
        return [
            <FileUploader
                mode="pick"
                showClearItem={ showClearItem }
                onEntryClicked={ onSelected }
                onlyImages/>,
            <button
                onClick={ () => floatingDialog.close() }
                class="btn mt-8"
                type="button">{ __('Close') }</button>
        ];
    }
}

export default ImagePicker;
