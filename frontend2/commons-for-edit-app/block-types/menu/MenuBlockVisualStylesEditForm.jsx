import LengthValueInput from '../../styles/LengthValueInput.jsx';
import BlockVisualStylesEditForm, {
    createPaddingVarDefs,
} from '../../BlockVisualStylesEditForm.jsx';
import {__} from '../../edit-app-singletons.js';
import {stringUtils} from '../../utils.js';

/** @type {Array<VisualStylesFormVarDefinition>} */
const cssVarDefs = [
    {
        varName: 'itemsWidth',
        cssProp: 'flex',
        cssSubSelector: 'ul li',
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: __('Side by side / horizontal'), value: '0 1 0'},
                {label: __('One below another/ vertical'), value: '1 0 100%'},
                {label: '-', value: ''},
            ],
            label: 'Items width',
            inputId: 'menuItemsWidth',
        },
    },
    {
        varName: 'listStyleType',
        cssProp: 'list-style-type',
        cssSubSelector: 'ul',
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: __('None'), value: 'none'},
                {label: __('Circle'), value: 'circle'},
                {label: __('Decimal'), value: 'decimal'},
                {label: __('Disc'), value: 'disc'},
                {label: __('Triangle closed'), value: 'disclosure-closed'},
                {label: __('Triangle open'), value: 'disclosure-open'},
                {label: __('Square'), value: 'square'},
                {label: '-', value: ''},
            ],
            label: 'List style',
            inputId: 'menuItemsWidth',
        },
    },
    {
        varName: 'linksGapX',
        cssProp: 'column-gap',
        cssSubSelector: 'ul',
        widgetSettings: {
            valueType: 'length',
            label: 'Links gap x',
            inputId: 'menuLinksGapX',
            defaultThemeValue: LengthValueInput.valueFromInput('0.2rem'),
        },
    },
    {
        varName: 'linksGapY',
        cssProp: 'row-gap',
        cssSubSelector: 'ul',
        widgetSettings: {
            valueType: 'length',
            label: 'Links gap y',
            inputId: 'menuLinksGapY',
        },
    },
    {
        varName: 'linksNormal',
        cssProp: 'color',
        cssSubSelector: 'ul li a',
        widgetSettings: {
            valueType: 'color',
            label: 'Links normal',
            inputId: 'menuLinksNormalColor',
        },
    },
    {
        varName: 'linksHover',
        cssProp: 'color',
        cssSubSelector: 'ul li a:hover',
        widgetSettings: {
            valueType: 'color',
            label: 'Links hover',
            inputId: 'menuLinksHoverColor',
        },
    },
    ...createPaddingVarDefs('menuItems').map(itm => ({
        ...itm,
        varName: `items${stringUtils.capitalize(itm.varName)}`,
        cssSubSelector: 'ul li a',
        widgetSettings: {
            ...itm.widgetSettings,
            label: `Links ${itm.widgetSettings.label.toLowerCase()}`,
        },
    })),
    {
        varName: 'fontSizeLinks',
        cssProp: 'font-size',
        cssSubSelector: 'ul li a',
        widgetSettings: {
            valueType: 'length',
            label: 'Font size',
            inputId: 'menuFontSizeLinks',
        },
    },
    {
        varName: 'lineHeightLinks',
        cssProp: 'line-height',
        cssSubSelector: 'ul li a',
        widgetSettings: {
            valueType: 'length',
            label: 'Line height',
            inputId: 'menuLineHeightLinks',
        },
    },
    {
        varName: 'textTransformLinks',
        cssProp: 'text-transform',
        cssSubSelector: 'ul li a',
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: __('None'), value: 'none'},
                {label: __('Uppercase'), value: 'uppercase'},
                {label: __('Capitalize'), value: 'capitalize'},
                {label: __('Lowercase'), value: 'lowercase'},
                {label: '-', value: ''},
            ],
            label: 'Text transform',
            inputId: 'menuTextTransformLinks',
        },
    },
    ...createPaddingVarDefs('menu'),
];

class MenuBlockVisualStylesEditForm extends BlockVisualStylesEditForm {
    /**
     * @inheritdoc
     */
    createCssVarDefinitions() {
        return cssVarDefs;
    }
}

export default MenuBlockVisualStylesEditForm;