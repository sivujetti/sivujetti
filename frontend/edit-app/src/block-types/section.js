import {__, urlUtils, unhookForm, FormGroupInline, Icon} from '@sivujetti-commons-for-edit-app';
import ImagePicker from '../BlockWidget/ImagePicker.jsx';
import {UPLOADS_DIR_PATH} from '../Upload/UploadsManager.jsx';
import setFocusTo from './auto-focusers.js';

class SectionBlockEditForm extends preact.Component {
    // imagePicker;
    /**
     * @param {RawBlockData} snapshot
     * @access public
     */
    overrideValues(snapshot) {
        this.setState({bgImage: snapshot.bgImage});
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const {block} = this.props;
        this.imagePicker = preact.createRef();
        this.setState({bgImage: block.bgImage});
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
    render({blockTree, block}, {bgImage}) {
        if (!this.state.values) return;
        return <div class="form-horizontal pt-0">
            <FormGroupInline>
                <label htmlFor="bgImage" class="form-label">{ __('Background') }</label>
                <ImagePicker
                    onImageSelected={ this.handleBgImageChanged.bind(this) }
                    initialImageFileName={ bgImage }
                    inputId="bgImage"
                    ref={ this.imagePicker }/>
            </FormGroupInline>
            <a onClick={ e => (e.preventDefault(), blockTree.appendBlockToTreeAsChildOf(block)) }
                class="btn btn-link btn-sm text-tiny with-icon-inline color-dimmed"
                href="#add-child-block">
                <Icon iconId="plus" className="size-xs mr-1"/> { __('Add child block') }
            </a>
        </div>;
    }
    /**
     * @param {UploadsEntry|null} img
     */
    handleBgImageChanged(img) {
        const bgImage = img ? `/${UPLOADS_DIR_PATH}${img.baseDir}${img.fileName}` : '';
        this.setState({bgImage});
        this.props.onValueChanged(bgImage, 'bgImage', false, 0, 'debounce-none');
    }
}

class SectionBlockEditForm2 extends preact.Component {
    // imagePicker;
    /**
     * @access protected
     */
    componentWillMount() {
        const {getBlockCopy, grabChanges} = this.props;
        this.imagePicker = preact.createRef();
        this.setState({bgImage: getBlockCopy().bgImage});
        grabChanges((block, _origin, _isUndo) => {
            if (this.state.bgImage !== block.bgImage)
                this.setState({bgImage: block.bgImage});
        });
    }
    /**
     * @access protected
     */
    componentDidMount() {
        setFocusTo(this.imagePicker);
    }
    /**
     * @param {BlockEditFormProps2} props
     * @access protected
     */
    render(_, {bgImage}) {
        return <div class="form-horizontal pt-0">
            <FormGroupInline>
                <label htmlFor="bgImage" class="form-label">{ __('Background') }</label>
                <ImagePicker
                    onImageSelected={ this.handleBgImageChanged.bind(this) }
                    initialImageFileName={ bgImage }
                    inputId="bgImage"
                    ref={ this.imagePicker }/>
            </FormGroupInline>
        </div>;
    }
    /**
     * @param {UploadsEntry|null} img
     */
    handleBgImageChanged(img) {
        const bgImage = img ? `/${UPLOADS_DIR_PATH}${img.baseDir}${img.fileName}` : '';
        this.props.emitValueChanged(bgImage, 'bgImage', false, 0, 'debounce-none');
    }
}

export default () => {
    const initialData = {bgImage: ''};
    const name = 'Section';
    return {
        name,
        friendlyName: 'Section',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-generic-wrapper',
        icon: 'layout-rows',
        reRender({bgImage, styleClasses, id}, renderChildren) {
            return ['<section class="j-', name, styleClasses ? ` ${styleClasses}` : '', '"',
                bgImage ? ` style="background-image:url('${urlUtils.makeAssetUrl(bgImage)}')"` : '',
                ' data-block-type="', name, '" data-block="', id, '"><div data-block-root>',
                renderChildren() +
            '</div></section>'].join('');
        },
        createSnapshot: from => ({
            bgImage: from.bgImage,
        }),
        // @featureFlagConditionUseReduxBlockTree
        editForm: !window.useReduxBlockTree ? SectionBlockEditForm : SectionBlockEditForm2,
    };
};
