import BlockVisualStylesEditForm, {
    createPaddingVarDefs,
} from '../../BlockVisualStylesEditForm.jsx';
import {__} from '../../edit-app-singletons.js';

/** @type {Array<VisualStylesFormVarDefinition>} */
const cssVarDefs = [
    {
        varName: 'bgNormal',
        cssProp: 'background-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Background',
            inputId: 'buttonBgNormalColor',
        },
    },
    {
        varName: 'bgHover',
        cssProp: 'background-color',
        cssSubSelector: '&:hover',
        widgetSettings: {
            valueType: 'color',
            label: 'Background hover',
            inputId: 'buttonBgHoverColor',
        },
    },
    {
        varName: 'textNormal',
        cssProp: 'color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Text',
            inputId: 'buttonTextNormalColor',
        },
    },
    {
        varName: 'textHover',
        cssProp: 'color',
        cssSubSelector: '&:hover',
        widgetSettings: {
            valueType: 'color',
            label: 'Text hover',
            inputId: 'buttonTextHoverColor',
        },
    },
    {
        varName: 'borderNormal',
        cssProp: 'border-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Border',
            inputId: 'buttonBorderNormalColor',
        },
    },
    {
        varName: 'borderHover',
        cssProp: 'border-color',
        cssSubSelector: '&:hover',
        widgetSettings: {
            valueType: 'color',
            label: 'Border hover',
            inputId: 'buttonBorderHoverColor',
        },
    },
    {
        varName: 'borderWidth',
        cssProp: 'border-width',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Border width',
            inputId: 'buttonBorderWidth',
            defaultThemeValue: '1px',
        },
    },
    {
        varName: 'minHeight',
        cssProp: 'min-height',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Min height',
            inputId: 'buttonMinHeight',
        },
    },
    {
        varName: 'minWidth',
        cssProp: 'min-width',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Min width',
            inputId: 'buttonMinWidth',
        },
    },
    {
        varName: 'wrapContent',
        cssProp: 'flex-wrap',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: __('Side by side (nowrap)'), value: 'nowrap'},
                {label: __('Stacked (wrap)'), value: 'wrap'},
                {label: __('Reverse (wrap-reverse)'), value: 'wrap-reverse'},
                // Global values
                {label: __('Inherit'), value: 'inherit'},
                {label: __('Initial'), value: 'initial'},
                {label: __('Revert'), value: 'revert'},
                {label: __('Revert layer'), value: 'revert-layer'},
                {label: __('Unset'), value: 'unset'},
                //
                {label: '-', value: null},
            ],
            label: 'Order content',
            inputId: 'buttonWrapContent',
        },
    },
    {
        varName: 'alignY',
        cssProp: 'align-items',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: __('Start'), value: 'start'},
                {label: __('Center'), value: 'center'},
                {label: __('End'), value: 'end'},
                {label: __('Baseline'), value: 'baseline'},
                {label: __('Normal'), value: 'normal'},
                {label: __('Stretch'), value: 'stretch'},
                {label: '-', value: null},
            ],
            label: 'Align ⇅',
            inputId: 'buttonAlignY',
        },
    },
    {
        varName: 'radius',
        cssProp: 'border-radius',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Radius',
            inputId: 'buttonRadius',
            defaultThemeValue: '1px',
        },
    },
    ...(function ([top, right, bottom, left]) {
        const newTop = {...top.widgetSettings, defaultThemeValue: '0.25rem'};
        const newRight = {...right.widgetSettings, defaultThemeValue: '0.4rem'};
        const newBottom = {...bottom.widgetSettings, defaultThemeValue: '0.25rem'};
        const newLeft = {...left.widgetSettings, defaultThemeValue: '0.4rem'};
        return [
            {...top, widgetSettings: newTop},
            {...right, widgetSettings: newRight},
            {...bottom, widgetSettings: newBottom},
            {...left, widgetSettings: newLeft},
        ];
    })(createPaddingVarDefs('button')),
];

class ButtonBlockVisualStylesEditForm extends BlockVisualStylesEditForm {
    /**
     * @inheritdoc
     */
    createCssVarDefinitions() {
        return cssVarDefs;
    }
}

export default ButtonBlockVisualStylesEditForm;
