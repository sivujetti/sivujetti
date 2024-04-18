import BlockVisualStylesEditForm, {
    createPaddingVarDefs,
} from '../../BlockVisualStylesEditForm.jsx';
import {__} from '../../edit-app-singletons.js';

/** @type {Array<VisualStylesFormVarDefinition>} */
const cssVarDefs = [
    {
        varName: 'display',
        cssProp: 'display',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: __('None'), value: 'none'},
                {label: __('Block'), value: 'block'},
                {label: '-', value: ''},
            ],
            label: 'Display',
            inputId: 'codeDisplay',
        },
    },
    ...createPaddingVarDefs('code'),
];

class CodeBlockVisualStylesEditForm extends BlockVisualStylesEditForm {
    /**
     * @inheritdoc
     */
    createCssVarDefinitions() {
        return cssVarDefs;
    }
}

export default CodeBlockVisualStylesEditForm;
