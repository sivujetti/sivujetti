import LengthValueInput from '../../styles/LengthValueInput.jsx';
import OptionValueInput from '../../styles/OptionValueInput.jsx';
import BlockDefaultStylesEditForm, {createCssVarsMaps} from '../../BlockVisualStylesEditForm.jsx';
import {__} from '../../edit-app-singletons';
import ScreenSizesVerticalTabs from '../../ScreenSizesVerticalTabs.jsx';
import {createCssDeclExtractor} from '../../ScssWizardFuncs.js';

class ImageBlockVisualStylesEditForm extends BlockDefaultStylesEditForm {
    /**
     * @access protected
     */
    componentWillMount() {
        const [states, styleRefs] = createCssVarsMaps(this.props.blockId, createImageStylesState);
        this.userStyleRefs = styleRefs;
        this.setState({styleScopes: states, curScreenSizeTabIdx: 0});
    }
    /**
     * @param {BlockStylesEditFormProps} props
     */
    componentWillReceiveProps(props) {
        if (props.stateId !== this.props.stateId) {
            const [states, styleRefs] = createCssVarsMaps(props.blockId, createImageStylesState);
            if (JSON.stringify(states) !== JSON.stringify(this.state.styleScopes)) {
                this.userStyleRefs = styleRefs;
                this.setState({styleScopes: states});
            }
        }
    }
    /**
     * @access protected
     */
    render(_, {styleScopes, curScreenSizeTabIdx}) {
        const screenStyles = styleScopes[curScreenSizeTabIdx] || {};
        return <ScreenSizesVerticalTabs
            curTabIdx={ curScreenSizeTabIdx }
            setCurTabIdx={ to => this.setState({curScreenSizeTabIdx: to}) }>
            <div class="form-horizontal has-visual-style-widgets tight pt-1 pl-2">
                <OptionValueInput
                    options={ [
                        {label: 'Block', value: 'block'},
                        {label: 'Inline', value: 'inline'},
                        {label: 'Flex', value: 'flex'},
                        {label: 'Inline flex', value: 'inline-flex'},
                        {label: 'Inline block', value: 'inline-block'},
                        {label: 'Initial', value: 'initial'},
                        {label: '-', value: ''},
                    ] }
                    value={ OptionValueInput.valueFromInput(screenStyles.display || '-') }
                    onValueChanged={ newValAsString => this.handleCssDeclChanged(newValAsString, 'display', imageBlockVarInputToCssDecl) }
                    labelTranslated={ __('Display') }
                    isClearable={ !!screenStyles.display }
                    inputId="imageDisplay"/>
                <OptionValueInput
                    options={ [
                        {label: '1/1', value: '1/1'},
                        {label: '3/4', value: '3/4'},
                        {label: '4/3', value: '4/3'},
                        {label: '6/9', value: '6/9'},
                        {label: '9/6', value: '9/6'},
                        // Global values
                        {label: __('Inherit'), value: 'inherit'},
                        {label: __('Initial'), value: 'initial'},
                        {label: __('Revert'), value: 'revert'},
                        {label: __('Revert layer'), value: 'revert-layer'},
                        {label: __('Unset'), value: 'unset'},
                        //
                        {label: '-', value: ''},
                    ] }
                    value={ OptionValueInput.valueFromInput(screenStyles.aspectRatio || '-') }
                    onValueChanged={ newValAsString => this.handleCssDeclChanged(newValAsString, 'aspectRatio', imageBlockVarInputToCssDecl) }
                    labelTranslated={ __('Aspect ratio') }
                    isClearable={ !!screenStyles.aspectRatio }
                    inputId="imageAspectRatio"/>
                <LengthValueInput
                    value={ LengthValueInput.valueFromInput(screenStyles.minHeight|| 'initial', 'px') }
                    onValueChanged={ newValAsString => this.handleCssDeclChanged(newValAsString, 'minHeight', imageBlockVarInputToCssDecl) }
                    labelTranslated={ __('Min height') }
                    isClearable={ !!screenStyles.minHeight }
                    inputId="imageMinHeight"/>
                <LengthValueInput
                    value={ LengthValueInput.valueFromInput(screenStyles.maxHeight|| 'initial', 'px') }
                    onValueChanged={ newValAsString => this.handleCssDeclChanged(newValAsString, 'maxHeight', imageBlockVarInputToCssDecl) }
                    labelTranslated={ __('Max height') }
                    isClearable={ !!screenStyles.maxHeight }
                    inputId="imageMaxHeight"/>
                <LengthValueInput
                    value={ LengthValueInput.valueFromInput(screenStyles.minWidth|| 'initial', 'px') }
                    onValueChanged={ newValAsString => this.handleCssDeclChanged(newValAsString, 'minWidth', imageBlockVarInputToCssDecl) }
                    labelTranslated={ __('Min width') }
                    isClearable={ !!screenStyles.minWidth }
                    inputId="imageMinWidth"/>
                <LengthValueInput
                    value={ LengthValueInput.valueFromInput(screenStyles.maxWidth|| 'initial', 'px') }
                    onValueChanged={ newValAsString => this.handleCssDeclChanged(newValAsString, 'maxWidth', imageBlockVarInputToCssDecl) }
                    labelTranslated={ __('Max width') }
                    isClearable={ !!screenStyles.maxWidth }
                    inputId="imageMaxWidth"/>
                <LengthValueInput
                    value={ LengthValueInput.valueFromInput(screenStyles.paddingTop || 'initial') }
                    onValueChanged={ newValAsString => this.handleCssDeclChanged(newValAsString, 'paddingTop', imageBlockVarInputToCssDecl) }
                    labelTranslated={ __('Padding top') }
                    isClearable={ !!screenStyles.paddingTop }
                    inputId="imagePaddingTop"/>
                <LengthValueInput
                    value={ LengthValueInput.valueFromInput(screenStyles.paddingRight || 'initial') }
                    onValueChanged={ newValAsString => this.handleCssDeclChanged(newValAsString, 'paddingRight', imageBlockVarInputToCssDecl) }
                    labelTranslated={ __('Padding right') }
                    isClearable={ !!screenStyles.paddingRight }
                    inputId="imagePaddingRight"/>
                <LengthValueInput
                    value={ LengthValueInput.valueFromInput(screenStyles.paddingBottom || 'initial') }
                    onValueChanged={ newValAsString => this.handleCssDeclChanged(newValAsString, 'paddingBottom', imageBlockVarInputToCssDecl) }
                    labelTranslated={ __('Padding bottom') }
                    isClearable={ !!screenStyles.paddingBottom }
                    inputId="imagePaddingBottom"/>
                <LengthValueInput
                    value={ LengthValueInput.valueFromInput(screenStyles.paddingLeft || 'initial') }
                    onValueChanged={ newValAsString => this.handleCssDeclChanged(newValAsString, 'paddingLeft', imageBlockVarInputToCssDecl) }
                    labelTranslated={ __('Padding left') }
                    isClearable={ !!screenStyles.paddingLeft }
                    inputId="imagePaddingLeft"/>
            </div>
        </ScreenSizesVerticalTabs>;
    }
}

