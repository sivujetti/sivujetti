import {__, urlUtils, FormGroupInline} from '@sivujetti-commons-for-edit-app';
import ImagePicker from '../block-widget/ImagePicker.jsx';
import setFocusTo from './auto-focusers.js';

const placeholderImageSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAD6AQMAAAAho+iwAAAABlBMVEX19fUzMzO8wlcyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAIElEQVRoge3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAD8GJhYAATKiH3kAAAAASUVORK5CYII=';

class ImageBlockEditForm extends preact.Component {
    // imagePicker;
    /**
     * @access protected
     */
    componentWillMount() {
        this.imagePicker = preact.createRef();
        const {getBlockCopy, grabChanges} = this.props;
        this.setState({src: getBlockCopy().src});
        grabChanges((block, _origin, _isUndo) => {
            if (this.state.src !== block.src)
                this.setState({src: block.src});
        });
    }
    /**
     * @access protected
     */
    componentDidMount() {
        setFocusTo(this.imagePicker);
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
    const initialData = {src: null};
    const name = 'Image';
    return {
        name,
        friendlyName: 'Image',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        icon: 'photo',
        reRender({src, styleClasses, id}, renderChildren) {
            return ['<figure class="j-', name, styleClasses ? ` ${styleClasses}` : '',
                '" data-block-type="', name,
                '" data-block="', id,
                '"><img src="', src ? urlUtils.makeAssetUrl(`public/uploads/${src}`) : placeholderImageSrc, '" alt="">',
                renderChildren(),
            '</figure>'
            ].join('');
        },
        createSnapshot: from => ({
            src: from.src,
        }),
        editForm: ImageBlockEditForm,
    };
};
