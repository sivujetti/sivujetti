import {__, urlUtils, env} from '../commons/main.js';
import {useField, FormGroupInline, InputErrors} from '../commons/Form2.jsx';
import Icon from '../commons/Icon.jsx';
import {formValidation} from '../constants.js';
import ImagePicker from '../BlockWidget/ImagePicker.jsx';
import {UPLOADS_DIR_PATH} from '../Upload/UploadsManager.jsx';
import setFocusTo from './auto-focusers.js';

/**
 * @type {preact.FunctionalComponent<BlockEditFormProps2>}
 */
const SectionBlockEditForm = ({block, funcsIn, funcsOut, blockTree}) => {
    const [bgImage, setBgImage] = preactHooks.useState(block.bgImage);
    const cssClass = useField('cssClass', {value: block.cssClass, validations: [['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]],
        label: __('Css classes'),
        onAfterValidation: (val, hasErrors) => { funcsIn.onValueChanged(val, 'cssClass', hasErrors, env.normalTypingDebounceMillis); }});
    const imagePicker = preact.createRef();
    //
    preactHooks.useEffect(() => {
        setFocusTo(imagePicker);
    }, []);
    /**
     * @param {UploadsEntry|null} img
     */
    const handleBgImageChanged = preactHooks.useCallback(img => {
        const bgImage = img ? `/${UPLOADS_DIR_PATH}${img.baseDir}${img.fileName}` : '';
        setBgImage(bgImage);
        funcsIn.onValueChanged(bgImage, 'bgImage', false, 'debounce-none');
    });
    //
    funcsOut.resetValues = preactHooks.useCallback((newData) => {
        setBgImage(newData.bgImage);
        cssClass.triggerInput(newData.cssClass);
    });
    //
    return <div class="form-horizontal pt-0">
        <FormGroupInline>
            <label htmlFor="bgImage" class="form-label">{ __('Background') }</label>
            <ImagePicker
                onImageSelected={ handleBgImageChanged }
                initialImageFileName={ bgImage }
                inputId="bgImage"
                ref={ imagePicker }/>
        </FormGroupInline>
        <FormGroupInline>
            <label htmlFor="cssClass" class="form-label">{ __('Css classes') }</label>
            <input { ...cssClass }/>
            <InputErrors errors={ cssClass.getErrors() }/>
        </FormGroupInline>
        <a onClick={ e => (e.preventDefault(), blockTree.appendBlockToTreeAsChildOf(block)) }
            class="btn btn-link btn-sm text-tiny with-icon-inline color-dimmed"
            href="#add-child-block">
            <Icon iconId="plus" className="size-xs mr-1"/> { __('Add child block') }
        </a>
    </div>;
};

export default () => {
    const initialData = {bgImage: '', cssClass: ''};
    return {
        name: 'Section',
        friendlyName: 'Section',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-generic-wrapper',
        icon: 'layout-rows',
        reRender({bgImage, cssClass}, renderChildren) {
            return `<section${cssClass? ` class="${cssClass}"` : ''}` +
                (bgImage ? ` style="background-image:url('${urlUtils.makeAssetUrl(bgImage)}')"` : '') +
                '><div data-block-root>' +
                renderChildren() +
            '</div></section>';
        },
        createSnapshot: from => ({
            bgImage: from.bgImage,
            cssClass: from.cssClass,
        }),
        editForm: SectionBlockEditForm,
    };
};
