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
            valueType: 'length',
            label: 'Font size',
            inputId: 'textFontSize',
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
