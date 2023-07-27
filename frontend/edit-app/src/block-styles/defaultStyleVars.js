import {normalizeScss} from '../left-column/block/CodeBasedStylesList.jsx';
import {varNameToLabel} from '../left-column/block/VisualStyles.jsx';

const vars = new Map;

const createCommonVars = (getDefault = _varName => '0.0') => {
    return [
        {varName: 'paddingTop', type: 'length', wrap: '', value: {num: getDefault('paddingTop'), unit: 'rem'},
            label: varNameToLabel('paddingTop'), args: [], __idx: -1},
        {varName: 'paddingRight', type: 'length', wrap: '', value: {num: getDefault('paddingRight'), unit: 'rem'},
            label: varNameToLabel('paddingRight'), args: [], __idx: -1},
        {varName: 'paddingBottom', type: 'length', wrap: '', value: {num: getDefault('paddingBottom'), unit: 'rem'},
            label: varNameToLabel('paddingBottom'), args: [], __idx: -1},
        {varName: 'paddingLeft', type: 'length', wrap: '', value: {num: getDefault('paddingLeft'), unit: 'rem'},
            label: varNameToLabel('paddingLeft'), args: [], __idx: -1},
    ];
};

vars.set('Listing', [
    ...createCommonVars(),
    {varName: 'columns', type: 'option', wrap: '', value: {selected: 1},
        label: varNameToLabel('columns'), args: [1, 2, 3, 4, 5, 6], __idx: -1},
    {varName: 'gap', type: 'length', wrap: '', value: {num: '1.4', unit: 'rem'},
        label: varNameToLabel('gap'), args: [], __idx: -1},
]);

vars.set('Menu', [
    ...createCommonVars(),
    {varName: 'listStyleType', type: 'option', wrap: '', value: {selected: 'circle'},
        label: varNameToLabel('listStyleType'), args: ['none', 'circle', 'decimal', 'disc', 'disclosure-closed', 'disclosure-open', 'square'], __idx: -1},
    {varName: 'gap', type: 'length', wrap: '', value: {num: '0.2', unit: 'rem'},
        label: varNameToLabel('gap'), args: [], __idx: -1},
    {varName: 'itemsWidth', type: 'option', wrap: '', value: {selected: '100%'},
        label: varNameToLabel('itemsWidth'), args: ['100%', '0%', 1], __idx: -1},
]);

vars.set('Button', [
    ...createCommonVars(varName => varName === 'paddingTop' || varName == 'paddingBottom' ? '0.25' : '0.4'),
    {varName: 'backgroundNormal', type: 'color', wrap: '', value: null, label: varNameToLabel('backgroundNormal'), args: [], __idx: -1},
    {varName: 'backgroundHover', type: 'color', wrap: '', value: null, label: varNameToLabel('backgroundHover'), args: [], __idx: -1},
    {varName: 'text', type: 'color', wrap: '', value: null, label: varNameToLabel('text'), args: [], __idx: -1},
    {varName: 'textHover', type: 'color', wrap: '', value: null, label: varNameToLabel('textHover'), args: [], __idx: -1},
    {varName: 'border', type: 'color', wrap: '', value: null, label: varNameToLabel('border'), args: [], __idx: -1},
    {varName: 'borderHover', type: 'color', wrap: '', value: null, label: varNameToLabel('borderHover'), args: [], __idx: -1},
    {varName: 'textTransform', type: 'option', wrap: '', value: {selected: 'none'}, label: varNameToLabel('textTransform'), args: ['none', 'uppercase', 'capitalize', 'lowercase'], __idx: -1},
    {varName: 'radius', type: 'length', wrap: '', value: {num: '2', unit: 'px'}, label: varNameToLabel('radius'), args: [], __idx: -1}
]);


vars.set('Code', [
    ...createCommonVars(),
]);

vars.set('Columns', [
    ...createCommonVars(),
    {varName: 'gap', type: 'length', wrap: '', value: {num: '0.4', unit: 'rem'}, label: varNameToLabel('gap'),
        args: [], __idx: -1},
    {varName: 'alignItems', type: 'option', wrap: '', value: {selected: 'normal'}, label: varNameToLabel('alignItems'),
        args: ['normal', 'start', 'center', 'end', 'stretch', 'baseline', 'first baseline', 'last baseline', ], __idx: -1},
]);

vars.set('Image', [
    ...createCommonVars(),
    {varName: 'align', type: 'option', wrap: '', value: {selected: 'none'}, label: varNameToLabel('align'),
        args: ['left', 'none', 'right'], __idx: -1},
    {varName: 'minHeight', type: 'length', wrap: '', value: null, label: varNameToLabel('minHeight'),
        args: [], __idx: -1},
    {varName: 'maxHeight', type: 'length', wrap: '', value: null, label: varNameToLabel('maxHeight'),
        args: [], __idx: -1},
    {varName: 'display', type: 'option', wrap: '', value: {selected: 'block'}, label: varNameToLabel('display'),
        args: ['block', 'inline', 'flex', 'inline-flex', 'inline-block'], __idx: -1},
]);

vars.set('Section', [
    ...createCommonVars(_varName => '2.0'),
    {varName: 'minHeight', type: 'length', wrap: '', value: null, label: varNameToLabel('minHeight'), args: [], __idx: -1},
    {varName: 'maxWidth', type: 'length', wrap: '', value: null, label: varNameToLabel('maxWidth'), args: [], __idx: -1},
    {varName: 'cover', type: 'color', wrap: '', value: null, label: varNameToLabel('cover'), args: [], __idx: -1},
]);

vars.set('Text', [
    ...createCommonVars(),
    {varName: 'align', type: 'option', wrap: '', value: {selected: 'left'}, label: varNameToLabel('align'),
        args: ['left', 'center', 'right', 'justify', 'justify-all', 'match-parent'], __idx: -1},
    {varName: 'textTransform', type: 'option', wrap: '', value: {selected: 'none'}, label: varNameToLabel('textTransform'),
        args: ['none', 'uppercase', 'capitalize', 'lowercase'], __idx: -1},
]);

const blockStyles = {
    /**
     * @param {String} blockTypeName
     * @param {(varNameToLabel: (varName: String) => String) => Array<CssVar & {wrap: String;}>} getVars
     */
    registerDefaultVars(blockTypeName, getVars) {
        vars.set(blockTypeName, getVars(varNameToLabel).map(v => ({...v, ...{wrap: v.wrap ? normalizeScss(v.wrap) : null}})));
    },
    /**
     * @param {String} blockTypeName
     * @returns {Array<CssVar & {wrap: String;}>}
     */
    getDefaultVars(blockTypeName) {
        return vars.get(blockTypeName) || [];
    }
};

export default blockStyles;
