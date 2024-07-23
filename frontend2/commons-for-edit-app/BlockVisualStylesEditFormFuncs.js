import {mediaScopes} from '../shared-inline.js';
import blockTreeUtils from './block/tree-utils.js';
import BackgroundImageValueInput from './styles/BackgroundImageValueInput.jsx';
import ColorValueInput from './styles/ColorValueInput.jsx';
import LengthValueInput from './styles/LengthValueInput.jsx';
import OptionValueInput from './styles/OptionValueInput.jsx';
import {__, api, scssWizard} from './edit-app-singletons.js';
import {compile, createCssDeclExtractor} from './ScssWizardFuncs.js';

const WidgetClses = {
    'backgroundImage': BackgroundImageValueInput,
    'color': ColorValueInput,
    'length': LengthValueInput,
    'option': OptionValueInput,
};

/**
 * @param {String} blockId
 * @param {Array<VisualStylesFormVarDefinition>} cssVarDefs
 * @returns {[Array<CssVarsMap>, Array<StyleChunk|null>]}
 */
function createCssVarsMaps(blockId, cssVarDefs) {
    return doCreateCssVarsMaps(
        cssVarDefs,
        'single-block',
        blockId,
    );
}

/**
 * @param {Array<VisualStylesFormVarDefinition>} cssVarDefs
 * @param {styleScopeKind} scopeKind
 * @param {String} scopeSpecifier = undefined
 * @param {stylesLayer|undefined} layer = undefined
 * @returns {[Array<CssVarsMap>, Array<StyleChunk|null>]}
 */
function doCreateCssVarsMaps(cssVarDefs, scopeKind, scopeSpecifier = undefined, layer = undefined) {
    return mediaScopes.reduce((out, mediaScopeId) => {
        const styleRef = scssWizard.findStyle(scopeKind, scopeSpecifier, mediaScopeId, layer);
        const styleVarsForThisMediaScope = createVarsMapAuto(cssVarDefs, styleRef?.scss || null);
        out[0].push(styleVarsForThisMediaScope);
        out[1].push(styleRef);
        return out;
    }, [[], []]);
}

/**
 * @param {Array<VisualStylesFormVarDefinition>} cssVarDefs
 * @param {String|null} scss
 * @returns {Array<CssVarsMap>}
 */
function createVarsMapAuto(cssVarDefs, scss) {
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
function createVarInputToScssCodeAuto(cssVarDefs) {
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
    return validDefs.map(itm => {
        const out = typeof itm.widgetSettings.defaultThemeValue !== 'string'
            ? itm
            : {
                ...itm,
                widgetSettings: {
                    ...itm.widgetSettings,
                    defaultThemeValue: WidgetClses[itm.widgetSettings.valueType].valueFromInput(itm.widgetSettings.defaultThemeValue)
                }
            };
        return !itm.cssSubSelector
            ? out
            : {
                ...out,
                cssSubSelector: createNormalizedSubSelector(itm.cssSubSelector),
            };
    });
}

/**
 * @param {String} input
 * @returns {String} input with normalized white space
 */
function createNormalizedSubSelector(input) {
    const scss = `[data-block="1"] { ${input} {} }`;
    const ast = compile(scss);
    const selector = ast[1].value; // Examples 'p', '&\f:hover', '>.j-Section2-cols'
    return selector.replace(/\f/g, '');
}

/**
 * @param {String} prefix Examples: 'text', 'button'
 * @returns {Array<VisualStylesFormVarDefinition>}
 */
function createJustifyContentVarDef(prefix) {
    return {
        varName: 'alignX',
        cssProp: 'justify-content',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: __('Start'), value: 'start'},
                {label: __('Center'), value: 'center'},
                {label: __('End'), value: 'end'},
                {label: __('Normal'), value: 'normal'},
                {label: __('Space between'), value: 'space-between'},
                {label: __('Space around'), value: 'space-around'},
                {label: __('Space evenly'), value: 'space-evenly'},
                {label: __('Stretch'), value: 'stretch'},
                {label: __('Unset'), value: 'unset'},
                {label: '-', value: null},
            ],
            label: 'Align ⇄',
            inputId: `${prefix}AlignX`,
        },
    };
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

export {
    createCssVarsMaps,
    createJustifyContentVarDef,
    createNormalizedDefs,
    createPaddingVarDefs,
    createVarInputToScssCodeAuto,
    createVarsMapAuto,
    doCreateCssVarsMaps,
    getValidDefs,
};
