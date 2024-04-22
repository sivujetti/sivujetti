import LengthValueInput from '../../styles/LengthValueInput.jsx';
import BlockVisualStylesEditForm, {
    createPaddingVarDefs,
} from '../../BlockVisualStylesEditForm.jsx';
import {__} from '../../edit-app-singletons.js';

/** @type {Array<VisualStylesFormVarDefinition>} */
const cssVarDefs = [
    {
        varName: 'numColumns',
        cssProp: 'grid-template-columns',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: '1', value: 'repeat(1, minmax(0, 1fr))'},
                {label: '2', value: 'repeat(2, minmax(0, 1fr))'},
                {label: '3', value: 'repeat(3, minmax(0, 1fr))'},
                {label: '4', value: 'repeat(4, minmax(0, 1fr))'},
                {label: '-', value: null},
            ],
            label: 'Num columns',
            inputId: 'listingNumColumns',
        },
    },
    {
        varName: 'gapY',
        cssProp: 'row-gap',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Gap y',
            inputId: 'listingGapY',
            defaultThemeValue: LengthValueInput.valueFromInput('6rem'),
        },
    },
    {
        varName: 'gapX',
        cssProp: 'column-gap',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Gap x',
            inputId: 'listingGapX',
        },
    },
    ...createPaddingVarDefs('listing'),
];

class ListingBlockVisualStylesEditForm extends BlockVisualStylesEditForm {
    /**
     * @inheritdoc
     */
    createCssVarDefinitions() {
        return cssVarDefs;
    }
}

export default ListingBlockVisualStylesEditForm;
