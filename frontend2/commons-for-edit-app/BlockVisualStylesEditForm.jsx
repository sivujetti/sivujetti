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
    createBlockTreeClearStyleGroupOpArgs,
    createCssVarsMaps,
    createNormalizedDefs,
    createPaddingVarDefs,
    createVarInputToScssCodeAuto,
    createVarsMapAuto,
    doCreateCssVarsMaps,
    getValidDefs,
} from './BlockVisualStylesEditFormFuncs.js';

class BlockVisualStylesEditForm extends preact.Component {
    // cssVarDefs;
    // userStyleRefs;
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
        const [scopes, styleRefs] = this.createCssVarsMapsInternal(this.props);
        this.userStyleRefs = styleRefs;
        this.setState({styleScopes: scopes, curScreenSizeTabIdx: 0});
    }
    /**
     * @param {BlockStylesEditFormProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.stateId !== this.props.stateId || props.blockStyleGroup !== this.props.blockStyleGroup) {
            const [scopes, styleRefs] = this.createCssVarsMapsInternal(props);
            if (JSON.stringify(scopes) !== JSON.stringify(this.state.styleScopes)) {
                this.userStyleRefs = styleRefs;
                this.setState({styleScopes: scopes});
            }
        }
    }
    /**
     * @access protected
     */
    render(_, {styleScopes, curScreenSizeTabIdx}) {
        const selectedScreenSizeVars = styleScopes[curScreenSizeTabIdx] || {};
        const content = <div class="form-horizontal has-visual-style-widgets tight pt-1 pl-2">{
            this.cssVarDefs.map(def =>
                this.renderVarWidget(def, selectedScreenSizeVars, this.varInputToScssCodeFn)
            )
        }</div>;
        const chunks = this.userStyleRefs;
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
        const {valueType, renderer, label, inputId, initialUnit, defaultThemeValue} = widgetSettings;
        const commonProps = {
            onValueChanged: newValAsString => this.handleVisualVarChanged(newValAsString, varName, varInputToScssCode),
            labelTranslated: __(label),
            isClearable: !this.isSpecialRootVarsStyle && !!selectedScreenSizeVars[varName],
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
     * @param {String|Event} input
     * @param {String} varName
     * @param {translateVarInputToScssCodeTemplateFn} varInputToScssCode
     * @access protected
     */
    handleVisualVarChanged(input, varName, varInputToScssCode) {
        const val = input instanceof Event ? input.target.value : input;
        if (!this.props.blockStyleGroup) {
            const updatedAll = this.doHandleValChanged(val, varName, varInputToScssCode);
            api.saveButton.getInstance().pushOp('stylesBundle', updatedAll);
            return;
        }

        const clearStyleGroupOpArgs = createBlockTreeClearStyleGroupOpArgs(this.props.blockId);
        const updatedAll = this.doHandleVarOfOptimizedChunkChanged(val, varName, varInputToScssCode);
        if (updatedAll)
            api.saveButton.getInstance().pushOpGroup(
                clearStyleGroupOpArgs,
                ['stylesBundle', updatedAll]
            );
        else {
            // style group had only single var, which was then removed -> do not
            // add new (empty) style chunk, and leave current styles untouched
            api.saveButton.getInstance().pushOp(...clearStyleGroupOpArgs);
        }
    }
    /**
     * @param {String|Event} input
     * @param {String} varName
     * @param {translateVarInputToScssCodeTemplateFn} varInputToScssCode
     * @access protected
     */
    handleVisualVarChangedFast(val, varName, varInputToScssCode) {
        const codeTemplate = varInputToScssCode(varName, val);
        const asArr = Array.isArray(codeTemplate) ? codeTemplate : codeTemplate.split('\n');
        const isSingleLineDecl = asArr[0].at(-1) === ';';
        const [blockId, blockScope] = !this.isSpecialRootVarsStyle
            ? [this.props.blockId, 'single-block']
            : ['',                 'none'];
        const rootSelector = createSelector(blockId, blockScope);
        const lines = isSingleLineDecl
            ? [`${rootSelector} {`, ...asArr, '}']
            : [
                rootSelector, // asArr[0] already contains '{'
                ...asArr,
                // asArr.at(-1) already contains '}'
            ];
        const css = lines.map(l => l.replace('%s', val)).join('');
        api.webPagePreview.updateCssFast(blockId, css);
    }
    /**
     * @param {String|null} val
     * @param {String} varName
     * @param {translateVarInputToScssCodeTemplateFn} varInputToScssCode
     * @returns {StylesBundleWithId}
     * @access private
     */
    doHandleValChanged(val, varName, varInputToScssCode) {
        const {styleScopes, curScreenSizeTabIdx} = this.state;
        const curChunk = this.userStyleRefs[curScreenSizeTabIdx];
        const newValIsNotEmpty = val?.trim().length > 0;
        const valNorm = newValIsNotEmpty ? val : '"dummy"';
        const mediaScopeId = mediaScopes[curScreenSizeTabIdx];
        const codeTemplate = varInputToScssCode(varName, val);

        if (!curChunk) {
            return scssWizard.addNewUniqueScopeChunkAndReturnAllRecompiled(
                codeTemplate,
                valNorm,
                this.props.blockId,
                mediaScopeId,
            );
        } else {
            const selectedScreenSizeVars = styleScopes[curScreenSizeTabIdx] || {};
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
     * @param {String|null} val
     * @param {String} varName
     * @param {translateVarInputToScssCodeTemplateFn} varInputToScssCode
     * @returns {StylesBundleWithId}
     * @access private
     */
    doHandleVarOfOptimizedChunkChanged(val, varName, varInputToScssCode) {
        const {styleScopes, curScreenSizeTabIdx} = this.state;
        const classChunk = this.userStyleRefs[curScreenSizeTabIdx];
        const newValIsNotEmpty = val?.trim().length > 0;
        const valNorm = newValIsNotEmpty ? val : '"dummy"';
        const mediaScopeId = mediaScopes[curScreenSizeTabIdx];
        const codeTemplate = varInputToScssCode(varName, val);

        const selectedScreenSizeVars = styleScopes[curScreenSizeTabIdx] || {};
        const hasVarValPreviously = !!selectedScreenSizeVars[varName];
        return scssWizard.addNewUniqueScopeChunkFromExistingClassScopeChunkAndReturnAllRecompiled(
            hasVarValPreviously ? newValIsNotEmpty ? 'update' : 'delete' : 'add',
            codeTemplate,
            valNorm,
            classChunk,
            this.props.blockId,
            mediaScopeId,
        );
    }
    /**
     * @param {BlockStylesEditFormProps} props
     * @returns {[Array<CssVarsMap>, Array<StyleChunk|null>]}
     */
    createCssVarsMapsInternal(props) {
        const [scopeKind, scopeId, layer] = (function (self) {
            if (self.isSpecialRootVarsStyle)
                return ['none',         '',                    'base-styles'];
            if (!props.blockStyleGroup)
                return ['single-block', props.blockId,         undefined];
            else
                return ['class',        props.blockStyleGroup, undefined];
        })(this);
        return doCreateCssVarsMaps(
            this.cssVarDefs,
            scopeKind,
            scopeId,
            layer
        );
    }
}

export default BlockVisualStylesEditForm;
export {
    createBlockTreeClearStyleGroupOpArgs,
    createCssVarsMaps,
    createPaddingVarDefs,
};
