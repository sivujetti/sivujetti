import {__, urlUtils, env, hookForm, unhookForm, reHookValues, Input, InputErrors, FormGroupInline, Icon} from '@sivujetti-commons-for-edit-app';
import {validationConstraints} from '../constants.js';
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
        reHookValues(this, [{name: 'cssClass', value: snapshot.cssClass}]);
        this.setState({bgImage: snapshot.bgImage});
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
            bgImage: block.bgImage,
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
            <FormGroupInline>
                <label htmlFor="cssClass" class="form-label">{ __('Css classes') }</label>
                <Input vm={ this } prop="cssClass"/>
                <InputErrors vm={ this } prop="cssClass"/>
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
        const {getBlockCopy, emitValueChanged, grabChanges} = this.props;
        const {cssClass, bgImage} = getBlockCopy();
        this.imagePicker = preact.createRef();
        this.setState(hookForm(this, [
            {name: 'cssClass', value: cssClass, validations: [['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]], label: __('Css classes'),
             onAfterValueChanged: (value, hasErrors) => { emitValueChanged(value, 'cssClass', hasErrors, env.normalTypingDebounceMillis); }},
        ], {
            bgImage,
        }));
        grabChanges((block, origin, isUndo) => {
            if (isUndo && this.state.values.cssClass !== block.cssClass)
                reHookValues(this, [{name: 'cssClass', value: block.cssClass}]);
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
     * @access protected
     */
    componentWillUnmount() {
        unhookForm(this);
    }
    /**
     * @param {BlockEditFormProps2} props
     * @access protected
     */
    render(_, {bgImage}) {
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
