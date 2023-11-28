import {__, env, timingUtils} from '@sivujetti-commons-for-edit-app';
import {valueEditors, replaceVarValue} from './scss-ast-funcs.js';

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
 * @typedef VisualStylesProps
 * @prop {Array<CssVar>} vars
 * @prop {Array<StylisAstNode>} ast
 * @prop {(getStyleUpdates: (unitCopy: ThemeStyleUnit) => {newScss: String; newGenerated: String;}) => void} emitVarValueChange
 * @prop {String} scss
 * @prop {String} selector
 */

export default VisualStyles;
