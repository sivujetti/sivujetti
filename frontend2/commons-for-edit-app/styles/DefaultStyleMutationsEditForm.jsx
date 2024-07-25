import {mediaScopes} from '../../shared-inline.js';
import {__, api, scssWizard} from '../edit-app-singletons.js';
import {createSelector} from '../ScssWizardFuncs.js';
import {
    createNormalizedDefs,
    createVarInputToScssCodeAuto,
    doCreateCssVarsMaps,
    getValidDefs,
} from '../BlockVisualStylesEditFormFuncs.js';
import BackgroundImageValueInput from './BackgroundImageValueInput.jsx';
import ColorValueInput from './ColorValueInput.jsx';
import LengthValueInput from './LengthValueInput.jsx';
import OptionValueInput from './OptionValueInput.jsx';

/** @extends {preact.Component<DefaultStyleMutationsEditFormProps, any>} */
class DefaultStyleMutationsEditForm extends preact.Component {
    // cssVarDefs;
    // styleChunks;
    // varInputToScssCodeFn;
    /**
     * @param {DefaultStyleMutationsEditFormProps} props
     * @access protected
     */
    constructor(props) {
        super(props);

        const enabled = getAllChunks().filter(props.checkIsChunkActive);
        const withRules = enabled.filter(c => c.data?.mutationRules?.varDefs.length > 0);
        const reduced = withRules.map(c => c.data?.mutationRules?.varDefs).flat();

        this.cssVarDefs = createNormalizedDefs(getValidDefs(reduced));
        this.varInputToScssCodeFn = createVarInputToScssCodeAuto(this.cssVarDefs);
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const [scopes, styleChunks] = this.createCssVarsMapsInternal(this.props);
        this.styleChunks = styleChunks;
        this.setState({styleScreens: scopes, curScreenSizeTabIdx: 0});
    }
    /**
     * @param {DefaultStyleMutationsEditFormProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.stylesStateId !== this.props.stylesStateId ||
            props.styleClasses !== this.props.styleClasses) {
            const [scopes, styleChunks] = this.createCssVarsMapsInternal(props);
            if (JSON.stringify(scopes) !== JSON.stringify(this.state.styleScreens)) {
                this.styleChunks = styleChunks;
                this.setState({styleScreens: scopes});
            }
        }
    }
    /**
     * @access protected
     */
    render(_, {styleScreens, curScreenSizeTabIdx}) {
        const selectedScreenSizeVars = styleScreens[curScreenSizeTabIdx] || {};
        return <div class="form-horizontal has-visual-style-widgets tight pt-1 pl-2">{
            this.cssVarDefs.map(def =>
                this.renderVarWidget(def, selectedScreenSizeVars, this.varInputToScssCodeFn)
            )
        }</div>;
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
        const {valueType, renderer, label, inputId, initialUnit, defaultThemeValue} = widgetSettings;
        const commonProps = {
            onValueChanged: newValAsString => this.handleVisualVarChanged(newValAsString, varName, varInputToScssCode),
            labelTranslated: __(label),
            isClearable: !!selectedScreenSizeVars[varName],
            inputId,
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
     * @param {string|Event} input
     * @param {string} varName
     * @param {translateVarInputToScssCodeTemplateFn} varInputToScssCode
     * @access protected
     */
    handleVisualVarChangedFast(val, varName, varInputToScssCode) {
        const codeTemplate = varInputToScssCode(varName, val);
        const lines = Array.isArray(codeTemplate) ? codeTemplate : codeTemplate.split('\n');
        const isSingleLineDecl = lines[0].at(-1) === ';';
        const rootSelector = createSelector(this.props.blockId, 'single-block');
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
        api.webPagePreview.updateCssFast(this.props.blockId, css);
    }
    /**
     * @param {string|null} val
     * @param {string} varName
     * @param {translateVarInputToScssCodeTemplateFn} varInputToScssCode
     * @returns {StylesBundleWithId}
     * @access private
     */
    doHandleValChanged(val, varName, varInputToScssCode) {
        const {styleScreens, curScreenSizeTabIdx} = this.state;
        const curChunk = this.styleChunks[curScreenSizeTabIdx];
        const newValIsNotEmpty = val?.trim().length > 0;
        const valNorm = newValIsNotEmpty ? val : '"dummy"';
        const mediaScopeId = mediaScopes[curScreenSizeTabIdx];
        const codeTemplate = varInputToScssCode(varName, val);

        if (!curChunk) {
            return scssWizard.addNewUniqueScopeChunkAndReturnAllRecompiled(
                codeTemplate,
                valNorm,
                this.props.blockId,
                this.props.blockIsStoredToTreeId,
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
     * @param {DefaultStyleMutationsEditFormProps} props
     * @returns {[Array<CssVarsMap>, Array<StyleChunk|null>]}
     */
    createCssVarsMapsInternal(props) {
        return doCreateCssVarsMaps(
            this.cssVarDefs,
            'single-block',
            props.blockId,
            undefined
        );
    }
}

/**
 * @returns {Array<StyleChunk>}
 */
function getAllChunks() {
    const chunks = scssWizard.findStyles('custom-class', undefined, ({scope}) =>
        scope.layer === 'dev-styles'
    );
    return chunks;
}

/**
 * @typedef {{blockId: string; blockIsStoredToTreeId: 'main'|string; stylesStateId: number; checkIsChunkActive: (chunk: StyleChunk) => boolean; styleClasses: string;}} DefaultStyleMutationsEditFormProps
 */

export default DefaultStyleMutationsEditForm;
