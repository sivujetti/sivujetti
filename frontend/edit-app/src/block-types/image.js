import {__, urlUtils, env, hookForm, unhookForm, reHookValues, Input, InputErrors, FormGroupInline} from '@sivujetti-commons-for-edit-app';
import ImagePicker from '../BlockWidget/ImagePicker.jsx';
import {validationConstraints} from '../constants.js';
import setFocusTo from './auto-focusers.js';

const placeholderImageSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAD6AQMAAAAho+iwAAAABlBMVEX19fUzMzO8wlcyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAIElEQVRoge3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAD8GJhYAATKiH3kAAAAASUVORK5CYII=';

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
            {name: 'cssClass', value: block.cssClass, validations: [['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]], label: __('Css classes'),
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
        const src = img ? img.fileName : null;
        this.setState({src});
        this.props.onValueChanged(src, 'src', false, 0, 'debounce-none');
    }
}

class ImageBlockEditForm2 extends preact.Component {
    // imagePicker;
    /**
     * @access protected
     */
    componentWillMount() {
        this.imagePicker = preact.createRef();
        const {getBlockCopy, emitValueChanged, grabChanges} = this.props;
        const {cssClass, src} = getBlockCopy();
        this.setState(hookForm(this, [
            {name: 'cssClass', value: cssClass, validations: [['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]], label: __('Css classes'),
             onAfterValueChanged: (value, hasErrors) => { emitValueChanged(value, 'cssClass', hasErrors, env.normalTypingDebounceMillis); }},
        ], {
            src,
        }));
        grabChanges((block, _origin, isUndo) => {
            if (isUndo && this.state.values.cssClass !== block.cssClass)
                reHookValues(this, [{name: 'cssClass', value: block.cssClass}]);
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
     * @access protected
     */
    componentWillUnmount() {
        unhookForm(this);
    }
    /**
     * @param {BlockEditFormProps2} props
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
        // @featureFlagConditionUseReduxBlockTree
        editForm: !window.useReduxBlockTree ? ImageBlockEditForm : ImageBlockEditForm2,
    };
};
