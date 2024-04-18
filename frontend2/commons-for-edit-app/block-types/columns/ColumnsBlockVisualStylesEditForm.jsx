import BlockVisualStylesEditForm, {
    createPaddingVarDefs,
} from '../../BlockVisualStylesEditForm.jsx';
import {__} from '../../edit-app-singletons.js';

/** @type {Array<VisualStylesFormVarDefinition>} */
const cssVarDefs = [
    {
        varName: 'gap',
        cssProp: 'gap',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Gap',
            inputId: 'columnsGap',
        },
    },
    {
        varName: 'alignItems',
        cssProp: 'align-items',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: __('Normal'), value: 'normal'},
                {label: __('Start'), value: 'start'},
                {label: __('Center'), value: 'center'},
                {label: __('End'), value: 'end'},
                {label: __('Stretch'), value: 'stretch'},
                {label: __('Baseline'), value: 'baseline'},
                {label: __('First baseline'), value: 'first baseline'},
                {label: __('Last baseline'), value: 'last baseline'},
                {label: __('Initial'), value: 'initial'},
            ],
            label: 'Align items',
            inputId: 'columnsAlignItems',
        },
    },
    ...createPaddingVarDefs('columns'),
];

class ColumnsBlockVisualStylesEditForm extends BlockVisualStylesEditForm {
    /**
     * @inheritdoc
     */
    createCssVarDefinitions() {
        return cssVarDefs;
    }
}

export default ColumnsBlockVisualStylesEditForm;
