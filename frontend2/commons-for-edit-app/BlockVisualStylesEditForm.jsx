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
import {createCssDeclExtractor} from './ScssWizardFuncs.js';
import ScreenSizesVerticalTabs from './ScreenSizesVerticalTabs.jsx';

const WidgetClses = {
    'backgroundImage': BackgroundImageValueInput,
    'color': ColorValueInput,
    'length': LengthValueInput,
    'option': OptionValueInput,
};

class BlockVisualStylesEditForm extends preact.Component {
    // cssVarDefs;
    // userStyleRefs;
    // varInputToScssChunkFn;
    /**
     * @param {BlockStylesEditFormProps} props
     * @access protected
     */
    constructor(props) {
        super(props);
        this.cssVarDefs = createNormalizedDefs(getValidDefs(this.createCssVarDefinitions()));
        this.varInputToScssChunkFn = this.createVarInputToScssChunkFn(this.cssVarDefs);
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
    createVarInputToScssChunkFn(cssVarDefs) {
        return createVarInputToScssChunkAuto(cssVarDefs);
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const [scopes, styleRefs] = createCssVarsMaps(this.props.blockId, this.cssVarDefs);
        this.userStyleRefs = styleRefs;
        this.setState({styleScopes: scopes, curScreenSizeTabIdx: 0});
    }
    /**
     * @param {BlockStylesEditFormProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.stateId !== this.props.stateId) {
            const [scopes, styleRefs] = createCssVarsMaps(props.blockId, this.cssVarDefs);
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
        return <ScreenSizesVerticalTabs
            curTabIdx={ curScreenSizeTabIdx }
            setCurTabIdx={ to => this.setState({curScreenSizeTabIdx: to}) }>
            <div class="form-horizontal has-visual-style-widgets tight pt-1 pl-2">
                { this.cssVarDefs.map(def =>
                    this.renderVarWidget(def, selectedScreenSizeVars, this.varInputToScssChunkFn)
                ) }
            </div>
        </ScreenSizesVerticalTabs>;
    }
    /**
     * @param {VisualStylesFormVarDefinition} def
     * @param {CssVarsMap} selectedScreenSizeVars
     * @param {translateVarInputToScssCodeTemplateFn} varInputToScssChunk
     * @access protected
     */
    renderVarWidget(def, selectedScreenSizeVars, varInputToScssChunk) {
        const {varName, widgetSettings} = def;
        if (!widgetSettings)
            return null;
        const {valueType, renderer, label, inputId, initialUnit, defaultThemeValue} = widgetSettings;
        const commonProps = {
            onValueChanged: newValAsString => this.handleVisualVarChanged(newValAsString, varName, varInputToScssChunk),
            labelTranslated: __(label),
            isClearable: !!selectedScreenSizeVars[varName],
            inputId,
            defaultThemeValue,
        };
        if (valueType === 'color' || renderer === ColorValueInput)
            return <ColorValueInput
                value={ null }
                valueAsString={ selectedScreenSizeVars[varName] || null }
                onValueChangedFast={ newValAsString => this.handleVisualVarChangedFast(newValAsString, varName, varInputToScssChunk) }
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
     * @param {translateVarInputToScssCodeTemplateFn} varInputToScssChunk
     * @access protected
     */
    handleVisualVarChanged(input, varName, varInputToScssChunk) {
        const val = input instanceof Event ? input.target.value : input;
        const updatedAll = this.doHandleVisualVarChanged(val, varName, varInputToScssChunk);
        api.saveButton.getInstance().pushOp('stylesBundle', updatedAll);
    }
    /**
     * @param {String|Event} input
     * @param {String} varName
     * @param {translateVarInputToScssCodeTemplateFn} varInputToScssChunk
     * @access protected
     */
    handleVisualVarChangedFast(val, varName, varInputToScssChunk) {
        const {blockId} = this.props;
        const chunk = varInputToScssChunk(varName, val);
        api.webPagePreview.updateCssFast(blockId, chunk);
    }
    /**
     * @param {String|null} val
     * @param {String} varName
     * @param {translateVarInputToScssCodeTemplateFn} varInputToScssChunk
     * @returns {StylesBundleWithId}
     * @access private
     */
    doHandleVisualVarChanged(val, varName, varInputToScssChunk) {
        const {styleScopes, curScreenSizeTabIdx} = this.state;
        const curChunk = this.userStyleRefs[curScreenSizeTabIdx];
        const newValIsNotEmpty = val?.trim().length > 0;
        const valNorm = newValIsNotEmpty ? val : '"dummy"';
        const mediaScopeId = mediaScopes[curScreenSizeTabIdx];
        const codeTemplate = varInputToScssChunk(varName);

        if (!curChunk) {
            return scssWizard.addNewUniqueScopeChunkAndReturnAllRecompiled(
                codeTemplate,
                valNorm,
                this.props.blockId,
                mediaScopeId
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
}

/**
 * @param {String} blockId
 * @param {Array<VisualStylesFormVarDefinition>} cssVarDefs
 * @returns {[Array<CssVarsMap>, Array<StyleChunk|null>]}
 */
function createCssVarsMaps(blockId, cssVarDefs) {
    return mediaScopes.reduce((out, scopeId) => {
        const styleRef = scssWizard.findStyle('single-block', blockId, scopeId);
        const styleVarsForThisMediaScope = createVarsMapAuto(cssVarDefs, styleRef?.scss || null, scopeId);
        out[0].push(styleVarsForThisMediaScope);
        out[1].push(styleRef);
        return out;
    }, [[], []]);
}

/**
 * @param {String} blockId
 * @param {Array<VisualStylesFormVarDefinition>} cssVarDefs
 * @returns {[Array<CssVarsMap>, todo]}
 */
function createVarsMapAuto(cssVarDefs, scss, _mediaScopeId) {
    /* Create map for non-existing chunk. Example: {
        display: null,
        aspectRatio: null,
        minHeight: null,
        etc ...
    } */
    if (!scss) return cssVarDefs.reduce((map, def) =>
        ({...map, [def.varName]: null}),
    {});

    /* Create map for existing chunk. Example: {
        display: extr.extractVal('display'),
        aspectRatio: extr.extractVal('aspect-ratio', '>img'),
        minHeight: extr.extractVal('min-height', '>img'),
        etc ...
    } */
    const extr = createCssDeclExtractor(scss);
    return cssVarDefs.reduce((map, {varName, cssProp, cssSubSelector}) =>
        ({...map, [varName]: extr.extractVal(cssProp, cssSubSelector || undefined)}),
    {});
}

/**
 * Returns a function that translates varName+val to css declaration or block.
 *
 * @param {Array<VisualStylesFormVarDefinition>} cssVarDefs
 * @returns {translateVarInputToScssCodeTemplateFn}
 */
function createVarInputToScssChunkAuto(cssVarDefs) {
    /**
     * @param {String} varName
     * @param {String} _val
     * @returns {scssCodeInput}
     */
    return (varName, _val) => {
        const def = cssVarDefs.find(r => r.varName === varName);
        if (!def) throw new Error(`Unknown property ${varName}`);

        return !def.cssSubSelector
            // Example: 'display: ${val};'
            ? `${def.cssProp}: %s;`
            // Example: '>img {\n  aspect-ratio: ${val};\n}'
            : [
                `${def.cssSubSelector} {`,
                `  ${def.cssProp}: %s;`,
                `}`,
            ];
    };
}

/**
 * @param {Array<any>} input
 * @returns {Array<VisualStylesFormVarDefinition>}
 * @throws {Error}
 */
function getValidDefs(input) {
    return input.map(def => {
        if (typeof def.varName !== 'string')
            throw new Error('def.varName must be string');
        if (def.varName === '__proto__')
            throw new Error('def.varName is not valid');
        if (typeof def.cssProp !== 'string')
            throw new Error('def.cssProp must be string');
        if (typeof def.widgetSettings?.valueType !== 'string')
            throw new Error('def.widgetSettings.valueType is required');
        if (!WidgetClses[def.widgetSettings.valueType])
            throw new Error('Unkown def.widgetSettings.valueType "' + def.widgetSettings.valueType +
                '". Supported values are ' + Object.keys(WidgetClses).join(', '));
        return def;
    });
}

/**
 * Replaces validDefs.*.widgetSettings.defaultValue string -> Object
 * @param {Array<VisualStylesFormVarDefinition>} validDefs
 * @returns {Array<VisualStylesFormVarDefinition>}
 */
function createNormalizedDefs(validDefs) {
    return validDefs.map(itm => typeof itm.widgetSettings.defaultThemeValue !== 'string'
        ? itm
        : {
            ...itm,
            widgetSettings: {
                ...itm.widgetSettings,
                defaultThemeValue: WidgetClses[itm.widgetSettings.valueType].valueFromInput(itm.widgetSettings.defaultThemeValue)
            }
        }
    );
}

/**
 * @param {String} prefix Examples: 'text', 'button'
 * @returns {Array<VisualStylesFormVarDefinition>}
 */
function createPaddingVarDefs(prefix) {
    return [
        {
            varName: 'paddingTop',
            cssProp: 'padding-top',
            cssSubSelector: null,
            widgetSettings: {
                valueType: 'length',
                label: 'Padding top',
                inputId: `${prefix}PaddingTop`,
            },
        },
        {
            varName: 'paddingRight',
            cssProp: 'padding-right',
            cssSubSelector: null,
            widgetSettings: {
                valueType: 'length',
                label: 'Padding right',
                inputId: `${prefix}PaddingRight`,
            },
        },
        {
            varName: 'paddingBottom',
            cssProp: 'padding-bottom',
            cssSubSelector: null,
            widgetSettings: {
                valueType: 'length',
                label: 'Padding bottom',
                inputId: `${prefix}PaddingBottom`,
            },
        },
        {
            varName: 'paddingLeft',
            cssProp: 'padding-left',
            cssSubSelector: null,
            widgetSettings: {
                valueType: 'length',
                label: 'Padding left',
                inputId: `${prefix}PaddingLeft`,
            },
        }
    ];
}

export default BlockVisualStylesEditForm;
export {
    createCssVarsMaps,
    createPaddingVarDefs,
};
