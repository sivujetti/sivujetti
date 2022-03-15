import {__, floatingDialog, Icon} from '@sivujetti-commons-for-edit-app';
import UploadsManager from '../Upload/UploadsManager.jsx';

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
            ref={ this.inputEl }/>;
        return initialImageFileName ? <div class="has-icon-right">
            { input }
            <button
                onClick={ () => onImageSelected(null) }
                class="sivujetti-form-icon"
                type="button">
                <Icon iconId="x" className="size-xs"/>
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
    /**
     * @access private
     */
    emitChange(fileName) {
        this.form.triggerChange(fileName, this.fieldName);
        this.props.onValueChange(fileName);
    }
}

class PickImageDialog extends preact.Component {
    /**
     * @param {{selectedImagePath: String; onSelected: (img: UploadsEntry) => void;}} props
     * @access protected
     */
    render({onSelected}) {
        return <>
            <UploadsManager
                onEntryClicked={ imageEntry => {
                    onSelected(imageEntry);
                    floatingDialog.close();
                }}
                onlyImages
                autoFocus/>
            <button
                onClick={ () => floatingDialog.close() }
                class="btn mt-8"
                type="button">{ __('Cancel') }</button>
        </>;
    }
}

export default ImagePickerFieldWidget;
