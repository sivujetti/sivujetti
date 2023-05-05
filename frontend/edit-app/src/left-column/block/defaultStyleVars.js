import {__} from '@sivujetti-commons-for-edit-app';
import {varNameToLabel} from './VisualStyles.jsx';

const vars = new Map;

vars.set('Button', [
    {type: 'color', comp: 'background: var(%s)', value: null, varName: 'background', label: varNameToLabel(__('background')), args: [], __idx: -1},
    {type: 'color', comp: '&:hover {\n  background: var(%s);\n}', value: null, varName: 'backgroundHover', label: varNameToLabel(__('backgroundHover')), args: [], __idx: -1},
    {type: 'color', comp: 'color: var(%s)', value: null, varName: 'text', label: varNameToLabel(__('text')), args: [], __idx: -1},
    {type: 'color', comp: '&:hover {\n  color: var(%s);\n}', value: null, varName: 'textHover', label: varNameToLabel(__('textHover')), args: [], __idx: -1},
    {type: 'color', comp: 'border-color: var(%s)', value: null, varName: 'border', label: varNameToLabel(__('border')), args: [], __idx: -1},
    {type: 'color', comp: '&:hover {\n  border-color: var(%s);\n}', value: null, varName: 'borderHover', label: varNameToLabel(__('borderHover')), args: [], __idx: -1},
    {type: 'option', comp: 'text-transform: var(%s)', value: {selected: 'none'}, varName: 'textTransform', label: varNameToLabel(__('textTransform')), args: ['none', 'uppercase', 'capitalize', 'lowercase'], __idx: -1},
]);

vars.set('Columns', [
    {type: 'length', comp: 'gap: var(%s)', value: {num: '0.4', unit: 'rem'}, varName: 'gap', label: varNameToLabel(__('gap')),
        args: [], __idx: -1},
    {type: 'option', comp: 'align-items: var(%s)', value: {selected: 'none'}, varName: 'alignItems', label: varNameToLabel(__('alignItems')),
        args: ['normal', 'start', 'center', 'end', 'stretch', 'baseline', 'first baseline', 'last baseline', ], __idx: -1},
]);

vars.set('Image', [
    {type: 'option', comp: 'float: var(%s)', value: {selected: 'none'}, varName: 'align', label: varNameToLabel(__('align')), args: ['left', 'none', 'right'], __idx: -1},
    {type: 'length', comp: 'min-height: var(%s)', value: null, varName: 'minHeight', label: varNameToLabel(__('minHeight')), args: [], __idx: -1},
    {type: 'length', comp: 'max-height: var(%s)', value: null, varName: 'maxHeight', label: varNameToLabel(__('maxHeight')), args: [], __idx: -1},
]);

vars.set('Section', [
    {type: 'length', comp: '', value: null, varName: 'paddingTop', label: varNameToLabel(__('paddingTop')), args: [], __idx: -1},
    {type: 'length', comp: '', value: null, varName: 'paddingBottom', label: varNameToLabel(__('paddingBottom')), args: [], __idx: -1},
    {type: 'length', comp: 'min-height: var(%s)', value: null, varName: 'minHeight', label: varNameToLabel(__('minHeight')), args: [], __idx: -1},
    {type: 'length', comp: '> div {\n  max-width: var(%s);\n}', value: null, varName: 'maxWidth', label: varNameToLabel(__('maxWidth')), args: [], __idx: -1},
    {type: 'color', comp: [
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
    ].join('\n'), value: null, varName: 'coverColor', label: varNameToLabel(__('coverColor')), args: [], __idx: -1},
]);

vars.set('Text', [
    {type: 'option', comp: 'text-align: var(%s)', value: {selected: 'left'}, varName: 'align', label: varNameToLabel(__('align')),
        args: ['start', 'end', 'left', 'right', 'center', 'justify', 'justify', 'justify-all', 'match-parent'], __idx: -1},
    {type: 'option', comp: 'text-transform: var(%s)', value: {selected: 'none'}, varName: 'transform', label: varNameToLabel(__('transform')),
        args: ['none', 'uppercase', 'capitalize', 'lowercase'], __idx: -1},
]);

/**
 * @param {String} blockTypeName
 * @returns {Array<CssVar & {comp: String;}>}
 */
function getDefaultVars(blockTypeName) {
    return vars.get(blockTypeName) || [];
}

export default getDefaultVars;
