import {__, env, timingUtils} from '@sivujetti-commons-for-edit-app';
import {valueEditors} from './scss-ast-funcs.js';

const {serialize, stringify} = window.stylis;

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
    render({unitCls}, {vars}) {
        if (!vars) return;
        return <div class="form-horizontal tight has-color-pickers px-2">{ vars.map(v => {
            const Renderer = valueEditors.get(v.type);
            return <Renderer
                varName={ v.varName }
                valueReal={ {...v.value} }
                argsCopy={ v.args ? [...v.args] : [] }
                isClearable={ false }
                labelTranslated={ __(v.label) }
                onVarValueChanged={ newValAsString => this.debouncedEmitVarValueChange(newValAsString, v.__idx) }
                data={ {selector: `.${unitCls}`} }/>;
        }) }</div>;
    }
    /**
     * @param {VisualStylesProps} props
     * @access private
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

/**
 * @typedef VisualStylesProps
 * @prop {Array<CssVar>} vars
 * @prop {Array<StylisAstNode>} ast
 * @prop {(getStyleUpdates: (unitCopy: ThemeStyleUnit) => {newScss: String; newGenerated: String;}) => void} emitVarValueChange
 * @prop {String} scss
 * @prop {String} selector
 */

export default VisualStyles;
