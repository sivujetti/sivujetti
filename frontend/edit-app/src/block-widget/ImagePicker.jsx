import {__, floatingDialog, hookForm, reHookValues, Input, Icon, validationConstraints} from '@sivujetti-commons-for-edit-app';
import FileUploader from '../commons/FileUploader.jsx';
import {mediaUrlValidatorImpl} from '../validation.js';

class ImagePickerFieldWidget extends preact.Component {
    // inputEl;
    /**
     * @param {{onImageSelected: (img: UploadsEntry) => void; initialImageFileName: String; inputId: String;}} props
     */
    constructor(props) {
        super(props);
        this.inputEl = preact.createRef();
    }
    /**
     * @access protected
     */
    render({onImageSelected, initialImageFileName, inputId}) {
        const input = <input
            value={ initialImageFileName }
            onClick={ this.openPickerDialog.bind(this) }
            onInput={ this.openPickerDialog.bind(this) }
            onKeyUp={ e => { if (e.key === 'Enter' || e.key === 'ArrowDown') this.openPickerDialog(e); } }
            class="form-input"
            name={ inputId }
            id={ inputId }
            autoComplete="off"
            ref={ this.inputEl }/>;
        return initialImageFileName ? <div class="has-icon-right">
            { input }
            <button
                onClick={ () => onImageSelected(null) }
                class="sivujetti-form-icon btn no-color"
                type="button">
                <Icon iconId="x" className="size-xs color-dimmed"/>
            </button>
        </div> : input;
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
            selectedImagePath: this.props.initialImageFileName,
            onSelected: file => this.props.onImageSelected(file)
        });
        this.inputEl.current.blur();
    }
}

class ImagePicker2 extends preact.Component {
    // inputEl;
    /**
     * @param {{onSrcCommitted: (newSrc: String|null) => void; src: String|null; inputId: String;}} props
     */
    constructor(props) {
        super(props);
        this.inputEl = preact.createRef();
    }
    /**
     * @access protected
     */
    componentWillMount() {
        if (this.props.src)
            this.setState(hookForm(this, [
                {name: 'srcManual', value: this.props.src, validations: [
                    [mediaUrlValidatorImpl],
                    ['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]
                ],
                label: __('Image file'), onAfterValueChanged: (value, hasErrors, source) => {
                    if (source !== 'undo' && !hasErrors)
                        this.props.onSrcCommitted(value);
                }},
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
    render({src, inputId}) {
        if (src !== undefined) {
            const [inputWrapCls, clearSrcBtnCls] = src
                ? ['has-icon-right', '']
                : ['',               ' d-none'];
            return <div class="flex-centered">
                <div class={ inputWrapCls } style="flex: 1 0">
                    <Input vm={ this } prop="srcManual" id={ inputId } ref={ this.inputEl }/>
                    <button
                        onClick={ () => this.props.onSrcCommitted(null) }
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
            onSelected: file => this.props.onSrcCommitted(file ? file.fileName : null)
        });
        this.inputEl.current.inputEl.current.blur();
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

export default ImagePickerFieldWidget;
export {ImagePicker2};
