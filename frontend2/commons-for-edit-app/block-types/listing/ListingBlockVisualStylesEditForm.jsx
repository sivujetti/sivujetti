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
        varName: 'numColumns',
        cssProp: 'grid-template-columns',
        cssSubSelector: null,
        widgetSettings: {
            renderer: OptionValueInput,
            options: [
                {label: '1', value: 'repeat(1, minmax(0, 1fr))'},
                {label: '2', value: 'repeat(2, minmax(0, 1fr))'},
                {label: '3', value: 'repeat(3, minmax(0, 1fr))'},
                {label: '4', value: 'repeat(4, minmax(0, 1fr))'},
                {label: '-', value: ''},
            ],
            label: 'Items width',
            inputId: 'listingNumColumns',
        },
    },
    {
        varName: 'gapY',
        cssProp: 'row-gap',
        cssSubSelector: null,
        widgetSettings: {
            renderer: LengthValueInput,
            label: 'Gap y',
            inputId: 'listingGapY',
        },
    },
    {
        varName: 'gapX',
        cssProp: 'column-gap',
        cssSubSelector: null,
        widgetSettings: {
            renderer: LengthValueInput,
            label: 'Gap x',
            inputId: 'listingGapX',
            defaultThemeValue: LengthValueInput.valueFromInput('6rem'),
        },
    },
    ...createPaddingVarDefs('listing'),
];

const listingBlockVarInputToScssChunk = createVarInputToScssChunkAuto(cssVarDefs);

class ListingBlockVisualStylesEditForm extends BlockVisualStylesEditForm {
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
                    this.renderVarWidget(def, screenStyles, listingBlockVarInputToScssChunk)
                ) }
            </div>
        </ScreenSizesVerticalTabs>;
    }
}

export default ListingBlockVisualStylesEditForm;
