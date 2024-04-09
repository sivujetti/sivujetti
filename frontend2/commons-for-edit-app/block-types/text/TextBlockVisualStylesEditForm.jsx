import LengthValueInput from '../../styles/LengthValueInput.jsx';
import OptionValueInput from '../../styles/OptionValueInput.jsx';
import BlockVisualStylesEditForm, {createCssVarsMaps} from '../../BlockVisualStylesEditForm.jsx';
import ColorPickerInput from '../../ColorPickerInput.jsx';
import {__} from '../../edit-app-singletons.js';
import {FormGroupInline} from '../../Form.jsx';
import ScreenSizesVerticalTabs from '../../ScreenSizesVerticalTabs.jsx';
import {createCssDeclExtractor} from '../../ScssWizardFuncs.js';

class TextBlockVisualStylesEditForm extends BlockVisualStylesEditForm {
    /**
     * @access protected
     */
    componentWillMount() {
        const [states, styleRefs] = createCssVarsMaps(this.props.blockId, createTextStylesState);
        this.userStyleRefs = styleRefs;
        this.setState({styleScopes: states, curScreenSizeTabIdx: 0});
    }
    /**
     * @param {BlockStylesEditFormProps} props
     */
    componentWillReceiveProps(props) {
        if (props.stateId !== this.props.stateId) {
            const [states, styleRefs] = createCssVarsMaps(props.blockId, createTextStylesState);
            if (JSON.stringify(states) !== JSON.stringify(this.state.styleScopes)) {
                this.userStyleRefs = styleRefs;
                this.setState({styleScopes: states, curScreenSizeTabIdx: 0});
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
                <FormGroupInline>
                    <label htmlFor="textColor" class="form-label">{ __('Text color') }</label>
                    <ColorPickerInput
                        initialColorStr={ screenStyles.textColor || null }
                        onColorPicked={ colorStr => this.handleCssDeclChanged(colorStr, 'textColor', textBlockVarInputToCssDecl) }
                        inputId="textColor"/>
                </FormGroupInline>
                <OptionValueInput
                    options={ [
                        {label: __('Right'), value: 'right'},
                        {label: __('Center'), value: 'center'},
                        {label: __('Justify'), value: 'justify'},
                        {label: __('Default'), value: 'default'},
                        {label: __('Initial'), value: 'initial'},
                        {label: '-', value: ''},
                    ] }
                    value={ OptionValueInput.valueFromInput(screenStyles.textAlign || '-') }
                    onValueChanged={ newValAsString => this.handleCssDeclChanged(newValAsString, 'textAlign', textBlockVarInputToCssDecl) }
                    labelTranslated={ __('Text align') }
                    isClearable={ !!screenStyles.textAlign }
                    inputId="textTextAlign"/>
                <LengthValueInput
                    value={ LengthValueInput.valueFromInput(screenStyles.fontSize || 'initial') }
                    onValueChanged={ newValAsString => this.handleCssDeclChanged(newValAsString, 'fontSize', textBlockVarInputToCssDecl) }
                    labelTranslated={ __('Font size') }
                    isClearable={ !!screenStyles.fontSize }
                    inputId="textFontSize"/>
                <LengthValueInput
                    value={ LengthValueInput.valueFromInput(screenStyles.paddingTop || 'initial') }
                    onValueChanged={ newValAsString => this.handleCssDeclChanged(newValAsString, 'paddingTop', textBlockVarInputToCssDecl) }
                    labelTranslated={ __('Padding top') }
                    isClearable={ !!screenStyles.paddingTop }
                    inputId="textPaddingTop"/>
                <LengthValueInput
                    value={ LengthValueInput.valueFromInput(screenStyles.paddingRight || 'initial') }
                    onValueChanged={ newValAsString => this.handleCssDeclChanged(newValAsString, 'paddingRight', textBlockVarInputToCssDecl) }
                    labelTranslated={ __('Padding right') }
                    isClearable={ !!screenStyles.paddingRight }
                    inputId="textPaddingRight"/>
                <LengthValueInput
                    value={ LengthValueInput.valueFromInput(screenStyles.paddingBottom || 'initial') }
                    onValueChanged={ newValAsString => this.handleCssDeclChanged(newValAsString, 'paddingBottom', textBlockVarInputToCssDecl) }
                    labelTranslated={ __('Padding bottom') }
                    isClearable={ !!screenStyles.paddingBottom }
                    inputId="textPaddingBottom"/>
                <LengthValueInput
                    value={ LengthValueInput.valueFromInput(screenStyles.paddingLeft || 'initial') }
                    onValueChanged={ newValAsString => this.handleCssDeclChanged(newValAsString, 'paddingLeft', textBlockVarInputToCssDecl) }
                    labelTranslated={ __('Padding left') }
                    isClearable={ !!screenStyles.paddingLeft }
                    inputId="textPaddingLeft"/>
            </div>
        </ScreenSizesVerticalTabs>;
    }
}

/**
 * @param {String|null} scss
 * @param {mediaScope} _mediaScopeId
 * @returns {CssVarsMap}
 */
function createTextStylesState(scss, _mediaScopeId) {
    if (!scss) return {
        textColor: null,
        textAlign: null,
        fontSize: null,
        paddingTop: null,
        paddingRight: null,
        paddingBottom: null,
        paddingLeft: null,
    };
    const extr = createCssDeclExtractor(scss);
    return {
        textColor: extr.extractVal('color'),
        textAlign: extr.extractVal('text-align'),
        fontSize: extr.extractVal('font-size'),
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
function textBlockVarInputToCssDecl(varName, val) {
    if (varName === 'textColor') return `color: ${val};`;
    if (varName === 'textAlign') return `text-align: ${val};`;
    if (varName === 'fontSize') return `font-size: ${val};`;
    if (varName === 'paddingTop') return `padding-top: ${val};`;
    if (varName === 'paddingRight') return `padding-right: ${val};`;
    if (varName === 'paddingBottom') return `padding-bottom: ${val};`;
    if (varName === 'paddingLeft') return `padding-left: ${val};`;
    throw new Error(`Unknown property ${varName}`);
}

export default TextBlockVisualStylesEditForm;
