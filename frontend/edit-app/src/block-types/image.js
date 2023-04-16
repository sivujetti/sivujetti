import {__, env, urlUtils, hookForm, unhookForm, reHookValues, FormGroupInline,
        Textarea, InputErrors, Icon, validationConstraints} from '@sivujetti-commons-for-edit-app';
import ImagePicker from '../block-widget/ImagePicker.jsx';
import {placeholderImageSrc} from '../commons/FileUploader.jsx';
import setFocusTo from './auto-focusers.js';

class ImageBlockEditForm extends preact.Component {
    // imagePicker;
    /**
     * @access protected
     */
    componentWillMount() {
        this.imagePicker = preact.createRef();
        const {getBlockCopy, emitValueChanged, grabChanges} = this.props;
        const {src, altText} = getBlockCopy();
        this.setState(hookForm(this, [
            {name: 'altText', value: altText, validations: [['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]],
             label: __('Alt text'), onAfterValueChanged: (value, hasErrors, source) => {
                if (source !== 'undo') emitValueChanged(value, 'altText', hasErrors, env.normalTypingDebounceMillis);
            }},
        ], {
            src,
        }));
        grabChanges((block, _origin, isUndo) => {
            if (this.state.src !== block.src)
                this.setState({src: block.src});
            if (isUndo && this.state.values.altText !== block.altText)
                reHookValues(this, [{name: 'altText', value: block.altText}]);
        });
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
        return <div class="form-horizontal pt-0">
            <FormGroupInline>
                <label htmlFor="src" class="form-label">{ __('Image file') }</label>
                <ImagePicker
                    onImageSelected={ this.handleImageChanged.bind(this) }
                    initialImageFileName={ src }
                    inputId="src"
                    ref={ this.imagePicker }/>
            </FormGroupInline>
            <FormGroupInline labelFlow="break">
                <label htmlFor="altText" class="form-label with-icon" title={ __('Alt text') }>
                    { __('Alt text') }
                    <span
                        class="tooltip tooltip-left p-absolute"
                        data-tooltip={ __('The text that a browser displays\nif the image cannot be loaded') }
                        style="right: .8rem; margin: -.8rem -.4rem 0 0; z-index: 1;">
                        <Icon iconId="info-circle" className="color-dimmed3 size-xs"/>
                    </span>
                </label>
                <Textarea vm={ this } prop="altText" rows="1" style="min-height:unset"/>
                <InputErrors vm={ this } prop="altText"/>
            </FormGroupInline>
        </div>;
    }
    /**
     * @param {UploadsEntry|null} img
     */
    handleImageChanged(img) {
        const src = img ? img.fileName : null;
        this.props.emitValueChanged(src, 'src', false, 0, 'debounce-none');
    }
}

export default () => {
    const initialData = {
        src: null,
        altText: ''
    };
    const name = 'Image';
    return {
        name,
        friendlyName: 'Image',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        icon: 'photo',
        reRender({src, altText, styleClasses, id}, renderChildren) {
            return ['<figure class="j-', name, styleClasses ? ` ${styleClasses}` : '',
                '" data-block-type="', name,
                '" data-block="', id,
                '">',
                    '<img src="', src ? urlUtils.makeAssetUrl(`public/uploads/${src}`) : placeholderImageSrc, '"',
                    ' alt="', altText ,'">',
                renderChildren(),
            '</figure>'
            ].join('');
        },
        createSnapshot: from => ({
            src: from.src,
            altText: from.altText,
        }),
        editForm: ImageBlockEditForm,
    };
};
