import {__, urlUtils, env} from '../commons/main.js';
import {hookForm, InputGroupInline, InputError, Input} from '../commons/Form.jsx';
import ImagePicker from '../BlockWidget/ImagePicker.jsx';
import {formValidation} from '../constants.js';
import {UPLOADS_DIR_PATH} from '../Upload/UploadsManager.jsx';

class ImageBlockEditForm extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState(Object.assign({
            src: this.props.block.src,
        }, hookForm(this, {
            cssClass: this.props.block.cssClass,
        })));
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.form.destroy();
    }
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    render(_, {classes, errors}) {
        return <div class="form-horizontal">
            <InputGroupInline>
                <label class="form-label" htmlFor="src" title={ __('Image file') }>{ __('Image file') }</label>
                <ImagePicker
                    onImageSelected={ this.handleImageChanged.bind(this) }
                    initialImageFileName={ this.state.src }
                    inputId="src"/>
            </InputGroupInline>
            <InputGroupInline classes={ classes.cssClass }>
                <label class="form-label" htmlFor="cssClass" title={ __('Css classes') }>{ __('Css classes') }</label>
                <Input vm={ this } name="cssClass" id="cssClass" errorLabel={ __('Css classes') }
                    validations={ [['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]] } myOnChange={ this.emitChange.bind(this) }/>
                <InputError error={ errors.cssClass }/>
            </InputGroupInline>
        </div>;
    }
    /**
     * @param {UploadsEntry|null} img
     * @access private
     */
    handleImageChanged(img) {
        const src = img ? `/${UPLOADS_DIR_PATH}${img.baseDir}${img.fileName}` : '';
        this.setState({src});
        this.emitChange(this.state, src);
    }
    /**
     * @param {Object} newState
     * @param {String|null} src = null
     * @access private
     */
    emitChange(newState, src = null) {
        this.props.onValueChanged({src: src !== null ? src : this.state.src,
                                   cssClass: newState.values.cssClass},
                                  !src ? env.normalTypingDebounceMillis : undefined,
                                  !src ? undefined : 'debounce-none');
        return newState;
    }
}

export default () => {
    const initialData = {src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAD6AQMAAAAho+iwAAAABlBMVEX19fUzMzO8wlcyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAIElEQVRoge3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAD8GJhYAATKiH3kAAAAASUVORK5CYII=', cssClass: ''};
    return {
        name: 'Image',
        friendlyName: 'Image',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        reRender({src, cssClass}, renderChildren) {
            return ['<span class="image', (cssClass ? ` ${cssClass}` : ''), '">',
                '<img src="', !src.startsWith('data:') ? urlUtils.makeAssetUrl(src) : src, '" alt="">',
                renderChildren(),
            '</span>'].join('');
        },
        editForm: ImageBlockEditForm,
    };
};
