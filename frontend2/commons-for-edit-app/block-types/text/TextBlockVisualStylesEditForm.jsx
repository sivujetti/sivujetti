import ColorValueInput from '../../styles/ColorValueInput.jsx';
import LengthValueInput from '../../styles/LengthValueInput.jsx';
import OptionValueInput from '../../styles/OptionValueInput.jsx';
import BlockVisualStylesEditForm, {createVarInputToScssChunkAuto} from '../../BlockVisualStylesEditForm.jsx';
import {__} from '../../edit-app-singletons.js';
import ScreenSizesVerticalTabs from '../../ScreenSizesVerticalTabs.jsx';
import {createCssDeclExtractor} from '../../ScssWizardFuncs.js';

/** @type {Array<VisualStylesFormVarDefinition>} */
const cssVarDefs = [
    {
        varName: 'textColor',
        cssProp: 'color',
        cssSubSelector: null,
        widgetSettings: {
            renderer: ColorValueInput,
            label: 'Text color',
            inputId: 'textTextColor',
        },
    },
    {
        varName: 'textAlign',
        cssProp: 'text-align',
        cssSubSelector: null,
        widgetSettings: {
            renderer: OptionValueInput,
            options: [
                {label: __('Right'), value: 'right'},
                {label: __('Center'), value: 'center'},
                {label: __('Justify'), value: 'justify'},
                {label: __('Default'), value: 'default'},
                {label: __('Initial'), value: 'initial'},
                {label: '-', value: ''},
            ],
            label: 'Text align',
            inputId: 'textTextAlign',
        },
    },
    {
        varName: 'fontSize',
        cssProp: 'font-size',
        cssSubSelector: null,
        widgetSettings: {
            renderer: LengthValueInput,
            label: 'Font size',
            inputId: 'textFontSize',
        },
    },
    {
        varName: 'paddingTop',
        cssProp: 'padding-top',
        cssSubSelector: null,
        widgetSettings: {
            renderer: LengthValueInput,
            label: 'Padding top',
            inputId: 'textPaddingTop',
        },
    },
    {
        varName: 'paddingRight',
        cssProp: 'padding-right',
        cssSubSelector: null,
        widgetSettings: {
            renderer: LengthValueInput,
            label: 'Padding right',
            inputId: 'textPaddingRight',
        },
    },
    {
        varName: 'paddingBottom',
        cssProp: 'padding-bottom',
        cssSubSelector: null,
        widgetSettings: {
            renderer: LengthValueInput,
            label: 'Padding bottom',
            inputId: 'textPaddingBottom',
        },
    },
    {
        varName: 'paddingLeft',
        cssProp: 'padding-left',
        cssSubSelector: null,
        widgetSettings: {
            renderer: LengthValueInput,
            label: 'Padding left',
            inputId: 'textPaddingLeft',
        },
    },
];

const textBlockVarInputToScssChunk = createVarInputToScssChunkAuto(cssVarDefs);

class TextBlockVisualStylesEditForm extends BlockVisualStylesEditForm {
    /**
     * @inheritdoc
     */
    createCssVarDefinitions() {
        return cssVarDefs;
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
                { cssVarDefs.map(def =>
                    this.renderVarWidget(def, screenStyles, textBlockVarInputToScssChunk)
                ) }
            </div>
        </ScreenSizesVerticalTabs>;
    }
}

export default TextBlockVisualStylesEditForm;
