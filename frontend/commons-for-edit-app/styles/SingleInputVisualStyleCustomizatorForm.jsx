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

/** @extends {preact.Component<SingleInputVisualStyleCustomizatorFormProps, SingleInputVisualStyleCustomizatorFormState>} */
class SingleInputVisualStyleCustomizatorForm extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        /** @type {Array<VisualStylesFormVarDefinition>} */
        this.cssVarDefs = createNormalizedDefs(getValidDefs([this.props.varDef]));
        this.varInputToScssCodeFn = createVarInputToScssCodeAuto(this.cssVarDefs);
        /** @type {[styleScopeKind, string|undefined, stylesLayer|undefined]} */
        this.styleSelector = ['single-block', this.props.blockId, undefined];
        this.updateState();
    }
    /**
     * @param {SingleInputVisualStyleCustomizatorFormProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.stylesStateId !== this.props.stylesStateId)
            this.updateState();
    }
    /**
     * @access protected
     */
    render() {
        return renderVarWidget(this, this.cssVarDefs[0]);
    }
    /**
     * @access private
     */
    updateState() {
        const [varsMap, styleChunk] = doCreateCssVarsMap(this.cssVarDefs, ...this.styleSelector);
        this.styleChunk = styleChunk;
        this.setState({varsMap});
    }
}

/**
 * @param {VisualStyleCustomizatorForm} self
 * @param {VisualStylesFormVarDefinition} cssVar
 * @returns {preact.ComponentChildren}
 */
function renderVarWidget(self, {varName, widgetSettings}) {
    const vars = self.state.varsMap;
    if (!widgetSettings)
        return null;
    const {valueType, renderer, label, initialUnit, defaultThemeValue} = widgetSettings;
    const commonProps = {
        onValueChanged: newValAsString => handleVisualVarChanged(self, newValAsString, varName),
        labelTranslated: __(label),
        isClearable: !self.isSpecialRootStyle && !!vars[varName],
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
            onValueChangedFast={ newValAsString => handleVisualVarChangedFast(self, newValAsString, varName) }
            { ...commonProps }/>;
    else if (valueType === 'gridColumns' || renderer === GridColumnsValueInput)
        return <GridColumnsValueInput
            value={ null }
            valueAsString={ GridColumnsValueInput.valueFromInput(vars[varName] || null).decl }
            { ...commonProps }/>;
    else if (valueType === 'length' || renderer === LengthValueInput)
        return <LengthValueInput
            // @ts-ignore Property 'unit' does not exist on type 'string'.
            value={ LengthValueInput.valueFromInput(vars[varName] || 'initial', initialUnit || defaultThemeValue?.unit || undefined) }
            { ...commonProps }/>;
    else if (valueType === 'option' || renderer === OptionValueInput)
        return <OptionValueInput
            value={ OptionValueInput.valueFromInput(vars[varName] || null, initialUnit) }
            options={ widgetSettings.options }
            { ...commonProps }/>;
}

/**
 * @param {VisualStyleCustomizatorForm} self
 * @param {string|Event} input
 * @param {string} varName
 */
function handleVisualVarChanged(self, input, varName) {
    // @ts-ignore Property 'value' does not exist on type 'EventTarget'.
    const val = input instanceof Event ? input.target.value : input;
    const updatedAll = doHandleValChanged(self, val, varName, self.varInputToScssCodeFn);
    api.saveButton.getInstance().pushOp('stylesBundle', updatedAll);
}

/**
 * @param {VisualStyleCustomizatorForm} self
 * @param {string} val
 * @param {string} varName
 */
function handleVisualVarChangedFast({styleSelector, varInputToScssCodeFn}, val, varName) {
    const codeTemplate = varInputToScssCodeFn(varName, val);
    const lines = Array.isArray(codeTemplate) ? codeTemplate : codeTemplate.split('\n');
    const isSingleLineDecl = lines[0].at(-1) === ';';
    const [scopeKind, scopeSpecifier, _layer] = styleSelector;
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
 * @param {VisualStyleCustomizatorForm} self
 * @param {string|null} val
 * @param {string} varName
 * @param {translateVarInputToScssCodeTemplateFn} varInputToScssCode
 * @returns {StylesBundleWithId}
 */
function doHandleValChanged(self, val, varName, varInputToScssCode) {
    const newValIsNotEmpty = val?.trim().length > 0;
    const valNorm = newValIsNotEmpty ? val : '"dummy"';
    const codeTemplate = varInputToScssCode(varName, val);

    if (!self.styleChunk) {
        return scssWizard.addNewUniqueScopeChunkAndReturnAllRecompiled(
            codeTemplate,
            valNorm,
            self.props.blockId,
            self.props.blockIsStoredToTreeId || 'main',
        );
    } else {
        const hasVarValPreviously = !!self.state.varsMap[varName];
        if (!newValIsNotEmpty && hasVarValPreviously)
            return scssWizard.deleteScssCodeFromExistingUniqueScopeChunkAndReturnAllRecompiled(
                codeTemplate,
                valNorm,
                self.styleChunk
            );
        return scssWizard.addOrUpdateScssCodeToExistingUniqueScopeChunkAndReturnAllRecompiled(
            codeTemplate,
            valNorm,
            self.styleChunk
        );
    }
}

/**
 * @typedef {{
 *   varDef: VisualStylesFormVarDefinition;
 *   stylesStateId: number;
 *   blockId: string;
 *   blockIsStoredToTreeId: 'main'|string;
 * }} SingleInputVisualStyleCustomizatorFormProps
 */

/**
 * @typedef {{
 *   varsMap: CssVarsMap;
 * }} SingleInputVisualStyleCustomizatorFormState
 */

/**
 * @typedef {SingleInputVisualStyleCustomizatorForm|any} VisualStyleCustomizatorForm
 */

export default SingleInputVisualStyleCustomizatorForm;
export {
    doHandleValChanged,
    handleVisualVarChangedFast,
    renderVarWidget,
};