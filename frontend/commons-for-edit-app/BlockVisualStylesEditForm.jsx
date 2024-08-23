import {mediaScopes} from '../shared-inline.js';
import BackgroundImageValueInput from './styles/BackgroundImageValueInput.jsx';
import ColorValueInput from './styles/ColorValueInput.jsx';
import LengthValueInput from './styles/LengthValueInput.jsx';
import OptionValueInput from './styles/OptionValueInput.jsx';
import {
    __,
    api,
    scssWizard,
} from './edit-app-singletons.js';
import {createSelector} from './ScssWizardFuncs.js';
import ScreenSizesVerticalTabs from './ScreenSizesVerticalTabs.jsx';
import {
    createCssVarsMaps,
    createNormalizedDefs,
    createPaddingVarDefs,
    createVarInputToScssCodeAuto,
    doCreateCssVarsMaps,
    getValidDefs,
} from './BlockVisualStylesEditFormFuncs.js';

class BlockVisualStylesEditForm extends preact.Component {
    // cssVarDefs;
    // userStyleChunks;
    // varInputToScssCodeFn;
    // isSpecialRootVarsStyle;
    /**
     * @param {BlockStylesEditFormProps} props
     * @access protected
     */
    constructor(props) {
        super(props);
        this.cssVarDefs = createNormalizedDefs(getValidDefs(this.createCssVarDefinitions()));
        this.varInputToScssCodeFn = this.createVarInputToScssCodeFn(this.cssVarDefs);
    }
    /**
     * @returns {Array<VisualStylesFormVarDefinition>}
     * @access protected
     */
    createCssVarDefinitions() {
        throw new Error('Abstract method not implemented');
    }
    /**
     * @param {Array<VisualStylesFormVarDefinition>} cssVarDefs
     * @returns {translateVarInputToScssCodeTemplateFn}
     * @access protected
     */
    createVarInputToScssCodeFn(cssVarDefs) {
        return createVarInputToScssCodeAuto(cssVarDefs);
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.isSpecialRootVarsStyle = this.props.blockId === 'j-_body_';
        const [scopes, styleChunks] = this.createCssVarsMapsInternal(this.props);
        this.userStyleChunks = styleChunks;
        this.setState({styleScreens: scopes, curScreenSizeTabIdx: 0});
    }
    /**
     * @param {BlockStylesEditFormProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.stateId !== this.props.stateId) {
            const [scopes, styleChunks] = this.createCssVarsMapsInternal(props);
            if (JSON.stringify(scopes) !== JSON.stringify(this.state.styleScreens)) {
                this.userStyleChunks = styleChunks;
                this.setState({styleScreens: scopes});
            }
        }
    }
    /**
     * @access protected
     */
    render(_, {styleScreens, curScreenSizeTabIdx}) {
        const selectedScreenSizeVars = styleScreens[curScreenSizeTabIdx] || {};
        const content = <div class="form-horizontal has-visual-style-widgets tight pt-1 pl-2">{
            this.cssVarDefs.map(def =>
                this.renderVarWidget(def, selectedScreenSizeVars, this.varInputToScssCodeFn)
            )
        }</div>;
        const chunks = this.userStyleChunks;
        return !this.isSpecialRootVarsStyle ? <ScreenSizesVerticalTabs
            populatedTabs={ chunks.map(s => !!s) }
            curTabIdx={ curScreenSizeTabIdx }
            setCurTabIdx={ to => this.setState({curScreenSizeTabIdx: to}) }>
            { content }
        </ScreenSizesVerticalTabs> : content;
    }
    /**
     * @param {VisualStylesFormVarDefinition} def
     * @param {CssVarsMap} selectedScreenSizeVars
     * @param {translateVarInputToScssCodeTemplateFn} varInputToScssCode
     * @access protected
     */
    renderVarWidget(def, selectedScreenSizeVars, varInputToScssCode) {
        const {varName, widgetSettings} = def;
        if (!widgetSettings)
            return null;
        const {valueType, renderer, label, initialUnit, defaultThemeValue} = widgetSettings;
        const commonProps = {
            onValueChanged: newValAsString => this.handleVisualVarChanged(newValAsString, varName, varInputToScssCode),
            labelTranslated: __(label),
            isClearable: !this.isSpecialRootVarsStyle && !!selectedScreenSizeVars[varName],
            inputId: varName,
            defaultThemeValue,
        };
        if (valueType === 'color' || renderer === ColorValueInput)
            return <ColorValueInput
                value={ null }
                valueAsString={ selectedScreenSizeVars[varName] || null }
                onValueChangedFast={ newValAsString => this.handleVisualVarChangedFast(newValAsString, varName, varInputToScssCode) }
                { ...commonProps }/>;
        else if (valueType === 'length' || renderer === LengthValueInput)
            return <LengthValueInput
                value={ LengthValueInput.valueFromInput(selectedScreenSizeVars[varName] || 'initial', initialUnit || defaultThemeValue?.unit || undefined) }
                { ...commonProps }/>;
        else if (valueType === 'option' || renderer === OptionValueInput)
            return <OptionValueInput
                value={ OptionValueInput.valueFromInput(selectedScreenSizeVars[varName] || null, initialUnit) }
                options={ widgetSettings.options }
                { ...commonProps }/>;
        else if (valueType === 'backgroundImage' || renderer === BackgroundImageValueInput)
            return <BackgroundImageValueInput
                value={ null }
                valueAsString={ BackgroundImageValueInput.valueFromInput(selectedScreenSizeVars[varName] || 'initial').src }
                { ...commonProps }/>;
    }
    /**
     * @param {String|Event} input
     * @param {String} varName
     * @param {translateVarInputToScssCodeTemplateFn} varInputToScssCode
     * @access protected
     */
    handleVisualVarChanged(input, varName, varInputToScssCode) {
        const val = input instanceof Event ? input.target.value : input;
        const updatedAll = this.doHandleValChanged(val, varName, varInputToScssCode);
        api.saveButton.getInstance().pushOp('stylesBundle', updatedAll);
    }
    /**
     * @param {String|Event} input
     * @param {String} varName
     * @param {translateVarInputToScssCodeTemplateFn} varInputToScssCode
     * @access protected
     */
    handleVisualVarChangedFast(val, varName, varInputToScssCode) {
        const codeTemplate = varInputToScssCode(varName, val);
        const lines = Array.isArray(codeTemplate) ? codeTemplate : codeTemplate.split('\n');
        const isSingleLineDecl = lines[0].at(-1) === ';';
        const [scopeSpecifier, scopeKind] = !this.isSpecialRootVarsStyle
            ? [this.props.blockId, 'single-block']
            : [null,               'base-vars'];
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
     * @param {String|null} val
     * @param {String} varName
     * @param {translateVarInputToScssCodeTemplateFn} varInputToScssCode
     * @returns {StylesBundleWithId}
     * @access private
     */
    doHandleValChanged(val, varName, varInputToScssCode) {
        const {styleScreens, curScreenSizeTabIdx} = this.state;
        const curChunk = this.userStyleChunks[curScreenSizeTabIdx];
        const newValIsNotEmpty = val?.trim().length > 0;
        const valNorm = newValIsNotEmpty ? val : '"dummy"';
        const mediaScopeId = mediaScopes[curScreenSizeTabIdx];
        const codeTemplate = varInputToScssCode(varName, val);

        if (!curChunk) {
            return scssWizard.addNewUniqueScopeChunkAndReturnAllRecompiled(
                codeTemplate,
                valNorm,
                this.props.blockId,
                'main',
            );
        } else {
            const selectedScreenSizeVars = styleScreens[curScreenSizeTabIdx] || {};
            const hasVarValPreviously = !!selectedScreenSizeVars[varName];
            if (!newValIsNotEmpty && hasVarValPreviously)
                return scssWizard.deleteScssCodeFromExistingUniqueScopeChunkAndReturnAllRecompiled(
                    codeTemplate,
                    valNorm,
                    curChunk,
                    mediaScopeId
                );
            return scssWizard.addOrUpdateScssCodeToExistingUniqueScopeChunkAndReturnAllRecompiled(
                codeTemplate,
                valNorm,
                curChunk,
                mediaScopeId,
            );
        }
    }
    /**
     * @param {BlockStylesEditFormProps} props
     * @returns {[Array<CssVarsMap>, Array<StyleChunk|null>]}
     */
    createCssVarsMapsInternal(props) {
        const [scopeKind, scopeSpecifier, layer] = !this.isSpecialRootVarsStyle
            ? ['single-block', props.blockId, undefined]
            : ['base-vars',    undefined,     'base-styles'];
        return doCreateCssVarsMaps(
            this.cssVarDefs,
            scopeKind,
            scopeSpecifier,
            layer
        );
    }
}

export default BlockVisualStylesEditForm;
export {
    createCssVarsMaps,
    createPaddingVarDefs,
};
