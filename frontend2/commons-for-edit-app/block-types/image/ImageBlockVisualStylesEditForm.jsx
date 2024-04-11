import BlockDefaultStylesEditForm, {
    createPaddingVarDefs,
} from '../../BlockVisualStylesEditForm.jsx';
import {__} from '../../edit-app-singletons';

const innerElScope = '>img';

/** @type {Array<VisualStylesFormVarDefinition>} */
const cssVarDefs = [
    {
        varName: 'display',
        cssProp: 'display',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: 'Block', value: 'block'},
                {label: 'Inline', value: 'inline'},
                {label: 'Flex', value: 'flex'},
                {label: 'Inline flex', value: 'inline-flex'},
                {label: 'Inline block', value: 'inline-block'},
                {label: 'Initial', value: 'initial'},
                {label: '-', value: ''},
            ],
            label: 'Display',
            inputId: 'imageDisplay',
        },
    },
    {
        varName: 'aspectRatio',
        cssProp: 'aspect-ratio',
        cssSubSelector: innerElScope,
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: '1/1', value: '1/1'},
                {label: '3/4', value: '3/4'},
                {label: '4/3', value: '4/3'},
                {label: '6/9', value: '6/9'},
                {label: '9/6', value: '9/6'},
                // Global values
                {label: __('Inherit'), value: 'inherit'},
                {label: __('Initial'), value: 'initial'},
                {label: __('Revert'), value: 'revert'},
                {label: __('Revert layer'), value: 'revert-layer'},
                {label: __('Unset'), value: 'unset'},
                //
                {label: '-', value: ''},
            ],
            label: 'Aspect ratio',
            inputId: 'imageAspectRatio',
        },
    },
    {
        varName: 'minHeight',
        cssProp: 'min-height',
        cssSubSelector: innerElScope,
        widgetSettings: {
            valueType: 'length',
            label: 'Min height',
            inputId: 'imageMinHeight',
            initialUnit: 'px',
        },
    },
    {
        varName: 'maxHeight',
        cssProp: 'max-height',
        cssSubSelector: innerElScope,
        widgetSettings: {
            valueType: 'length',
            label: 'Max height',
            inputId: 'imageMaxHeight',
            initialUnit: 'px',
        },
    },
    {
        varName: 'minWidth',
        cssProp: 'min-width',
        cssSubSelector: innerElScope,
        widgetSettings: {
            valueType: 'length',
            label: 'Min width',
            inputId: 'imageMinWidth',
            initialUnit: 'px',
        },
    },
    {
        varName: 'maxWidth',
        cssProp: 'max-width',
        cssSubSelector: innerElScope,
        widgetSettings: {
            valueType: 'length',
            label: 'Max width',
            inputId: 'imageMaxWidth',
            initialUnit: 'px',
        },
    },
    ...createPaddingVarDefs('image'),
];

class ImageBlockVisualStylesEditForm extends BlockDefaultStylesEditForm {
    /**
     * @inheritdoc
     */
    createCssVarDefinitions() {
        return cssVarDefs;
    }
}

export default ImageBlockVisualStylesEditForm;
