import {__} from '@sivujetti-commons-for-edit-app';
import {varNameToLabel} from './VisualStyles.jsx';

/**
 * @param {String} blockType
 * @returns {Array<CssVar & {comp: String;}>}
 */
function getDefaultVars(blockType) {
    if (blockType === 'Button') {
        const tr1 = __('background');
        const tr2 = __('backgroundHover');
        const tr3 = __('text');
        const tr4 = __('textHover');
        const tr5 = __('border');
        const tr6 = __('borderHover');
        const tr7 = __('textTransform');
        return [
            {type: 'color', comp: 'background: var(%s)', value: null, varName: tr1, label: varNameToLabel(tr1), args: [], __idx: -1},
            {type: 'color', comp: '&:hover {\n  background: var(%s);\n}', value: null, varName: tr2, label: varNameToLabel(tr2), args: [], __idx: -1},
            {type: 'color', comp: 'color: var(%s)', value: null, varName: tr3, label: varNameToLabel(tr3), args: [], __idx: -1},
            {type: 'color', comp: '&:hover {\n  color: var(%s);\n}', value: null, varName: tr4, label: varNameToLabel(tr4), args: [], __idx: -1},
            {type: 'color', comp: 'border-color: var(%s)', value: null, varName: tr5, label: varNameToLabel(tr5), args: [], __idx: -1},
            {type: 'color', comp: '&:hover {\n  border-color: var(%s);\n}', value: null, varName: tr6, label: varNameToLabel(tr6), args: [], __idx: -1},
            {type: 'option', comp: 'text-transform: var(%s)', value: {selected: 'none'}, varName: tr7, label: varNameToLabel(tr7), args: ['none', 'uppercase', 'capitalize', 'lowercase'], __idx: -1},
        ];
    }
    if (blockType === 'Columns') {
        const tr1 = __('gap');
        return [
            {type: 'length', comp: 'gap: var(%s)', value: {num: '0.4', unit: 'rem'}, varName: tr1, label: varNameToLabel(tr1), args: [], __idx: -1},
        ];
    }
    if (blockType === 'Image') {
        const tr1 = __('align');
        const tr2 = __('minHeight'); // todo px
        const tr3 = __('maxHeight'); // todo px
        return [
            {type: 'option', comp: 'float: var(%s)', value: {selected: 'none'}, varName: tr1, label: varNameToLabel(tr1), args: ['left', 'none', 'right'], __idx: -1},
            {type: 'length', comp: 'min-height: var(%s)', value: null, varName: tr2, label: varNameToLabel(tr2), args: [], __idx: -1},
            {type: 'length', comp: 'max-height: var(%s)', value: null, varName: tr3, label: varNameToLabel(tr3), args: [], __idx: -1},
        ];
    }
    if (blockType === 'Section') {
        const tr1 = __('paddingTop');
        const tr2 = __('paddingBottom');
        const tr3 = __('minHeight'); // todo px
        const tr4 = __('maxWidth'); // todo px
        const tr5 = __('coverColor');
        return [
            {type: 'length', comp: '', value: null, varName: tr1, label: varNameToLabel(tr1), args: [], __idx: -1},
            {type: 'length', comp: '', value: null, varName: tr2, label: varNameToLabel(tr2), args: [], __idx: -1},
            {type: 'length', comp: 'min-height: var(%s)', value: null, varName: tr3, label: varNameToLabel(tr3), args: [], __idx: -1},
            {type: 'length', comp: '> div {\n  max-width: var(%s);\n}', value: null, varName: tr4, label: varNameToLabel(tr4), args: [], __idx: -1},
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
            ].join('\n'), value: null, varName: tr5, label: varNameToLabel(tr5), args: [], __idx: -1},
        ];
    }
    if (blockType === 'Text') {
        const tr1 = __('align');
        const tr2 = __('transform');
        return [
            {type: 'option', comp: 'text-align: var(%s)', value: {selected: 'left'}, varName: tr1, label: varNameToLabel(tr1), args: ['start', 'end', 'left', 'right', 'center', 'justify', 'justify', 'justify-all', 'match-parent'], __idx: -1},
            {type: 'option', comp: 'text-transform: var(%s)', value: {selected: 'none'}, varName: tr2, label: varNameToLabel(tr2), args: ['none', 'uppercase', 'capitalize', 'lowercase'], __idx: -1},
        ];
    }
    return [];
}

export default getDefaultVars;
