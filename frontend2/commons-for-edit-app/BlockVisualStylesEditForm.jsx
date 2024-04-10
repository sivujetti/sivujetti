import {mediaScopes} from '../shared-inline.js';
import ColorValueInput from './styles/ColorValueInput.jsx';
import LengthValueInput from './styles/LengthValueInput.jsx';
import OptionValueInput from './styles/OptionValueInput.jsx';
import {
    __,
    api,
    scssWizard,
} from './edit-app-singletons.js';
import {createCssDeclExtractor} from './ScssWizardFuncs.js';

class BlockVisualStylesEditForm extends preact.Component {
    // cssVarDefs;
    // userStyleRefs;
    /**
     * @param {BlockStylesEditFormProps} props
     * @access protected
     */
    constructor(props) {
        super(props);
        this.cssVarDefs = getValidDefs(this.createCssVarDefinitions());
    }
    /**
     * @returns {Array<VisualStylesFormVarDefinition>}
     * @access protected
     */
    createCssVarDefinitions() {
        throw new Error('Abstract method not implemented');
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const [states, styleRefs] = createCssVarsMaps(this.props.blockId, this.cssVarDefs);
        this.userStyleRefs = styleRefs;
        this.setState({styleScopes: states, curScreenSizeTabIdx: 0});
    }
    /**
     * @param {BlockStylesEditFormProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.stateId !== this.props.stateId) {
            const [states, styleRefs] = createCssVarsMaps(props.blockId, this.cssVarDefs);
            if (JSON.stringify(states) !== JSON.stringify(this.state.styleScopes)) {
                this.userStyleRefs = styleRefs;
                this.setState({styleScopes: states});
            }
        }
    }
    /**
     * @param {String|Event} input
     * @param {String} varName
     * @param {(varName: String, value: String): String} varInputToScssChunk
     * @access protected
     */
    renderVarWidget(def, screenStyles, varInputToDecl) {
        const {varName, widgetSettings} = def;
        if (!widgetSettings)
            return null;
        const {renderer, label, inputId, initialUnit, defaultThemeValue} = widgetSettings;
        const commonProps = {
            onValueChanged: newValAsString => this.handleVisualVarChanged(newValAsString, varName, varInputToDecl),
            labelTranslated: __(label),
            isClearable: !!screenStyles[varName],
            inputId,
            defaultThemeValue,
        };
        if (renderer === ColorValueInput)
            return <ColorValueInput
                value={ null }
                valueAsString={ screenStyles[varName] || null }
                onValueChangedFast={ newValAsString => this.handleVisualVarChangedFast(newValAsString, varName, varInputToDecl) }
                { ...commonProps }/>;
        else if (renderer === LengthValueInput)
            return <LengthValueInput
                value={ LengthValueInput.valueFromInput(screenStyles[varName] || 'initial') }
                { ...commonProps }/>;
        else if (renderer === OptionValueInput)
            return <OptionValueInput
                value={ OptionValueInput.valueFromInput(screenStyles[varName] || '-', initialUnit) }
                options={ widgetSettings.options }
                { ...commonProps }/>;
    }
    /**
     * @param {String|Event} input
     * @param {String} varName
     * @param {(varName: String, value: String): String} varInputToScssChunk
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
     * @param {(varName: String, value: String): String} varInputToScssChunk
     * @access protected
     */
    handleVisualVarChangedFast(val, varName, varInputToScssChunk) {
        const {blockId} = this.props;
        const chunk = varInputToScssChunk(varName, val);
        if (chunk.indexOf('\n') > -1) {
            window.console.debug('todo');
            return;
        }
        api.webPagePreview.updateCssFast(blockId, chunk);
    }
    /**
     * @param {String|null} val
     * @param {String} varName
     * @param {(varName: String, value: String): String} varInputToScssChunk
     * @returns {StylesBundleWithId}
     * @access private
     */
    doHandleVisualVarChanged(val, varName, varInputToScssChunk) {
        const {styleScopes, curScreenSizeTabIdx} = this.state;
        const selectedScreenSizeStyles = styleScopes[curScreenSizeTabIdx];
        const current = selectedScreenSizeStyles || {};
        const styleRef = this.userStyleRefs[curScreenSizeTabIdx];
        const newValIsNotEmpty = val?.trim().length > 0;
        const upd = varInputToScssChunk(varName, newValIsNotEmpty ? val : '"dummy"');
        const mediaScope = mediaScopes[curScreenSizeTabIdx];

        if (current[varName]) {
            return newValIsNotEmpty
                ? scssWizard.tryToUpdateUniqueScopeScssChunkAndReturnAllRecompiled(
                    upd,
                    styleRef,
                    mediaScope
                )
                : scssWizard.tryToDeleteUniqueScopeScssChunkAndReturnAllRecompiled(
                    upd,
                    styleRef,
                    mediaScope
                );
        } else {
            return !styleRef
                ? scssWizard.tryToAddFirstUniqueScopeScssChunkAndReturnAllRecompiled(
                    upd,
                    this.props.blockId,
                    mediaScope
                )
                : scssWizard.tryToAddUniqueScopeScssChunkAndReturnAllRecompiled(
                    upd,
                    styleRef,
                    mediaScope
                );
        }
    }
}

/**
 * @param {String} blockId
 * @param {Array<VisualStylesFormVarDefinition>} cssVarDefs
 * @returns {[Array<CssVarsMap>, todo]}
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
 * @returns {(varName: String, val: String) => String}
 */
function createVarInputToScssChunkAuto(cssVarDefs) {
    /**
     * @param {String} varName
     * @param {String} val
     * @returns {String}
     */
    return (varName, val) => {
        const def = cssVarDefs.find(r => r.varName === varName);
        if (!def) throw new Error(`Unknown property ${varName}`);

        return !def.cssSubSelector
            // Example: 'display: ${val};'
            ? `${def.cssProp}: ${val};`
            // Example: '>img {\n  aspect-ratio: ${val};\n}'
            : `${def.cssSubSelector} {\n  ${def.cssProp}: ${val};\n}`;
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
        return def;
    });
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
                renderer: LengthValueInput,
                label: 'Padding top',
                inputId: `${prefix}PaddingTop`,
            },
        },
        {
            varName: 'paddingRight',
            cssProp: 'padding-right',
            cssSubSelector: null,
            widgetSettings: {
                renderer: LengthValueInput,
                label: 'Padding right',
                inputId: `${prefix}PaddingRight`,
            },
        },
        {
            varName: 'paddingBottom',
            cssProp: 'padding-bottom',
            cssSubSelector: null,
            widgetSettings: {
                renderer: LengthValueInput,
                label: 'Padding bottom',
                inputId: `${prefix}PaddingBottom`,
            },
        },
        {
            varName: 'paddingLeft',
            cssProp: 'padding-left',
            cssSubSelector: null,
            widgetSettings: {
                renderer: LengthValueInput,
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
    createVarInputToScssChunkAuto,
};
