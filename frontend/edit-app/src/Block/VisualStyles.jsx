import {__, env, hookForm, FormGroupInline, Input, InputErrors} from '@sivujetti-commons-for-edit-app';
import {stringUtils, timingUtils} from '../commons/utils';

let compile, serialize, stringify;

const valueEditors = new Map;

class VisualStyles extends preact.Component {
    /**
     * @param {{vars: Array<CssVar>; ast: Array<Object>; emitVarValueChange: (getStyleUpdates: (unitCopy: ThemeStyleUnit) => {newScss: String; newGenerated: String;}) => void;}} props
     */
    constructor(props) {
        super(props);
        if (!valueEditors.length) {
            valueEditors.set('length', LengthValueInput);
            valueEditors.set('color', ColorValueInput);
        }
    }
    /**
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.vars.length && !this.state.vars)
            this.setState({vars: props.vars}); // Note: reference / no copying
    }
    /**
     * @access protected
     */
    render({emitVarValueChange, ast}, {vars}) {
        if (!vars) return;
        return <div class="form-horizontal px-2">{ vars.map(v => {
            const Renderer = valueEditors.get(v.type);
            return <Renderer
                valueCopy={ Object.assign({}, v.value) }
                label={ v.label}
                onVarValueChanged={ timingUtils.debounce(newValAsString => {
                    emitVarValueChange(unitCopy => {
                        const node = ast[0].children[v.__idx];
                        const varDecl = node.props; // '--foo'
                        node.value = `${varDecl}:${newValAsString};`;
                        return {newScss: this.replaceVarValue(unitCopy.scss, node, newValAsString),
                                newGenerated: serialize(ast, stringify)};
                    });
                }, env.normalTypingDebounceMillis) }/>;
        }) }</div>;
    }
    /**
     * @param {String} scss
     * @param {Object} astNode
     * @param {String} replaceWith
     * @returns {String}
     * @access private
     */
    replaceVarValue(scss, {line, column}, replaceWith) {
        const lines = scss.split(/\n/g);
        const linestr = lines[line - 1]; // '--varA: 1.4rem; --varB: 1;'
        const before = linestr.substring(0, column); // '--varA: 1.4rem; '
        const after = linestr.substring(column - 1); // ' --varB: 1;'
        const pcs = before.split(':'); // [' --varB', ' 1;']
        pcs[pcs.length - 1] = ` ${replaceWith};`;
        lines[line - 1] = `${pcs.join(':')}${after}`;
        return lines.join('\n');
    }
    /**
     * In: ```
     * // @exportAs(length)
     * --fontSize: 2.4rem;
     * // @exportAs(color)
     * --fontColor:#000000;
     * ```
     *
     * Out: ```
     * [[{type: 'length', value: {num: '2.4'; unit: 'rem'}, label: 'fontSize', __idx: 1},
     *   {type: 'color', value: {data: todo; type: 'hex'}, label: 'fontColor', __idx: 2}], [...]]
     * ```
     *
     * @param {String} scss
     * @param {String} cls
     * @returns {[Array<CssVar>, Array<Object>]} [vars, stylisAst]
     */
    static extractVars(scss, cls) {
        ({compile, serialize, stringify} = window.stylis);
        const ast = compile(`.${cls}{${scss}}`);
        const nodes = ast[0].children;
        const out = [];
        for (let i = 0; i < nodes.length; ++i) {
            const comm = nodes[i];
            if (comm.type !== 'comm' || comm.children.indexOf('@exportAs') < 0) continue;
            const decl = nodes[++i];
            if (!decl || decl.type !== 'decl' || !decl.props.startsWith('--')) continue;
            //
            const ir = comm.children.trim().split('(')[1]; // '@exportAs(value)' -> 'value)'
            const varType = ir.split(')')[0].trim(); // 'value)' -> 'value'
            if (varType === 'length') {
                const value = inputToLength(decl.children);
                if (value) out.push({type: 'length', value, label: varNameToLabel(decl.props.substring(2)), __idx: i});
            }
        }
        return [out, ast];
    }
}

class LengthValueInput extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        const {num, unit} = this.props.valueCopy;
        this.setState(hookForm(this, [
            {name: 'num', value: num, validations: [['required'], ['maxLength', 32], [{doValidate: val =>
                !isNaN(parseFloat(val))
            , errorMessageTmpl: __('%s must be a number').replace('%', '{field}')}, null]],
                label: this.props.label, onAfterValueChanged: (value, hasErrors) => {
                    if (!hasErrors) this.props.onVarValueChanged(`${value}${unit}`);
                }},
        ]));
    }
    /**
     * @param {{valueCopy: LengthValue; label: String; onVarValueChanged: (newVal: String) => any;}} props
     * @access protected
     */
    render({label, valueCopy}) {
        return <FormGroupInline>
            <label htmlFor="num" class="form-label pt-1">{ label }</label>
            <div class="input-group">
                <Input vm={ this } prop="num" placeholder="1.4"/>
                <span class="input-group-addon addon-sm">{ valueCopy.unit }</span>
            </div>
            <InputErrors vm={ this } prop="num"/>
        </FormGroupInline>;
    }
}

class ColorValueInput extends preact.Component {
    /**
     * @param {{valueCopy: ColorValue; label: String; onVarValueChanged: (newVal: String) => any;}} props
     * @access protected
     */
    render({valueCopy}) {
        return <p>todo</p>;
    }
}

/**
 * @param {String} input examples: '1.4rem', '1.4 rem '
 * @returns {LengthValue|null}
 */
function inputToLength(input) {
    if (input.indexOf('rem') > -1) return {num: input.replace('rem', '').trim(), unit: 'rem'};
    return null; // not supported
}

/**
 * @param {String} varName
 * @returns {String}
 */
function varNameToLabel(varName) {
    return stringUtils.capitalize(varName.replace(/[A-Z]/g, letter => ` ${letter.toLowerCase()}`));
}

/**
 * @typedef CssVar
 * @prop {'length'} type
 * @prop {LengthValue|ColorValue} value
 * @prop {String} label
 * @prop {Number} __idx
 *
 * @typedef LengthValue
 * @prop {String} num
 * @prop {'rem'} unit
 *
 * @typedef ColorValue
 * @prop {String} data
 * @prop {'hex'} type
 */

export default VisualStyles;
