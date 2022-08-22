import {__, env, signals, hookForm, FormGroupInline, Input, InputErrors,
        reHookValues} from '@sivujetti-commons-for-edit-app';
import {stringUtils, timingUtils} from '../commons/utils';

let compile, serialize, stringify;

const valueEditors = new Map;

class VisualStyles extends preact.Component {
    // debouncedEmitVarValueChange;
    /**
     * @access protected
     */
    componentWillMount() {
        if (this.props.vars && this.props.ast)
            this.receiveVars(this.props);
    }
    /**
     * @param {VisualStylesProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if ((props.scss !== this.props.scss) || (props.vars.length && !this.state.vars))
            this.receiveVars(props);
    }
    /**
     * @access protected
     */
    render(_, {vars}) {
        if (!vars) return;
        return <div class="has-color-pickers form-horizontal px-2">{ vars.map(v => {
            const Renderer = valueEditors.get(v.type);
            return <Renderer
                valueCopy={ Object.assign({}, v.value) }
                label={ v.label}
                onVarValueChanged={ newValAsString => {
                    return this.debouncedEmitVarValueChange(newValAsString, v.__idx);
                } }/>;
        }) }</div>;
    }
    /**
     * @param {VisualStylesProps} props
     * @access protected
     */
    receiveVars(props) {
        const {ast, emitVarValueChange} = props;
        this.debouncedEmitVarValueChange = timingUtils.debounce((newValAsString, astNodeIdx) => {
            emitVarValueChange(unitCopy => {
                const node = ast[0].children[astNodeIdx];
                const varDecl = node.props; // '--foo'
                node.children = newValAsString;
                node.value = `${varDecl}:${newValAsString};`;
                return {newScss: this.replaceVarValue(unitCopy.scss, node, newValAsString),
                        newGenerated: serialize(ast, stringify)};
            });
        }, env.normalTypingDebounceMillis);
        this.setState({vars: props.vars}); // Note: reference / no copying
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
        const before = linestr.substring(0, column + 1); // '--varA: 1.4rem; '
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
     *   {type: 'color', value: {data: '#333333ff'; type: 'hexa'}, label: 'fontColor', __idx: 2}], [...]]
     * ```
     *
     * @param {String} scss
     * @param {String} cls
     * @returns {[Array<CssVar>, Array<Object>]} [vars, stylisAst]
     */
    static extractVars(scss, cls) {
        if (!valueEditors.length) {
            valueEditors.set('length', LengthValueInput);
            valueEditors.set('color', ColorValueInput);
            ({compile, serialize, stringify} = window.stylis);
        }
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
            const Cls = valueEditors.get(varType);
            if (Cls) {
                const varName = decl.props.substring(2);
                const value = Cls.valueFromInput(decl.children);
                if (value) out.push({type: varType, value, label: varNameToLabel(varName), __idx: i});
                else env.window.console.log(`Don't know how to parse ${varType} variable value "${decl.children}" yet.`);
            } else env.window.console.log(`Variable type "${varType}" not recognized`);
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
     * @param {ValueInputProps<LengthValue>} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (this.state.values.num !== props.valueCopy.num)
            reHookValues(this, [{name: 'num', value: props.valueCopy.num}]);
    }
    /**
     * @access protected
     */
    render({label, valueCopy}) {
        return <FormGroupInline>
            <label htmlFor="num" class="form-label pt-1" title={ label }>{ label }</label>
            <div class="input-group">
                <Input vm={ this } prop="num" placeholder="1.4"/>
                <span class="input-group-addon addon-sm">{ valueCopy.unit }</span>
            </div>
            <InputErrors vm={ this } prop="num"/>
        </FormGroupInline>;
    }
    /**
     * @param {String} input examples: '1.4rem', '1.4 rem ', '12px'
     * @returns {LengthValue|null}
     */
    static valueFromInput(input) {
        if (input.indexOf('rem') > -1) return {num: input.replace('rem', '').trim(), unit: 'rem'};
        if (input.indexOf('em') > -1) return {num: input.replace('em', '').trim(), unit: 'em'};
        if (input.indexOf('px') > -1) return {num: input.replace('px', '').trim(), unit: 'px'};
        return null; // not supported
    }
}

