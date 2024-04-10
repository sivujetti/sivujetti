import ColorValueInput from '../../styles/ColorValueInput.jsx';
import LengthValueInput from '../../styles/LengthValueInput.jsx';
import OptionValueInput from '../../styles/OptionValueInput.jsx';
import BlockVisualStylesEditForm, {
    createPaddingVarDefs,
    createVarInputToScssChunkAuto,
} from '../../BlockVisualStylesEditForm.jsx';
import {__} from '../../edit-app-singletons.js';
import ScreenSizesVerticalTabs from '../../ScreenSizesVerticalTabs.jsx';
import {stringUtils} from '../../utils.js';

/** @type {Array<VisualStylesFormVarDefinition>} */
const cssVarDefs = [
    {
        varName: 'itemsWidth',
        cssProp: 'flex',
        cssSubSelector: 'ul li',
        widgetSettings: {
            renderer: OptionValueInput,
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
            renderer: OptionValueInput,
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
            renderer: LengthValueInput,
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
            renderer: LengthValueInput,
            label: 'Links gap y',
            inputId: 'menuLinksGapY',
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
        varName: 'linksNormal',
        cssProp: 'color',
        cssSubSelector: 'ul li a',
        widgetSettings: {
            renderer: ColorValueInput,
            label: 'Links normal',
            inputId: 'menuLinksNormalColor',
        },
    },
    {
        varName: 'linksHover',
        cssProp: 'color',
        cssSubSelector: 'ul li a:hover',
        widgetSettings: {
            renderer: ColorValueInput,
            label: 'Links hover',
            inputId: 'menuLinksHoverColor',
        },
    },
    {
        varName: 'fontSizeLinks',
        cssProp: 'font-size',
        cssSubSelector: 'ul li a',
        widgetSettings: {
            renderer: LengthValueInput,
            label: 'Font size',
            inputId: 'menuFontSizeLinks',
        },
    },
    {
        varName: 'lineHeightLinks',
        cssProp: 'line-height',
        cssSubSelector: 'ul li a',
        widgetSettings: {
            renderer: LengthValueInput,
            label: 'Line height',
            inputId: 'menuLineHeightLinks',
        },
    },
    {
        varName: 'textTransformLinks',
        cssProp: 'text-transform',
        cssSubSelector: 'ul li a',
        widgetSettings: {
            renderer: OptionValueInput,
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

const menuBlockVarInputToScssChunk = createVarInputToScssChunkAuto(cssVarDefs);

class MenuBlockVisualStylesEditForm extends BlockVisualStylesEditForm {
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
                    this.renderVarWidget(def, screenStyles, menuBlockVarInputToScssChunk)
                ) }
            </div>
        </ScreenSizesVerticalTabs>;
    }
}

export default MenuBlockVisualStylesEditForm;
