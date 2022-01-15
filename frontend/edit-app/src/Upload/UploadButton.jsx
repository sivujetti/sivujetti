import {__, http, env} from '@sivujetti-commons-for-edit-app';
import {hookForm, InputError, InputGroup, Input} from '../commons/Form.jsx';
import Icon from '../commons/Icon.jsx';
import toasters, {Toaster} from '../commons/Toaster.jsx';

const MAX_FILE_SIZE_MB = 8;

class UploadButton extends preact.Component {
    /**
     * @param {{onFileUploaded: (image: UploadsEntry) => any;}} props
     */
    constructor(props) {
        super(props);
        this.selectedImage = null;
        this.fileInput = preact.createRef();
        this.state = {selectedImageSrc: null, validationError: null};
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        if (this.form)
            this.form.destroy();
    }
    /**
     * @access protected
     */
    render(_, {selectedImageSrc, validationError}) {
        return <div class={ `file-input-outer${!selectedImageSrc ? '' : ' image-selected'}` }>
            <Toaster id="fileUpload"/>
            <input onChange={ this.handleFileInputChange.bind(this) }
                id="image-input"
                name="localFile"
                type="file"
                accept="image/*"
                ref={ this.fileInput }/>
            <label class={ !selectedImageSrc ? 'd-flex' : '' } htmlFor="image-input">
                { !selectedImageSrc ? [
                    <Icon iconId="photo"/>,
                    <span class="ml-2 flex-centered">{ __('Choose a picture') }</span>
                ] : <img src={ selectedImageSrc }/> }
            </label>
            <div class="has-error"><InputError error={ validationError }/></div>
            { !selectedImageSrc ? null : [
                <InputGroup classes={ this.state.classes.fileName }>
                    <label htmlFor="fileName" class="form-label">{ __('File name') }</label>
                    <Input vm={ this } name="fileName" id="fileName" errorLabel={ __('File name') }
                        validations={ [['regexp', '^[^/]*$'], ['maxLength', 255]] }/>
                    <InputError error={ this.state.errors.fileName }/>
                </InputGroup>,
                <div class="form-buttons mt-8">
                    <button
                        onClick={ this.uploadSelectedImage.bind(this) }
                        class="btn btn-primary"
                        type="button"
                        disabled={ !!this.state.errors.fileName }>{ __('Upload picture') }</button>
                </div>
            ] }
        </div>;
    }
    /**
     * @access private
     */
    handleFileInputChange(e) {
        if (!e.target.value) return;
        const file = e.target.files[0];
        if (!file.type.startsWith('image/')) {
            this.setState({validationError: __('File extension not supported'),
                           selectedImageSrc: null});
            return;
        }
        if (file.size >= MAX_FILE_SIZE_MB * 1024 * 1024) {
            this.setState({validationError: __('File size must not exceed %dMB', MAX_FILE_SIZE_MB),
                           selectedImageSrc: null});
            return;
        }
        if (this.state.validationError) this.setState({validationError: null});
        const reader = new FileReader();
        reader.onload = e => {
            this.setState(Object.assign(
                {selectedImageSrc: e.target.result},
                hookForm(this, {fileName: this.selectedImage.name})
            ));
        };
        this.selectedImage = file;
        reader.readAsDataURL(this.selectedImage);
    }
    /**
     * @access private
     */
    uploadSelectedImage() {
        if (!this.form.handleSubmit())
            return;
        //
        const data = new FormData();
        data.append('localFile', this.selectedImage);
        data.append('fileName', this.state.values.fileName);
        data.append('csrfToken', env.csrfToken);
        //
        http.post('/api/uploads', data, {headers: '@auto'})
            .then(info => {
                if (!info.file) throw new Error('Unexpected response');
                this.selectedImage = null;
                this.setState({selectedImageSrc: null});
                this.fileInput.current.value = null;
                this.props.onFileUploaded(info.file);
            })
            .catch(err => {
                env.window.console.error(err);
                toasters.fileUpload(__('Failed to upload image'), 'error');
            });
    }
}

export default UploadButton;