class ColorValueInput extends preact.Component {
    // unregisterSignalListener;
    /**
     * @param {ValueInputProps<LengthValue>} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if ((this.props.valueCopy.data !== props.valueCopy.data ||
            this.props.valueCopy.type !== props.valueCopy.type) && this.pickr) {
            this.pickr.setColor(props.valueCopy.data);
        }
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.unregisterSignalListener = signals.on('on-web-page-click-received', () => {
            if (this.pickr && this.pickr.isOpen()) this.pickr.hide();
        });
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unregisterSignalListener();
    }
    /**
     * @access protected
     */
    render({valueCopy, label}) {
        return <FormGroupInline className={ `flex-centered${wc_hex_is_light(valueCopy.data) ? ' is-very-light-color' : ''}` }>
            <label class="form-label pt-1" title={ label }>{ label }</label>
            {/* the real div.pickr (this.movingPickContainer) will appear here */}
            {/* this element will disappear after clicking */}
            <div class="pickr disappearing-pickr">
                <button
                    onClick={ e => this.replaceDisappearingBox(e, this.props) }
                    style={ `--pcr-color:${valueCopy.data};` }
                    class="pcr-button"
                    type="button"
                    aria-label="toggle color picker dialog"
                    role="button"></button>
            </div>
        </FormGroupInline>;
    }
    /**
     * @param {Event} e
     * @param {ValueInputProps<ColorValue>} props
     * @access private
     */
    replaceDisappearingBox(e, {valueCopy, onVarValueChanged}) {
        const disappearingColorBox = e.target.parentElement; // div.disappearing-pickr
        disappearingColorBox.classList.add('d-none');
        //
        const realColorBox = document.createElement('div');
        disappearingColorBox.parentElement.insertBefore(realColorBox, disappearingColorBox);
        this.pickr = window.Pickr.create({
            el: realColorBox,
            theme: 'nano',
            default: valueCopy.data,
            components: {preview: true, opacity: true, hue: true, interaction: {}}
        });
        //
        let nonCommittedHex;
        this.pickr.on('change', (color, _source, _instance) => {
            nonCommittedHex = `#${color.toHEXA().slice(0, 4).join('')}`;
        }).on('changestop', (_source, instance) => {
            if (this.props.valueCopy.data === nonCommittedHex) return;
            // Update realColorBox's color
            instance.setColor(nonCommittedHex);
            // Commit
            onVarValueChanged(nonCommittedHex);
        });
        setTimeout(() => {
            this.pickr.show();
        }, 10);
    }
    /**
     * @param {String} input examples: '#000', ' #ffffff '
     * @returns {ColorValue|null}
     */
    static valueFromInput(input) {
        if (input.indexOf('#') > -1) {
            const ir = input.trim();
            const hexa = ir.length === 9 ? ir : ir.length === 7 ? `${ir}ff` : null;
            if (hexa) return {data: hexa, type: 'hexa'};
        }
        return null; // not supported
    }
}

/**
 * https://stackoverflow.com/a/51567564
 *
 * @param {String} hexa
 * @param {Number} howLight = 220
 * @param {Boolean} multiplyByAlpha = false
 * @param {Boolean}
 */
function wc_hex_is_light(hexa, howLight = 220, multiplyByAlpha = false) {
    const c_r = parseInt(hexa.substring(1, 3), 16);
    const c_g = parseInt(hexa.substring(3, 5), 16);
    const c_b = parseInt(hexa.substring(5, 7), 16);
    const a = !multiplyByAlpha ? 1 : (parseInt(hexa.substring(7, 9), 16) / 255);
    const brightness = (((c_r * 299) + (c_g * 587) + (c_b * 114)) * a) / 1000;
    return brightness > howLight;
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
 * @prop {'rem'|'px'} unit
 *
 * @typedef ColorValue
 * @prop {String} data
 * @prop {'hexa'} type
 *
 * @template T
 * @typedef ValueInputProps
 * @prop {T} valueCopy
 * @prop {String} label
 * @prop {(newVal: String) => any} onVarValueChanged
 */

/**
 * @typedef VisualStylesProps
 * @prop {Array<CssVar>} vars
 * @prop {Array<Object>} ast
 * @prop {(getStyleUpdates: (unitCopy: ThemeStyleUnit) => {newScss: String; newGenerated: String;}) => void} emitVarValueChange
 * @prop {String} scss
 */

export default VisualStyles;
export {wc_hex_is_light};
