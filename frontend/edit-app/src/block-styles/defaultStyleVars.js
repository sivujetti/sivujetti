import {normalizeScss} from '../left-column/block/BlockStylesTab.jsx';
import {varNameToLabel} from '../left-column/block/VisualStyles.jsx';

const vars = new Map;

vars.set('Button', [
    {type: 'color', wrap: 'background: var(%s);', value: null, varName: 'background', label: varNameToLabel('background'), args: [], __idx: -1},
    {type: 'color', wrap: '&:hover {\n  background: var(%s);\n}', value: null, varName: 'backgroundHover', label: varNameToLabel('backgroundHover'), args: [], __idx: -1},
    {type: 'color', wrap: 'color: var(%s);', value: null, varName: 'text', label: varNameToLabel('text'), args: [], __idx: -1},
    {type: 'color', wrap: '&:hover {\n  color: var(%s);\n}', value: null, varName: 'textHover', label: varNameToLabel('textHover'), args: [], __idx: -1},
    {type: 'color', wrap: 'border-color: var(%s);', value: null, varName: 'border', label: varNameToLabel('border'), args: [], __idx: -1},
    {type: 'color', wrap: '&:hover {\n  border-color: var(%s);\n}', value: null, varName: 'borderHover', label: varNameToLabel('borderHover'), args: [], __idx: -1},
    {type: 'option', wrap: 'text-transform: var(%s);', value: {selected: 'none'}, varName: 'textTransform', label: varNameToLabel('textTransform'), args: ['none', 'uppercase', 'capitalize', 'lowercase'], __idx: -1},
]);

vars.set('Columns', [
    {type: 'length', wrap: 'gap: var(%s);', value: {num: '0.4', unit: 'rem'}, varName: 'gap', label: varNameToLabel('gap'),
        args: [], __idx: -1},
    {type: 'option', wrap: 'align-items: var(%s);', value: {selected: 'normal'}, varName: 'alignItems', label: varNameToLabel('alignItems'),
        args: ['normal', 'start', 'center', 'end', 'stretch', 'baseline', 'first baseline', 'last baseline', ], __idx: -1},
]);

vars.set('Image', [
    {type: 'option', wrap: 'float: var(%s);', value: {selected: 'none'}, varName: 'align', label: varNameToLabel('align'), args: ['left', 'none', 'right'], __idx: -1},
    {type: 'length', wrap: 'min-height: var(%s);', value: null, varName: 'minHeight', label: varNameToLabel('minHeight'), args: [], __idx: -1},
    {type: 'length', wrap: 'max-height: var(%s);', value: null, varName: 'maxHeight', label: varNameToLabel('maxHeight'), args: [], __idx: -1},
]);

vars.set('Section', [
    {type: 'length', wrap: '', value: null, varName: 'paddingTop', label: varNameToLabel('paddingTop'), args: [], __idx: -1},
    {type: 'length', wrap: '', value: null, varName: 'paddingBottom', label: varNameToLabel('paddingBottom'), args: [], __idx: -1},
    {type: 'length', wrap: 'min-height: var(%s);', value: null, varName: 'minHeight', label: varNameToLabel('minHeight'), args: [], __idx: -1},
    {type: 'length', wrap: '> div {\n  max-width: var(%s);\n}', value: null, varName: 'maxWidth', label: varNameToLabel('maxWidth'), args: [], __idx: -1},
    {type: 'color', wrap: [
        'position: relative;',
        '&:before {',
        '  content: "";',
        '  background-color: var(%s);',
        '  height: 100%;',
        '  width: 100%;',
        '  position: absolute;',
        '  left: 0;',
        '}',
        '> * {',
        '  position: relative;',
        '}',
    ].join('\n'), value: null, varName: 'backgroundCover', label: varNameToLabel('backgroundCover'), args: [], __idx: -1},
]);

vars.set('Text', [
    {type: 'option', wrap: 'text-align: var(%s);', value: {selected: 'left'}, varName: 'align', label: varNameToLabel('align'),
        args: ['start', 'end', 'left', 'right', 'center', 'justify', 'justify', 'justify-all', 'match-parent'], __idx: -1},
    {type: 'option', wrap: 'text-transform: var(%s);', value: {selected: 'none'}, varName: 'textTransform', label: varNameToLabel('textTransform'),
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
