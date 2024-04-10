import ColorValueInput from '../../styles/ColorValueInput.jsx';
import LengthValueInput from '../../styles/LengthValueInput.jsx';
import OptionValueInput from '../../styles/OptionValueInput.jsx';
import BlockVisualStylesEditForm, {
    createPaddingVarDefs,
    createVarInputToScssChunkAuto,
} from '../../BlockVisualStylesEditForm.jsx';
import {__} from '../../edit-app-singletons.js';
import ScreenSizesVerticalTabs from '../../ScreenSizesVerticalTabs.jsx';

/** @type {Array<VisualStylesFormVarDefinition>} */
const cssVarDefs = [
    {
        varName: 'bgNormal',
        cssProp: 'background-color',
        cssSubSelector: null,
        widgetSettings: {
            renderer: ColorValueInput,
            label: 'Background normal',
            inputId: 'buttonBgNormalColor',
        },
    },
    {
        varName: 'textNormal',
        cssProp: 'color',
        cssSubSelector: null,
        widgetSettings: {
            renderer: ColorValueInput,
            label: 'Text normal',
            inputId: 'buttonTextNormalColor',
        },
    },
    {
        varName: 'borderNormal',
        cssProp: 'border-color',
        cssSubSelector: null,
        widgetSettings: {
            renderer: ColorValueInput,
            label: 'Border normal',
            inputId: 'buttonBorderNormalColor',
        },
    },
    {
        varName: 'minHeight',
        cssProp: 'min-height',
        cssSubSelector: null,
        widgetSettings: {
            renderer: LengthValueInput,
            label: 'Min height',
            inputId: 'buttonMinHeight',
        },
    },
    {
        varName: 'flexWrap',
        cssProp: 'flex-wrap',
        cssSubSelector: null,
        widgetSettings: {
            renderer: OptionValueInput,
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
            renderer: OptionValueInput,
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
            inputId: 'buttonAlignItems',
        },
    },
    ...createPaddingVarDefs('button'),
];

const buttonBlockVarInputToScssChunk = createVarInputToScssChunkAuto(cssVarDefs);

class ButtonBlockVisualStylesEditForm extends BlockVisualStylesEditForm {
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
                    this.renderVarWidget(def, screenStyles, buttonBlockVarInputToScssChunk)
                ) }
            </div>
        </ScreenSizesVerticalTabs>;
    }
}

export default ButtonBlockVisualStylesEditForm;
