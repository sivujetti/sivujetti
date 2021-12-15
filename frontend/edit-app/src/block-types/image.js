import {__, urlUtils, env} from '../commons/main.js';
import {useField, FormGroupInline, InputErrors} from '../commons/Form2.jsx';
import ImagePicker from '../BlockWidget/ImagePicker.jsx';
import {formValidation} from '../constants.js';
import {UPLOADS_DIR_PATH} from '../Upload/UploadsManager.jsx';
import setFocusTo from './auto-focusers.js';

/**
 * @type {preact.FunctionalComponent<BlockEditFormProps>}
 */
const ImageBlockEditForm = ({block, funcsIn, funcsOut}) => {
    const [src, setBgImage] = preactHooks.useState(block.src);
    const cssClass = useField('cssClass', {value: block.cssClass, validations: [['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]],
        label: __('Css classes'),
        onAfterValidation: (val, hasErrors) => { funcsIn.onValueChanged(val, 'cssClass', hasErrors, env.normalTypingDebounceMillis); }});
    const imagePicker = preactHooks.useMemo(() => preact.createRef(), []);
    //
    preactHooks.useEffect(() => {
        setFocusTo(imagePicker);
    }, []);
    /**
     * @param {UploadsEntry|null} img
     */
    const handleBgImageChanged = preactHooks.useCallback(img => {
        const src = img ? `/${UPLOADS_DIR_PATH}${img.baseDir}${img.fileName}` : '';
        setBgImage(src);
        funcsIn.onValueChanged(src, 'src', false, 'debounce-none');
    }, []);
    //
    funcsOut.resetValues = preactHooks.useCallback((newValue) => {
        setBgImage(newValue.src);
        cssClass.triggerInput(newValue.cssClass);
    }, []);
    //
    return <div class="form-horizontal pt-0">
        <FormGroupInline>
            <label htmlFor="src" class="form-label">{ __('Image file') }</label>
            <ImagePicker
                onImageSelected={ handleBgImageChanged }
                initialImageFileName={ src }
                inputId="src"
                ref={ imagePicker }/>
        </FormGroupInline>
        <FormGroupInline>
            <label htmlFor="cssClass" class="form-label">{ __('Css classes') }</label>
            <input { ...cssClass }/>
            <InputErrors errors={ cssClass.getErrors() }/>
        </FormGroupInline>
    </div>;
};

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
