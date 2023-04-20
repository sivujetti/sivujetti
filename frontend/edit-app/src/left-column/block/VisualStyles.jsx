import {__, env, signals, stringUtils, timingUtils, hookForm, FormGroupInline, Input,
    InputErrors, reHookValues} from '@sivujetti-commons-for-edit-app';

const {compile, serialize, stringify} = window.stylis;

const valueEditors = new Map;

class VisualStyles extends preact.Component {
    // debouncedEmitVarValueChange;
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
                return {newScss: replaceVarValue(unitCopy.scss, node, newValAsString),
                        newGenerated: serialize(ast, stringify)};
            });
        }, env.normalTypingDebounceMillis);
        this.setState({vars: props.vars}); // Note: reference / no copying
    }
    /**
     * @access public
     */
    static init() {
        if (!valueEditors.length) {
            valueEditors.set('length', LengthValueInput);
            valueEditors.set('color', ColorValueInput);
            valueEditors.set('option', OptionValueInput);
        }
    }
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
     * @param {String} sel 'j-BlockType-something' or 'push-id'
     * @param {'cls'|'attr'} selType = 'cls'
     * @returns {[Array<CssVar>, Array<Object>]} [vars, stylisAst]
     * @access public
     */
    static extractVars(scss, sel, selType = 'cls') {
        VisualStyles.init();
        const ast = compile(createScss(scss, sel, selType));
        const nodes = ast[0].children;
        const out = [];
        for (let i = 0; i < nodes.length; ++i) {
            const comm = nodes[i];
            if (comm.type !== 'comm' || comm.children.indexOf('@exportAs') < 0) continue;
            const decl = nodes[++i];
            if (!decl || decl.type !== 'decl' || !decl.props.startsWith('--')) continue;
            //
            const ir = comm.children.trim().split('(')[1]; // '@exportAs(type)' -> 'type:maybe|args)'
            const varTypeAndMaybeArgs = ir.split(')')[0].trim(); // 'type:maybe|args)' -> 'type:maybe|args'
            const [varType, argsStr] = varTypeAndMaybeArgs.split(':').map(s => s.trim()); // 'type:maybe|args' -> ['type', 'maybe|args']
            const args = argsStr ? argsStr.replace(/\\\|/,'\\€').split(/\|/).map(s => s.replace('\\€', '\\|')) : [];
            const Cls = valueEditors.get(varType);
            if (Cls) {
                const varName = decl.props.substring(2);
                const value = Cls.valueFromInput(decl.children);
                if (value) out.push({type: varType, value, varName, label: varNameToLabel(varName), args, __idx: i});
                else env.window.console.log(`Don't know how to parse ${varType} variable value "${decl.children}" yet.`);
            } else env.window.console.log(`Variable type "${varType}" not recognized`);
        }
        return [out, ast];
    }
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
    render({unitCls}, {vars}) {
        if (!vars) return;
        return <div class="has-color-pickers form-horizontal px-2">{ vars.map(v => {
            const Renderer = valueEditors.get(v.type);
            return <Renderer
                valueCopy={ Object.assign({}, v.value) }
                argsCopy={ [...v.args] }
                varName={ v.varName }
                label={ v.label }
                onVarValueChanged={ newValAsString => this.debouncedEmitVarValueChange(newValAsString, v.__idx) }
                unitCls={ unitCls }/>;
        }) }</div>;
    }
}

/**
 * @param {String} scss
 * @param {Object} astNode
 * @param {String} replaceWith
 * @returns {String}
 * @access private
 */
function replaceVarValue(scss, {line, column}, replaceWith) {
    const lines = scss.split(/\n/g);
    const linestr = lines[line - 1]; // '--varA: 1.4rem; --varB: 1;'
    const before = linestr.substring(0, column + 1); // '--varA: 1.4rem; '
    const after = linestr.substring(column - 1); // ' --varB: 1;'
    const pcs = before.split(':'); // [' --varB', ' 1;']
    pcs[pcs.length - 1] = ` ${replaceWith};`;
    lines[line - 1] = `${pcs.join(':')}${after}`;
    return lines.join('\n');
}

class LengthValueInput extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        const {num, unit} = LengthValueInput.normalize(this.props.valueCopy);
        this.setState(hookForm(this, [
            {name: 'num', value: num, validations: [['maxLength', 32], [{doValidate: val =>
                !val.length || !isNaN(parseFloat(val))
            , errorMessageTmpl: __('%s must be a number').replace('%', '{field}')}, null]],
                label: this.props.label, onAfterValueChanged: (value, hasErrors) => {
                    if (!hasErrors) this.props.onVarValueChanged(value ? `${value}${unit}` : null);
                }},
        ]));
    }
    /**
     * @param {ValueInputProps<LengthValue>} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        const incoming = LengthValueInput.normalize(props.valueCopy);
        if (this.state.values.num !== incoming.num)
            reHookValues(this, [{name: 'num', value: incoming.num}]);
    }
    /**
     * @access protected
     */
    render({label, valueCopy}) {
        return <FormGroupInline>
            <label htmlFor="num" class="form-label pt-1" title={ label }>{ label }</label>
            <div class="input-group">
                <Input vm={ this } prop="num" placeholder="1.4"/>
                <span class="input-group-addon addon-sm">{ valueCopy ? valueCopy.unit : 'rem' }</span>
            </div>
            <InputErrors vm={ this } prop="num"/>
        </FormGroupInline>;
    }
    /**
     * @param {String} input examples: '1.4rem', '1.4 rem ', '12px'
     * @returns {LengthValue|null}
     */
    static valueFromInput(input) {
        const chars = input.split('').filter(ch => ch !== ' ');
        const firstAlpha = chars.findIndex(ch => {
            const cc = ch.charCodeAt(0);
            return ((cc >= 65 && cc <= 90) || (cc >= 97 && cc <= 122)) || ch === '%';
        });
        if (firstAlpha > 0)
            return {num: chars.slice(0, firstAlpha).join(''),
                     unit: chars.slice(firstAlpha).join('')};
        return null; // not supported
    }
    /**
     * @param {LengthValue|null} input
     * @returns {LengthValue}
     */
    static normalize(input) {
        return input || {num: '', unit: 'rem'};
    }
}

