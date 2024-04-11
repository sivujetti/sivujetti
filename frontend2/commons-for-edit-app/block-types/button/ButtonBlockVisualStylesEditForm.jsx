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
            label: 'Background normal',
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
            label: 'Text normal',
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
            label: 'Border normal',
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
            initialUnit: 'px',
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
        varName: 'wrapContent',
        cssProp: 'flex-wrap',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: __('Wrap'), value: 'nowrap'},
                {label: __('Nowrap'), value: 'wrap'},
                {label: __('Wrap reverse'), value: 'wrap-reverse'},
                // Global values
                {label: __('Inherit'), value: 'inherit'},
                {label: __('Initial'), value: 'initial'},
                {label: __('Revert'), value: 'revert'},
                {label: __('Revert layer'), value: 'revert-layer'},
                {label: __('Unset'), value: 'unset'},
                //
                {label: '-', value: ''},
            ],
            label: 'Wrap content',
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
                {label: '-', value: ''},
            ],
            label: 'Align updown',
            inputId: 'buttonAlignY',
        },
    },
    {
        varName: 'radius',
        cssProp: 'radius',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Radius',
            inputId: 'buttonRadius',
            initialUnit: 'px',
        },
    },
    ...createPaddingVarDefs('button'),
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
