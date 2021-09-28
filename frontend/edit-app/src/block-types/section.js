import {__, urlUtils, env} from '@sivujetti-commons';
import {hookForm, InputGroupInline, Input, InputError} from '../../../commons/Form.jsx';
import Icon from '../../../commons/Icon.jsx';
import {formValidation} from '../constants.js';
import ImagePicker from '../BlockWidget/ImagePicker.jsx';
import {UPLOADS_DIR_PATH} from '../Upload/UploadsManager.jsx';

class SectionBlockEditForm extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState(Object.assign({
            bgImage: this.props.block.bgImage,
        }, hookForm(this, {
            cssClass: this.props.block.cssClass,
        })));
    }
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    render({block, blockTree}, {classes, errors}) {
        return <>
            <div class="form-horizontal">
                <InputGroupInline>
                    <label class="form-label" htmlFor="bgImage" title={ __('Background') }>{ __('Background') }</label>
                    <ImagePicker
                        onImageSelected={ this.handleBgImageChanged.bind(this) }
                        initialImageFileName={ this.state.bgImage }
                        inputId="bgImage"/>
                </InputGroupInline>
                <InputGroupInline classes={ classes.cssClass }>
                    <label class="form-label" htmlFor="cssClass" title={ __('Css classes') }>{ __('Css classes') }</label>
                    <Input vm={ this } name="cssClass" id="cssClass" errorLabel={ __('Css classes') }
                        validations={ [['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]] } myOnChange={ this.emitChange.bind(this) }/>
                    <InputError error={ errors.cssClass }/>
                </InputGroupInline>
            </div>
            <a onClick={ e => (e.preventDefault(), blockTree.appendBlockToTreeAsChildOf(block)) }
                class="btn btn-link btn-sm text-tiny with-icon-inline color-dimmed"
                href="#add-child-block">
                <Icon iconId="plus" className="size-xs mr-1"/> { __('Add child block') }
            </a>
        </>;
    }
    /**
     * @param {UploadsEntry|null} img
     * @access private
     */
    handleBgImageChanged(img) {
        const bgImage = img ? `/${UPLOADS_DIR_PATH}${img.baseDir}${img.fileName}` : '';
        this.setState({bgImage});
        this.emitChange(this.state, bgImage);
    }
    /**
     * @param {Object} newState
     * @param {String|null} bgImage = null
     * @access private
     */
    emitChange(newState, bgImage = null) {
        this.props.onValueChanged({bgImage: bgImage !== null ? bgImage : this.state.bgImage,
                                   cssClass: newState.values.cssClass},
                                  env.normalTypingDebounceMillis);
        return newState;
    }
}

export default () => {
    const initialData = {bgImage: '', cssClass: ''};
    return {
        name: 'Section',
        friendlyName: 'Section',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-generic-wrapper',
        reRender({bgImage, cssClass}, renderChildren) {
            return `<section${cssClass? ` class="${cssClass}"` : ''}` +
                (bgImage ? ` style="background-image:url('${urlUtils.makeAssetUrl(bgImage)}')"` : '') +
                '>' +
                renderChildren() +
            '</section>';
        },
        editForm: SectionBlockEditForm,
    };
};
