import LengthValueInput from '../../styles/LengthValueInput.jsx';
import OptionValueInput from '../../styles/OptionValueInput.jsx';
import BlockDefaultStylesEditForm, {
    createPaddingVarDefs,
    createVarInputToScssChunkAuto,
} from '../../BlockVisualStylesEditForm.jsx';
import {__} from '../../edit-app-singletons';
import ScreenSizesVerticalTabs from '../../ScreenSizesVerticalTabs.jsx';

const innerElScope = '>img';

/** @type {Array<VisualStylesFormVarDefinition>} */
const cssVarDefs = [
    {
        varName: 'display',
        cssProp: 'display',
        cssSubSelector: null,
        widgetSettings: {
            renderer: OptionValueInput,
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
            renderer: OptionValueInput,
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
            renderer: LengthValueInput,
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
            renderer: LengthValueInput,
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
            renderer: LengthValueInput,
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
            renderer: LengthValueInput,
            label: 'Max width',
            inputId: 'imageMaxWidth',
            initialUnit: 'px',
        },
    },
    ...createPaddingVarDefs('image'),
];

const imageBlockVarInputToScssChunk = createVarInputToScssChunkAuto(cssVarDefs);

class ImageBlockVisualStylesEditForm extends BlockDefaultStylesEditForm {
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
                    this.renderVarWidget(def, screenStyles, imageBlockVarInputToScssChunk)
                ) }
            </div>
        </ScreenSizesVerticalTabs>;
    }
}

export default ImageBlockVisualStylesEditForm;
