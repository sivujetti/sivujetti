import BlockVisualStylesEditForm, {
    createPaddingVarDefs,
} from '../../BlockVisualStylesEditForm.jsx';
import {__} from '../../edit-app-singletons.js';

const innerElScope = '>div';

/** @type {Array<VisualStylesFormVarDefinition>} */
const cssVarDefs = [
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
                {label: __('Unset'), value: 'unset'},
                {label: '-', value: ''},
            ],
            label: 'Align y',
            inputId: 'sectionAlignY',
        },
    },
    {
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
                {label: __('Unset'), value: 'unset'},
                {label: '-', value: ''},
            ],
            label: 'Align x',
            inputId: 'sectionAlignX',
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
            inputId: 'sectionTextAlign',
        },
    },
    {
        varName: 'minHeight',
        cssProp: 'min-height',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Min height',
            inputId: 'sectionMinHeight',
        },
    },
    {
        varName: 'maxWidth',
        cssProp: 'max-width',
        cssSubSelector: innerElScope,
        widgetSettings: {
            valueType: 'length',
            label: 'Max width',
            inputId: 'sectionMaxWidth',
        },
    },
    {
        varName: 'background',
        cssProp: 'background-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Background',
            inputId: 'sectionBgColor',
        },
    },
    // { todo
    //     varName: 'cover',
    //     cssProp: 'background-color',
    //     cssSubSelector: ':before',
    //     widgetSettings: {
    //         valueType: 'color',
    //         label: 'Cover',
    //         inputId: 'sectionCoverColor',
    //     },
    // },
    // { todo
    //     varName: 'radius',
    //     cssProp: 'border-radius',
    //     cssSubSelector: ':before',
    //     widgetSettings: {
    //         valueType: 'length',
    //         label: 'Radius',
    //         inputId: 'sectionRadius',
    //         initialUnit: 'px',
    //     },
    // },
    ...createPaddingVarDefs('section'),
];

class SectionBlockVisualStylesEditForm extends BlockVisualStylesEditForm {
    /**
     * @inheritdoc
     */
    createCssVarDefinitions() {
        return cssVarDefs;
    }
}

export default SectionBlockVisualStylesEditForm;
