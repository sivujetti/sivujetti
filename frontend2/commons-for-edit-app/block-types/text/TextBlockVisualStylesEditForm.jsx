import BlockVisualStylesEditForm, {
    createPaddingVarDefs,
} from '../../BlockVisualStylesEditForm.jsx';
import {__} from '../../edit-app-singletons.js';

/** @type {Array<VisualStylesFormVarDefinition>} */
const cssVarDefs = [
    {
        varName: 'textColor',
        cssProp: 'color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Text color',
            inputId: 'textTextColor',
        },
    },
    {
        varName: 'textAlign',
        cssProp: 'text-align',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: __('Right'), value: 'right'},
                {label: __('Center'), value: 'center'},
                {label: __('Justify'), value: 'justify'},
                {label: __('Default'), value: 'default'},
                {label: __('Initial'), value: 'initial'},
                {label: '-', value: null},
            ],
            label: 'Text align',
            inputId: 'textTextAlign',
        },
    },
    {
        varName: 'lineHeight',
        cssProp: 'line-height',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Line height',
            inputId: 'textLineHeight',
        },
    },
    {
        varName: 'fontSize',
        cssProp: 'font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Font size',
            inputId: 'textFontSize',
        },
    },
    {
        varName: 'minWidth',
        cssProp: 'min-width',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Min width',
            inputId: 'textMinWidth',
            initialUnit: 'px',
        },
    },
    {
        varName: 'maxWidth',
        cssProp: 'max-width',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Max width',
            inputId: 'textMaxWidth',
            initialUnit: 'px',
        },
    },
    {
        varName: 'paragraphsMarginBottom',
        cssProp: 'margin-bottom',
        cssSubSelector: 'p',
        widgetSettings: {
            valueType: 'length',
            label: 'Paragraphs gap',
            inputId: 'textParagraphsMarginBottom',
            defaultThemeValue: '1.2rem',
        },
    },
    ...createPaddingVarDefs('text'),
];

class TextBlockVisualStylesEditForm extends BlockVisualStylesEditForm {
    /**
     * @inheritdoc
     */
    createCssVarDefinitions() {
        return cssVarDefs;
    }
}

export default TextBlockVisualStylesEditForm;
