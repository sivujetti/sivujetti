import {__, env, signals, stringUtils, timingUtils, hookForm, FormGroupInline, Input,
    InputErrors, reHookValues, Icon} from '@sivujetti-commons-for-edit-app';

const {compile, serialize, stringify} = window.stylis;

const NO_VALUE = '?';
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
     * @param {'cls'|'attr'} selType = 'cls'
     * @param {(varName: String) => CssVar} findVarForPlaceholder = null
     * @returns {extractedVars} [vars, stylisAst]
     * @access public
     */
    static extractVars(scss, selector, selType = 'cls', findVarForPlaceholder = null) {
        const ast = compile(createScss(scss, selector, selType));
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
                const value1 = decl.children;
                const value = value1 !== 'initial' ? Cls.valueFromInput(decl.children) : 'initial';
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
        return <div class="form-horizontal tight has-color-pickers px-2">{ vars.map(v => {
            const Renderer = valueEditors.get(v.type);
            return <Renderer
                valueReal={ Object.assign({}, v.value) }
                argsCopy={ [...v.args] }
                varName={ v.varName }
                labelTranslated={ __(v.label) }
                onVarValueChanged={ newValAsString => this.debouncedEmitVarValueChange(newValAsString, v.__idx) }
                selector={ `.${unitCls}` }/>;
        }) }</div>;
    }
}

/**
 * @param {String} scss
 * @param {StylisAstNode} astNode
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
    // numInternal;
    /**
     * @access protected
     */
    componentWillMount() {
        const {num, unit} = LengthValueInput.normalize(this.props.valueReal);
        this.numInternal = num;
        const numNorm = normValueNum(num);
        this.setState(hookForm(this, [
            {name: 'num', value: numNorm, validations: [['maxLength', 32], [{doValidate: val =>
                !val.length || !isNaN(parseFloat(val))
            , errorMessageTmpl: __('%s must be a number').replace('%', '{field}')}, null]],
                label: this.props.labelTranslated, onAfterValueChanged: (value, hasErrors) => {
                    if (!hasErrors) this.props.onVarValueChanged(value ? `${value}${unit}` : null);
                }},
        ], {
            unit,
        }));
    }
    /**
     * @param {ValueInputProps<LengthValue>} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        const incoming = LengthValueInput.normalize(props.valueReal);
        const numNorm = normValueNum(incoming.num);
        if (this.state.values.num !== numNorm) {
            reHookValues(this, [{name: 'num', value: numNorm}]);
            this.numInternal = incoming.num;
        }
        if (this.state.unit !== incoming.unit)
            this.setState({unit: incoming.unit});
    }
    /**
     * @access protected
     */
    render(props) {
        const norm = LengthValueInput.normalize(props.valueReal);
        const {labelTranslated, isClearable} = props;
        const unit = norm.num || this.numInternal === NO_VALUE ? norm.unit : this.state.unit;
        return <FormGroupInline className="has-visual-length-input">
            <label htmlFor="num" class="form-label pt-1" title={ labelTranslated }>{ labelTranslated }</label>
            <div class="p-relative">
                <div class="input-group">
                    <Input vm={ this } prop="num" placeholder="1.4"/>
                    <select
                        onChange={ e => this.props.onVarValueChanged(`${norm.num}${e.target.value}`) }
                        class="form-input input-group-addon addon-sm form-select"
                        defaultvalue={ unit }>{
                        ['rem', 'px', '%', 'em', 'vh', 'vw', 'vb', 'vmin', 'vmax'].map(ltype =>
                            <option value={ ltype }>{ ltype }</option>
                        )
                    }</select>
                </div>
                { isClearable
                    ? <button onClick={ () => { this.props.onVarValueChanged(null); } }
                        class="btn btn-link btn-sm"
                        title={ __('Restore default') }
                        style="position: absolute;right: -1.8rem;top: .1rem;">
                        <span class="d-flex rotated-undo-icon"><Icon iconId="rotate" className="size-xs color-dimmed3"/></span>
                    </button>
                    : null
                }
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
        return input || {num: NO_VALUE, unit: 'rem'};
    }
    /**
     * @param {LengthValue} value
     * @returns {String}
     */
    static valueToString(value) {
        return `${value.num || NO_VALUE}${value.unit}`;
    }
}

