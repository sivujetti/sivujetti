import {__, scssWizard} from '../edit-app-singletons.js';
import {
    createNormalizedDefs,
    createVarInputToScssCodeAuto,
    doCreateCssVarsMap,
    getValidDefs,
} from './DefaultStyleCustomizatorFormFuncs.js';
import SingleInputVisualStyleCustomizatorForm, {
    renderVarWidget,
} from './SingleInputVisualStyleCustomizatorForm.jsx';

/** @extends {preact.Component<DefaultStyleCustomizatorFormProps, {varsMap: CssVarsMap;}>} */
class DefaultStyleCustomizatorForm extends preact.Component {
    static SingleInput = SingleInputVisualStyleCustomizatorForm;
    /**
     * @access protected
     */
    constructor(props) {
        super(props);
        this.isSpecialRootStyle = props.blockId === 'j-_body_';
        this.styleSelector = !this.isSpecialRootStyle
            ? ['single-block', props.blockId, undefined]
            : ['base-vars',    undefined,    'base-styles'];
        /** @type {Array<VisualStylesFormVarDefinition>} */
        this.cssVarDefs = createNormalizedDefs(getValidDefs(this.createCssVarDefinitions()));
        /** @type {StyleChunk} */
        this.styleChunk = null;
        /** @type {translateVarInputToScssCodeTemplateFn} */
        this.varInputToScssCodeFn = createVarInputToScssCodeAuto(this.cssVarDefs);
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const [varsMap, styleChunk] = this.createCssVarsMapsInternal();
        this.styleChunk = styleChunk;
        this.setState({varsMap});
    }
    /**
     * @returns {Array<Object>}
     * @access protected
     */
    createCssVarDefinitions() {
        return DefaultStyleCustomizatorForm.getConfigurableVarsList(null, this.props.checkIsChunkActive);
    }
    /**
     * @param {DefaultStyleCustomizatorFormProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.stylesStateId !== this.props.stylesStateId ||
            props.styleClasses !== this.props.styleClasses) {
            const [varsMap, styleChunk] = this.createCssVarsMapsInternal();
            if (this.isSpecialRootStyle || JSON.stringify(varsMap) !== JSON.stringify(this.state.varsMap)) {
                this.styleChunk = styleChunk;
                this.setState({varsMap});
            }
        }
    }
    /**
     * @access protected
     */
    render() {
        return <div class="form-horizontal has-visual-style-widgets tight pt-1 pl-2">{
            this.cssVarDefs.map(def =>
                renderVarWidget(this, def)
            )
        }</div>;
    }
    /**
     * @returns {[CssVarsMap, StyleChunk|null]}
     */
    createCssVarsMapsInternal() {
        const [scopeKind, scopeSpecifier, layer] = this.styleSelector;
        return doCreateCssVarsMap(
            this.cssVarDefs,
            scopeKind,
            scopeSpecifier,
            layer
        );
    }
}

/**
 * @param {Array<StyleChunk>|null} styleChunks
 * @param {(chunk: StyleChunk) => boolean} checkIsChunkActive
 * @returns {Array<VisualStylesFormVarDefinition>}
 */
DefaultStyleCustomizatorForm.getConfigurableVarsList = (styleChunks, checkIsChunkActive) => {
    const enabled = styleChunks || (getAllCustomClassChunks().filter(checkIsChunkActive));
    const withRules = enabled.filter(c => c.data?.customizationSettings?.varDefs.length > 0);
    return withRules.map(c => c.data?.customizationSettings?.varDefs).flat();
};

/**
 * @returns {Array<StyleChunk>}
 */
function getAllCustomClassChunks() {
    const chunks = scssWizard.findStyles('custom-class', undefined, ({scope}) =>
        scope.layer === 'dev-styles'
    );
    return chunks;
}

/**
 * @typedef {{blockId: string; blockIsStoredToTreeId: 'main'|string; stylesStateId: number; checkIsChunkActive: (chunk: StyleChunk) => boolean; styleClasses: string;}} DefaultStyleCustomizatorFormProps
 */

class D2 extends DefaultStyleCustomizatorForm {
    createCssVarDefinitions() {
        return [
            {"cssProp": "background-color", "varName": "cc19_2", "cssSubSelector": null, "widgetSettings": {"label": "Background", "valueType": "color", "defaultThemeValue": "#00000000"}},
            {"cssProp": "background-image", "varName": "cc19_1", "cssSubSelector": null, "widgetSettings": {"label": "Bacground image", "valueType": "backgroundImage"}},
            {"cssProp": "background-size", "varName": "cc19_8", "cssSubSelector": null, "widgetSettings": {"label": "Background size", "options": [{"label": "Cover", "value": "cover"}, {"label": "Contain", "value": "contain"}, {"label": "Auto", "value": "auto"}, {"label": "100%", "value": "100%"}], "valueType": "option", "defaultThemeValue": "cover"}},
            {"cssProp": "background-position-x", "varName": "cc19_9", "cssSubSelector": null, "widgetSettings": {"label": "Background position ↔", "options": [{"label": "Left", "value": "left"}, {"label": "Center", "value": "center"}, {"label": "Right", "value": "right"}], "valueType": "option", "defaultThemeValue": "left"}},
            {"cssProp": "background-position-y", "varName": "cc19_10", "cssSubSelector": null, "widgetSettings": {"label": "Background position ↕", "options": [{"label": "Top", "value": "top"}, {"label": "Center", "value": "center"}, {"label": "Bottom", "value": "bottom"}], "valueType": "option", "defaultThemeValue": "top"}},
            {"cssProp": "padding-top", "varName": "cc19_11", "cssSubSelector": null, "widgetSettings": {"label": "Padding top", "valueType": "length", "defaultThemeValue": "4rem"}},
            {"cssProp": "padding-bottom", "varName": "cc19_12", "cssSubSelector": null, "widgetSettings": {"label": "Padding bottom", "valueType": "length", "defaultThemeValue": "4rem"}}
        ];
    }
}

export default DefaultStyleCustomizatorForm;
export {getAllCustomClassChunks, D2};
