const valueEditors = new Map;

class VisualStyles extends preact.Component {
    /**
     * @param {{vars: Array<CssVar>; ast: Array<Object>;}} props
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
    render(_, {vars}) {
        if (!vars) return;
        return <div class="form-horizontal px-2 ">{ vars.map(v => {
            const Renderer = valueEditors.get(v.type);
            return <div class="form-group mr-1">
                <div class="col-3 text-ellipsis"><label class="form-label" title={ v.label }>{ v.label }</label></div>
                <Renderer valueCopy={ Object.assign({}, v.value) }/>
            </div>;
        }) }</div>;
    }
    /**
     * In: '// @exportAs(length)\n--fontSize: 2.4rem;\n// @exportAs(color)\n--fontColor:#000000'
     * Out: [[{type: 'length', value: {num: '2.4'; unit: 'rem'}, label: 'fontSize', __idx: 1},
     *        {type: 'color', value: {data: todo; type: 'hex'}, label: 'fontColor', __idx: 2}], [...]]
     *
     * @param {String} scss
     * @param {String} cls
     * @returns {[Array<CssVar>, Array<Object>]} [vars, stylisAst]
     */
    static extractVars(scss, cls) {
        const ast = window.stylis.compile(`.${cls}{${scss}}`);
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
     * @param {{valueCopy: LengthValue;}} props
     */
    render({valueCopy}) {
        return <div class="col-9">
            <div class="input-group">
                <input class="form-input input-sm" type="text" value={ valueCopy.num } placeholder="1.4" onInput={ e=>'this.foo(e)' }/>
                <span class="input-group-addon addon-sm">{ valueCopy.unit }</span>
            </div>
        </div>;
    }
}

class ColorValueInput extends preact.Component {
    /**
     * @param {{valueCopy: ColorValue;}} props
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
    return varName;
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