const innerElScope = '>img';

/**
 * @param {String|null} scss
 * @param {mediaScope} _mediaScopeId
 * @returns {CssVarsMap}
 */
function createImageStylesState(scss, _mediaScopeId) {
    if (!scss) return {
        display: null,
        aspectRatio: null,
        minHeight: null,
        maxHeight: null,
        minWidth: null,
        maxWidth: null,
        paddingTop: null,
        paddingRight: null,
        paddingBottom: null,
        paddingLeft: null,
    };
    const extr = createCssDeclExtractor(scss);
    return {
        display: extr.extractVal('display'),
        aspectRatio: extr.extractVal('aspect-ratio', innerElScope),
        minHeight: extr.extractVal('min-height', innerElScope),
        maxHeight: extr.extractVal('max-height', innerElScope),
        minWidth: extr.extractVal('min-width', innerElScope),
        maxWidth: extr.extractVal('max-width', innerElScope),
        paddingTop: extr.extractVal('padding-top'),
        paddingRight: extr.extractVal('padding-right'),
        paddingBottom: extr.extractVal('padding-bottom'),
        paddingLeft: extr.extractVal('padding-left'),
    };
}

/**
 * @param {String} varName
 * @param {String} val
 * @returns {String}
 */
function imageBlockVarInputToCssDecl(varName, val) {
    if (varName === 'display') return `display: ${val};`;
    if (varName === 'aspectRatio') return `${innerElScope} {\n  aspect-ratio: ${val};\n}`;
    if (varName === 'minHeight') return `${innerElScope} {\n  min-height: ${val};\n}`;
    if (varName === 'maxHeight') return `${innerElScope} {\n  max-height: ${val};\n}`;
    if (varName === 'minWidth') return `${innerElScope} {\n  min-width: ${val};\n}`;
    if (varName === 'maxWidth') return `${innerElScope} {\n  max-width: ${val};\n}`;
    if (varName === 'paddingTop') return `padding-top: ${val};`;
    if (varName === 'paddingRight') return `padding-right: ${val};`;
    if (varName === 'paddingBottom') return `padding-bottom: ${val};`;
    if (varName === 'paddingLeft') return `padding-left: ${val};`;
    throw new Error(`Unknown property ${varName}`);
}

export default ImageBlockVisualStylesEditForm;
