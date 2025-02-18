import {__, api, scssWizard} from '../edit-app-singletons.js';
import {createSelector} from '../ScssWizardFuncs.js';
import BackgroundImageValueInput from './BackgroundImageValueInput.jsx';
import ColorValueInput from './ColorValueInput.jsx';
import {
    createNormalizedDefs,
    createVarInputToScssCodeAuto,
    doCreateCssVarsMap,
    getValidDefs,
} from './DefaultStyleCustomizatorFormFuncs.js';
import GridColumnsValueInput from './GridColumnsValueInput.jsx';
import LengthValueInput from './LengthValueInput.jsx';
import OptionValueInput from './OptionValueInput.jsx';

/** @extends {preact.Component<DefaultStyleCustomizatorFormProps, any>} */
class DefaultStyleCustomizatorForm extends preact.Component {
    /**
     * @access protected
     */
    constructor(props) {
        super(props);
        this.isSpecialRootStyle = props.blockId === 'j-_body_';
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
        const [varsMap, styleChunk] = this.createCssVarsMapsInternal(this.props);
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
            const [varsMap, styleChunk] = this.createCssVarsMapsInternal(props);
            if (this.isSpecialRootStyle || JSON.stringify(varsMap) !== JSON.stringify(this.state.varsMap)) {
                this.styleChunk = styleChunk;
                this.setState({varsMap});
            }
        }
    }
    /**
     * @access protected
     */
    render(_, {varsMap}) {
        return <div class="form-horizontal has-visual-style-widgets tight pt-1 pl-2">{
            this.cssVarDefs.map(def =>
                this.renderVarWidget(def, varsMap, this.varInputToScssCodeFn)
            )
        }</div>;
    }
    /**
     * @param {VisualStylesFormVarDefinition} def
     * @param {CssVarsMap} vars
     * @param {translateVarInputToScssCodeTemplateFn} varInputToScssCode
     * @returns {preact.ComponentChildren}
     * @access protected
     */
    renderVarWidget(def, vars, varInputToScssCode) {
        const {varName, widgetSettings} = def;
        if (!widgetSettings)
            return null;
        const {valueType, renderer, label, initialUnit, defaultThemeValue} = widgetSettings;
        const commonProps = {
            onValueChanged: newValAsString => this.handleVisualVarChanged(newValAsString, varName, varInputToScssCode),
            labelTranslated: __(label),
            isClearable: !this.isSpecialRootStyle && !!vars[varName],
            inputId: varName,
            defaultThemeValue,
        };
        if (valueType === 'backgroundImage' || renderer === BackgroundImageValueInput)
            return <BackgroundImageValueInput
                value={ null }
                valueAsString={ BackgroundImageValueInput.valueFromInput(vars[varName] || 'initial').src }
                { ...commonProps }/>;
        else if (valueType === 'color' || renderer === ColorValueInput)
            return <ColorValueInput
                value={ null }
                valueAsString={ vars[varName] || null }
                onValueChangedFast={ newValAsString => this.handleVisualVarChangedFast(newValAsString, varName, varInputToScssCode) }
                { ...commonProps }/>;
        else if (valueType === 'gridColumns' || renderer === GridColumnsValueInput)
            return <GridColumnsValueInput
                value={ null }
                valueAsString={ GridColumnsValueInput.valueFromInput(vars[varName] || null).decl }
                { ...commonProps }/>;
        else if (valueType === 'length' || renderer === LengthValueInput)
            return <LengthValueInput
                value={ LengthValueInput.valueFromInput(vars[varName] || 'initial', initialUnit || defaultThemeValue?.unit || undefined) }
                { ...commonProps }/>;
        else if (valueType === 'option' || renderer === OptionValueInput)
            return <OptionValueInput
                value={ OptionValueInput.valueFromInput(vars[varName] || null, initialUnit) }
                options={ widgetSettings.options }
                { ...commonProps }/>;
    }
    /**
     * @param {string|Event} input
     * @param {string} varName
     * @param {translateVarInputToScssCodeTemplateFn} varInputToScssCode
     * @access protected
     */
    handleVisualVarChanged(input, varName, varInputToScssCode) {
        const val = input instanceof Event ? input.target.value : input;
        const updatedAll = this.doHandleValChanged(val, varName, varInputToScssCode);
        api.saveButton.getInstance().pushOp('stylesBundle', updatedAll);
    }
    /**
     * @param {string} val
     * @param {string} varName
     * @param {translateVarInputToScssCodeTemplateFn} varInputToScssCode
     * @access protected
     */
    handleVisualVarChangedFast(val, varName, varInputToScssCode) {
        const codeTemplate = varInputToScssCode(varName, val);
        const lines = Array.isArray(codeTemplate) ? codeTemplate : codeTemplate.split('\n');
        const isSingleLineDecl = lines[0].at(-1) === ';';
        const [scopeKind, scopeSpecifier, _layer] = this.createFindStyleArgs();
        const rootSelector = createSelector(scopeSpecifier, scopeKind);
        const linesFull = isSingleLineDecl
            ? [
                rootSelector,
                ' {',
                ...lines,
                '}'
            ]
            : [
                rootSelector,
                // asArr[0] already contains ' {'
                ...lines.map((line, i) => {
                    if (i > 0) return line;
                    return !line.startsWith('&')
                        ? ` ${line}`         // Example 'ul li a {' -> ' ul li a {'
                        : line.substring(1); // Example '&:hover {' -> ':hover {'
                }),
                // asArr.at(-1) already contains '}'
            ];
        const css = linesFull.map(l => l.replace('%s', val)).join('');
        api.webPagePreview.updateCssFast(scopeSpecifier, css);
    }
    /**
     * @param {string|null} val
     * @param {string} varName
     * @param {translateVarInputToScssCodeTemplateFn} varInputToScssCode
     * @returns {StylesBundleWithId}
     * @access private
     */
    doHandleValChanged(val, varName, varInputToScssCode) {
        const newValIsNotEmpty = val?.trim().length > 0;
        const valNorm = newValIsNotEmpty ? val : '"dummy"';
        const codeTemplate = varInputToScssCode(varName, val);

        if (!this.styleChunk) {
            return scssWizard.addNewUniqueScopeChunkAndReturnAllRecompiled(
                codeTemplate,
                valNorm,
                this.props.blockId,
                this.props.blockIsStoredToTreeId || 'main',
            );
        } else {
            const hasVarValPreviously = !!this.state.varsMap[varName];
            if (!newValIsNotEmpty && hasVarValPreviously)
                return scssWizard.deleteScssCodeFromExistingUniqueScopeChunkAndReturnAllRecompiled(
                    codeTemplate,
                    valNorm,
                    this.styleChunk
                );
            return scssWizard.addOrUpdateScssCodeToExistingUniqueScopeChunkAndReturnAllRecompiled(
                codeTemplate,
                valNorm,
                this.styleChunk
            );
        }
    }
    /**
     * @param {DefaultStyleCustomizatorFormProps} props
     * @returns {[CssVarsMap, StyleChunk|null]}
     */
    createCssVarsMapsInternal(props) {
        const [scopeKind, scopeSpecifier, layer] = this.createFindStyleArgs(props);
        return doCreateCssVarsMap(
            this.cssVarDefs,
            scopeKind,
            scopeSpecifier,
            layer
        );
    }
    /**
     * @param {DefaultStyleCustomizatorFormProps} props
     * @returns {[styleScopeKind, string|undefined, stylesLayer|undefined]}
     * @access private
     */
    createFindStyleArgs(props = this.props) {
        return !this.isSpecialRootStyle
            ? ['single-block', props.blockId, undefined]
            : ['base-vars',    undefined,    'base-styles'];
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
       
export default DefaultStyleCustomizatorForm;
export {getAllCustomClassChunks};