/**
 * @param {String} num
 * @returns {String}
 */
function normValueNum(num) {
    return num !== NO_VALUE ? num : '';
}

/** @type {CanvasRenderingContext2D} */
let helperCanvasCtx;

class ColorValueInput extends preact.Component {
    // unregisterSignalListener;
    // resetValueIsPending;
    /**
     * @param {ValueInputProps<ColorValue>} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        const cur = getVisibleColor(this.props);
        const incoming = getVisibleColor(props);
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
        this.resetValueIsPending = false;
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
    render(props) {
        const visible = getVisibleColor(props);
        const {labelTranslated, isClearable} = props;
        return <FormGroupInline className={ `flex-centered${wc_hex_is_light(visible.data) ? ' is-very-light-color' : ''}` }>
            <label class="form-label pt-1" title={ labelTranslated }>{ labelTranslated }</label>
            {/* the real div.pickr (this.movingPickContainer) will appear here */}
            {/* this element will disappear after clicking */}
            <div class="d-inline-flex p-relative">
            <div class="pickr disappearing-pickr">
                <button
                    onClick={ this.replaceDisappearingBox.bind(this) }
                    style={ `--pcr-color:${visible.data};` }
                    class="pcr-button"
                    type="button"
                    aria-label="toggle color picker dialog"
                    role="button"></button>
            </div>
            { isClearable
                ? <button onClick={ () => {
                    this.resetValueIsPending = true;
                    this.props.onVarValueChanged(null);
                    setTimeout(() => { this.resetValueIsPending = false; }, 200);
                } } class="btn btn-link btn-sm" title={ __('Restore default') } style="position: absolute;right: -1.8rem;top: .1rem;">
                    <span class="d-flex rotated-undo-icon"><Icon iconId="rotate" className="size-xs color-dimmed3"/></span>
                </button>
                : null
            }
            </div>
        </FormGroupInline>;
    }
    /**
     * @param {Event} e
     * @access private
     */
    replaceDisappearingBox(e) {
        const disappearingColorBox = e.target.parentElement; // div.disappearing-pickr
        disappearingColorBox.classList.add('d-none');
        //
        const realColorBox = document.createElement('div');
        disappearingColorBox.parentElement.insertBefore(realColorBox, disappearingColorBox);
        const norm = getVisibleColor(this.props);
        this.pickr = window.Pickr.create({
            el: realColorBox,
            theme: 'nano',
            default: norm.data,
            components: {preview: true, opacity: true, hue: true, interaction: {}}
        });
        //
        let nonCommittedHex;
        this.pickr.on('change', (color, _source, _instance) => {
            let value;
            if (!this.resetValueIsPending) {
                nonCommittedHex = `#${color.toHEXA().slice(0, 4).join('')}`;
                value = !this.props.valueWrapStr ? nonCommittedHex : () => this.props.valueWrapStr.replace(/var\(%s\)/g, nonCommittedHex);
            } else {
                value = !this.props.valueWrapStr ? 'initial' : (() => '');
                this.resetValueIsPending = false;
            }
            signals.emit('visual-styles-var-value-changed-fast', this.props.selector, this.props.varName, value, 'color');
        }).on('changestop', (_source, instance) => {
            if (getVisibleColor(this.props).data === nonCommittedHex) return;
            // Update realColorBox's color
            instance.setColor(nonCommittedHex);
            // Commit
            this.props.onVarValueChanged(nonCommittedHex);
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
    /**
     * @param {ColorValue} value
     * @returns {String}
     */
    static valueToString(value) {
        return `${value.data}`;
    }
}

/**
 * @param {ValueInputProps<ColorValue>} props
 * @access protected
 */
function getVisibleColor({valueToDisplay, valueReal}) {
    return ColorValueInput.normalize(valueToDisplay || valueReal);
}

class OptionValueInput extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        const {selected} = OptionValueInput.normalize(this.props.valueReal);
        this.setState({selected, options: this.props.argsCopy});
    }
    /**
     * @param {ValueInputProps<OptionValue>} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        const norm = OptionValueInput.normalize(props.valueReal);
        if (this.state.selected !== norm.selected)
            this.setState({selected: norm.selected});
    }
    /**
     * @access protected
     */
    render({labelTranslated, isClearable}, {selected, options}) {
        return <FormGroupInline>
            <label class="form-label pt-1" title={ labelTranslated }>{ labelTranslated }</label>
            <div class="p-relative">
                <select class="form-select" value={ selected } onChange={ e => this.props.onVarValueChanged(e.target.value) }>
                { options.map(text =>
                    <option value={ text }>{ text }</option>
                ) }
                </select>
                { isClearable
                    ? <button onClick={ () => { this.props.onVarValueChanged(null); } } class="btn btn-link btn-sm" title={ __('Restore default') } style="position: absolute;right: -1.8rem;top: .1rem;">
                        <span class="d-flex rotated-undo-icon"><Icon iconId="rotate" className="size-xs color-dimmed3"/></span>
                    </button>
                    : null
                }
            </div>
        </FormGroupInline>;
    }
    /**
     * @param {String} input examples: 'inline-block', 'Fira Sans'
     * @returns {OptionValue|null}
     */
    static valueFromInput(input) {
        return {selected: input};
    }
    /**
     * @param {OptionValue|null} input
     * @returns {OptionValue}
     */
    static normalize(input) {
        return input || {selected: null};
    }
    /**
     * @param {OptionValue} value
     * @returns {String}
     */
    static valueToString(value) {
        return `${value.selected}`;
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
 * @param {String} id
 * @param {String} blockTypeName
 * @returns {String}
 */
function createUnitClass(id, blockTypeName) {
    return `j-${blockTypeName}` + (id ? `-${id}` : '');
}

/**
 * @param {String} scss
 * @param {String} selector
 * @param {'cls'|'attr'} selType
 * @returns {String}
 */
function createScss(scss, selector, selType = 'cls') {
    return createSelector(selector, selType) + `{${scss}}`;
}

/**
 * @param {String} selector
 * @param {'cls'|'attr'} selType
 * @returns {String}
 */
function createSelector(selector, selType = 'cls') {
    return selType === 'cls' ? `.${selector}` : `[data-block="${selector}"]`;
}

valueEditors.set('length', LengthValueInput);
valueEditors.set('color', ColorValueInput);
valueEditors.set('option', OptionValueInput);

/**
 * @param {String} scss
 * @param {String} cls
 * @returns {String} cls
 */
function compileScss(scss, cls) {
    return serialize(compile(`.${cls} {${scss}}`), stringify);
}

/**
 * @template T
 * @typedef ValueInputProps
 * @prop {T|null} valueReal
 * @prop {T|null} valueToDisplay
 * @prop {String[]} argsCopy
 * @prop {String} varName
 * @prop {String} valueWrapStr
 * @prop {Boolean} isClearable
 * @prop {String} labelTranslated
 * @prop {(newVal: String) => any} onVarValueChanged
 * @prop {String} selector
 */

/**
 * @typedef VisualStylesProps
 * @prop {Array<CssVar>} vars
 * @prop {Array<StylisAstNode>} ast
 * @prop {(getStyleUpdates: (unitCopy: ThemeStyleUnit) => {newScss: String; newGenerated: String;}) => void} emitVarValueChange
 * @prop {String} scss
 * @prop {String} selector
 */

export default VisualStyles;
export {wc_hex_is_light, ColorValueInput, LengthValueInput, OptionValueInput,
    varNameToLabel, replaceVarValue, valueEditors, createUnitClass,
    createSelector, compileScss};
