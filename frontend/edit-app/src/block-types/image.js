import {__, urlUtils, env} from '../commons/main.js';
import hookForm, {unhookForm, reHookValues, Input, InputErrors, FormGroupInline} from '../commons/Form3.jsx';
import ImagePicker from '../BlockWidget/ImagePicker.jsx';
import {formValidation} from '../constants.js';
import {UPLOADS_DIR_PATH} from '../Upload/UploadsManager.jsx';
import setFocusTo from './auto-focusers.js';

class ImageBlockEditForm extends preact.Component {
    // imagePicker;
    /**
     * @param {RawBlockData} snapshot
     * @access public
     */
    overrideValues(snapshot) {
        reHookValues(this, [{name: 'cssClass', value: snapshot.cssClass}]);
        this.setState({src: snapshot.src});
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const {block, onValueChanged} = this.props;
        this.imagePicker = preact.createRef();
        this.setState(hookForm(this, [
            {name: 'cssClass', value: block.cssClass, validations: [['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]], label: __('Css classes'),
             onAfterValueChanged: (value, hasErrors) => { onValueChanged(value, 'cssClass', hasErrors, env.normalTypingDebounceMillis); }},
        ], {
            src: block.src,
        }));
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
        if (!this.state.values) return;
        return <div class="form-horizontal pt-0">
            <FormGroupInline>
                <label htmlFor="src" class="form-label">{ __('Image file') }</label>
                <ImagePicker
                    onImageSelected={ this.handleImageChanged.bind(this) }
                    initialImageFileName={ src }
                    inputId="src"
                    ref={ this.imagePicker }/>
            </FormGroupInline>
            <FormGroupInline>
                <label htmlFor="cssClass" class="form-label">{ __('Css classes') }</label>
                <Input vm={ this } prop="cssClass"/>
                <InputErrors vm={ this } prop="cssClass"/>
            </FormGroupInline>
        </div>;
    }
    /**
     * @param {UploadsEntry|null} img
     */
    handleImageChanged(img) {
        const src = img ? `/${UPLOADS_DIR_PATH}${img.baseDir}${img.fileName}` : '';
        this.setState({src});
        this.props.onValueChanged(src, 'src', false, 'debounce-none');
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
        icon: 'photo',
        reRender({src, cssClass}, renderChildren) {
            return ['<span class="image', (cssClass ? ` ${cssClass}` : ''), '">',
                '<img src="', !src.startsWith('data:') ? urlUtils.makeAssetUrl(src) : src, '" alt="">',
                renderChildren(),
            '</span>'].join('');
        },
        createSnapshot: from => ({
            src: from.src,
            cssClass: from.cssClass,
        }),
        editForm: ImageBlockEditForm,
    };
};