/** @type {CanvasRenderingContext2D} */
let helperCanvasCtx;

class ColorValueInput extends preact.Component {
    // unregisterSignalListener;
    /**
     * @param {ValueInputProps<LengthValue>} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        const cur = ColorValueInput.normalize(this.props.valueCopy);
        const incoming = ColorValueInput.normalize(props.valueCopy);
        if ((cur.data !== incoming.data || cur.type !== incoming.type) && this.pickr) {
            this.pickr.setColor(incoming.data);
        }
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.unregisterSignalListener = signals.on('web-page-click-received', () => {
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
        const val = ColorValueInput.normalize(valueCopy);
        return <FormGroupInline className={ `flex-centered${wc_hex_is_light(val.data) ? ' is-very-light-color' : ''}` }>
            <label class="form-label pt-1" title={ label }>{ label }</label>
            {/* the real div.pickr (this.movingPickContainer) will appear here */}
            {/* this element will disappear after clicking */}
            <div class="pickr disappearing-pickr">
                <button
                    onClick={ e => this.replaceDisappearingBox(e, this.props) }
                    style={ `--pcr-color:${val.data};` }
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
            default: ColorValueInput.normalize(valueCopy).data,
            components: {preview: true, opacity: true, hue: true, interaction: {}}
        });
        //
        let nonCommittedHex;
        this.pickr.on('change', (color, _source, _instance) => {
            nonCommittedHex = `#${color.toHEXA().slice(0, 4).join('')}`;
            signals.emit('visual-styles-var-value-changed-fast', this.props.unitCls, this.props.varName, nonCommittedHex, 'color');
        }).on('changestop', (_source, instance) => {
            if (ColorValueInput.normalize(this.props.valueCopy).data === nonCommittedHex) return;
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
        // https://stackoverflow.com/a/47355187
        if (!helperCanvasCtx) helperCanvasCtx = document.createElement('canvas').getContext('2d');
        else helperCanvasCtx.fillStyle = '#000'; // clear previous
        helperCanvasCtx.fillStyle = input;
        const out = helperCanvasCtx.fillStyle;
        // https://stackoverflow.com/a/49974627
        return {data: out[0] === '#'
            ? `${out}ff`
            : '#' + (
                out.substring('rgba('.length, out.length - 1) // 'rgba(0, 0, 0, 0.73)' -> '0, 0, 0, 0.73'
                    .split(',') // '0, 0, 0, 0.73' -> ['0', ' 0', ' 0', ' 0.73']
                    .map((str, i) => i < 3
                        ? (parseFloat(str) | 1 << 8).toString(16).slice(1)
                        : (str != ' 0' ? parseFloat(str).toString(16).substring(2,4) : '00')
                    ) // ['0', ' 0', ' 0', ' 0.73'] -> ['00', '00', '00' , 'bb']
                    .join('')
            ), type: 'hexa'
        };
    }
    /**
     * @param {ColorValue|null} input
     * @returns {Coloralue}
     */
    static normalize(input) {
        return input || {data: '#000000ff', type: 'hexa'};
    }
}

class OptionValueInput extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        const {selected} = this.props.valueCopy;
        this.setState({selected, options: this.props.argsCopy});
    }
    /**
     * @param {ValueInputProps<OptionValue>} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (this.state.selected !== props.valueCopy.selected)
            this.setState({selected: props.valueCopy.selected});
    }
    /**
     * @access protected
     */
    render({label}, {selected, options}) {
        return <FormGroupInline>
            <label htmlFor="num" class="form-label pt-1" title={ label }>{ label }</label>
            <select class="form-select" value={ selected } onChange={ e => this.props.onVarValueChanged(e.target.value) }>
            { options.map(text =>
                <option value={ text }>{ text }</option>
            ) }
            </select>
        </FormGroupInline>;
    }
    /**
     * @param {String} input examples:
     * @returns {OptionValue|null}
     */
    static valueFromInput(input) {
        return input;
    }
    /**
     * @param {OptionValue|null} input
     * @returns {OptionValue}
     */
    static normalize(input) {
        return input || {};
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
 * @param {String} scss
 * @param {String} sel
 * @param {'cls'|'attr'} selType
 * @returns {String}
 */
function createScss(scss, sel, selType) {
    return (selType === sel ? `.${sel}` : `[data-block="${sel}"]`) + `{${scss}}`;
}

/**
 * @template T
 * @typedef ValueInputProps
 * @prop {T} valueCopy
 * @prop {String[]} argsCopy
 * @prop {String} label
 * @prop {String} varName
 * @prop {(newVal: String) => any} onVarValueChanged
 */

/**
 * @typedef VisualStylesProps
 * @prop {Array<CssVar>} vars
 * @prop {Array<Object>} ast
 * @prop {(getStyleUpdates: (unitCopy: ThemeStyleUnit) => {newScss: String; newGenerated: String;}) => void} emitVarValueChange
 * @prop {String} scss
 * @prop {String} unitCls
 */

export default VisualStyles;
export {wc_hex_is_light, ColorValueInput, LengthValueInput, varNameToLabel,
    replaceVarValue, valueEditors, createScss};
