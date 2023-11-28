import {env, stringUtils} from '@sivujetti-commons-for-edit-app';
import ColorValueInput from './ColorValueInput.jsx';
import LengthValueInput from './LengthValueInput.jsx';
import OptionValueInput from './OptionValueInput.jsx';

const {compile} = window.stylis;

const valueEditors = new Map;
valueEditors.set('length', LengthValueInput);
valueEditors.set('color', ColorValueInput);
valueEditors.set('option', OptionValueInput);

/**
 * In: ```
 * // @exportAs(length)
 * --fontSize: 2.4rem;
 * // @exportAs(color)
 * --fontColor:#000000;
 * // @exportAs(option:first|sec\|esc|third)
 * --myOption:third;
 * ```
 *
 * Out: ```
 * [[{type: 'length', value: {num: '2.4'; unit: 'rem'}, varName: 'fontSize', label: 'Font size', args: [], __idx: 1},
 *   {type: 'color', value: {data: '#333333ff', type: 'hexa'}, varName: 'fontColor', label: 'Font color', args: [], __idx: 2},
 *   {type: 'option', value: {selected: 'third'}, varName: 'myOption', label: 'My option', args: ['first', 'sec|ond', 'third'], __idx: 3}], [...]]
 * ```
 *
 * @param {String} scss
 * @param {String} selector 'j-BlockType-something' or 'push-id'
 * @param {(varName: String) => CssVar} findVarForPlaceholder = null
 * @param {Boolean} sampleOnly = false
 * @returns {extractedVars} [vars, stylisAst]
 * @access public
 */
function extractVars(scss, selector, findVarForPlaceholder = null, sampleOnly = false) {
    const ast = compile(createScss(!sampleOnly ? scss : extractFirstPartOf(scss), selector));
    const nodes = ast[0].children;
    const out = [];
    for (let i = 0; i < nodes.length; ++i) {
        const comm = nodes[i];
        if (comm.type !== 'comm') continue;
        const at1 = comm.children.indexOf('@exportAs(');
        if (at1 < 0 && comm.children.indexOf('@placeholder(') < 0) continue;
        const decl = nodes[++i];
        if (!decl || decl.type !== 'decl' || !decl.props.startsWith('--')) continue;
        //
        const ir = comm.children.trim().split('(')[1]; // '@exportAs( type: maybe|args) ' -> ' type: maybe|args)'
        if (ir.at(-1) !== ')') continue;
        //
        const varName = decl.props.substring(2);
        let varType, args;
        if (at1 > -1) {
            const varTypeAndMaybeArgs = ir.trimLeft().slice(0, -1); // ' type: maybe|args)' -> 'type: maybe|args'
            const [varType1, argsStr] = varTypeAndMaybeArgs.split(':').map(s => s.trim()); // 'type: maybe|args' -> ['type', 'maybe|args']
            varType = varType1;
            args = argsStr ? argsStr.replace(/\\\|/,'\\€').split('|').map(s => s.replace('\\€', '\\|')) : [];
        } else {
            const v = findVarForPlaceholder(varName);
            varType = v.type;
            args = v.args;
        }
        const Cls = valueEditors.get(varType);
        if (Cls) {
            const value = Cls.valueFromInput(decl.children);
            if (value) out.push({type: varType, value, varName, label: varNameToLabel(varName), args, __idx: i});
            else env.window.console.log(`Don't know how to parse ${varType} variable value "${decl.children}" yet.`);
        } else env.window.console.log(`Variable type "${varType}" not recognized`);
    }
    return [out, ast];
}

/**
 * @param {String} varName
 * @returns {String}
 */
function varNameToLabel(varName) {
    return stringUtils.capitalize(varName.replace(/[A-Z]/g, letter => ` ${letter.toLowerCase()}`));
}

/**
 * @param {String} scss
 * @param {String} selector
 * @returns {String}
 */
function createScss(scss, selector) {
    return `.${selector}{${scss}}`;
}

/**
 * @param {String} scss
 * @returns {String}
 */
function extractFirstPartOf(scss) {
    const sep = '@exportAs(';
    const pcs = scss.split(sep); // -> ['// ',
                                 //     'color)\n--foo: red;\n// ',
                                 //     'length)\n--bar: 2px;\n// '
                                 //     'color)\n--baz: blue;',
                                 //      maybeManyMorePieces...]
    const sample = pcs.slice(0, 4);
    return sample.join(sep); // -> '// @exportAs(color)
                             //     --foo: red;
                             //     @exportAs(length)
                             //     --bar: 2px;
                             //     // @exportAs(color)
                             //     --baz: blue;'
}

/**
 * @param {String} scss
 * @param {StylisAstNode} astNode
 * @param {String} replaceWith
 * @returns {String} New scss
 */
function replaceVarValue(scss, {line, column}, replaceWith) {
    const lines = scss.split('\n');
    const linestr = lines[line - 1]; // '--varA: 1.4rem; --varB: 1;'
    const before = linestr.substring(0, column + 1); // '--varA: 1.4rem; '
    const after = linestr.substring(column - 1); // ' --varB: 1;'
    const pcs = before.split(':'); // [' --varB', ' 1;']
    pcs[pcs.length - 1] = ` ${replaceWith};`;
    lines[line - 1] = `${pcs.join(':')}${after}`;
    return lines.join('\n');
}

export {extractVars, valueEditors, varNameToLabel, replaceVarValue};
