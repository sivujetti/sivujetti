import {env, timingUtils} from '@sivujetti-commons-for-edit-app';
import {observeStore as observeStore2} from '../../store2.js';
import {addSpecializedStyleUnit, blockHasStyle, findBlockTypeStyles, isSpecialUnit,
        removeStyleUnit, tempHack, updateAndEmitUnitScss, normalizeScss} from './BlockStylesTab.jsx';
import getDefaultVars from './defaultStyleVars.js';
import VisualStyles, {createUnitClass, replaceVarValue, valueEditors} from './VisualStyles.jsx';

const {serialize, stringify} = window.stylis;

class BlockStylesTab2 extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState({varBundles: null});
        this.unregistrables = [observeStore2('themeStyles', ({themeStyles}, [_event]) => {
            const units = getUnits(findBlockTypeStyles(themeStyles, this.props.blockType));
            if (!this.state.units || this.state.units.length !== units.length)
                this.receiveVars(this.props, units);
        }),
        ];
    }
    /**
     * @param {StylesTab2Props} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        const {isVisible, blockType, blockId} = props;
        if (isVisible && (!this.state.currentBlockType || (blockType !== this.props.blockType || blockId !== this.props.blockId))) {
            const themeStyles = tempHack();
            if (themeStyles)
                this.receiveVars(props, getUnits(findBlockTypeStyles(themeStyles, blockType)));
        } else if (this.state.currentBlockType && !isVisible) {
            this.setState({currentBlockType: null});
        }
    }
    /**
     * @param {StylesTab2Props} props
     * @param {Array<ThemeStyleUnit>} units
     * @access private
     */
    receiveVars(props, units) {
        const varBundles = createCompositeStyles(units, props);
        //
        this.debouncedEmitVarValueChange = timingUtils.debounce(
        /**
         * @param {String|null} newValAsString
         * @param {VarBundle} vb
         */
        (newValAsString, vb) => {
            const [_vars, ast] = vb.compileInfo;
            if (ast.length) { // non-empty admin or special

                const unit = this.state.units[vb.unitIdx]; // ??
                const unitCopy = Object.assign({}, unit);

                let node1, node2;
                for (const {children} of ast) {
                    if (!node1) node1 = children.find(node => node.value.indexOf(`var(--${vb.v.varName})`) > -1); // 'something:var(--varName);'
                    if (!node2) node2 = children.find(node => node.props === `--${vb.v.varName}`); // '--varName:3rem;'
                }
                const isVarDecl = !node1;

                const varDecl = node2.props; // '--foo'

                if (vb.from === 'special' && !isVarDecl && !newValAsString) { // something:var(--varName);
                    // Example: [
                    //     '@exportAs(length)',
                    //     '--paddingTop: 3rem;',
                    //     '// @exportAs(length)',
                    //     '--minHeight: 12rem;',
                    //     'min-height: var(--minHeight)',
                    // ]
                    const lines = unitCopy.scss.split(/\n/);
                    const varDeclPos = lines.findIndex(line => line.trim().startsWith(`--${vb.v.varName}:`));
                    const removeNumLines = vb.v.comp.split('\n').length + 2; // lines + @exportAs + --varDecl
                    lines.splice(varDeclPos - 1, removeNumLines);
                    //
                    if (lines.length)
                        updateAndEmitUnitScss(unitCopy, unitCopy => {
                            const n = lines.join('\n');
                            const newAst = VisualStyles.extractVars(n, unitCopy.id, 'attr')[1];
                            return {newScss: n,
                                    newGenerated: serialize(newAst, stringify)};
                        }, this.state.currentBlockType);
                    else
                        removeStyleUnit(this.props.blockType, unitCopy);
                } else { // --varName:3rem;
                updateAndEmitUnitScss(unitCopy, unitCopy => {
                    node2.children = newValAsString;
                    node2.value = `${varDecl}:${newValAsString};`;
                    return {newScss: replaceVarValue(unitCopy.scss, node2, newValAsString),
                            newGenerated: serialize(ast, stringify)};
                }, this.state.currentBlockType);
                }

            } else { // default, not found from special nor admin ??
                const le = '\n'; // ??
                const unit = this.state.units.find(({id}) => id === this.props.blockId); // ??
                const createSpecialScss = v => {
                    const vn = `--${v.varName}`;
                    return [...[
                        '// @exportAs(', v.type, ')', le,
                        `${vn}: ${newValAsString};`
                    ], ...(
                        !v.comp ? [] : [
                            le, normalizeScss(v.comp.replace(/%s/g, vn))
                        ]
                    )];
                };
                if (unit) {
                const unitCopy = Object.assign({}, unit);
                updateAndEmitUnitScss(unitCopy, unitCopy => {
                    const newScss = [
                        ...[unitCopy.scss, le],
                        ...createSpecialScss(vb.v)
                    ].join('');
                    const newAst = VisualStyles.extractVars(newScss, unit.id, 'attr')[1];
                    return {newScss, newGenerated: serialize(newAst, stringify)};
                }, this.state.currentBlockType);
                } else {
                    const scss = createSpecialScss(vb.v).join('');
                    addSpecializedStyleUnit(scss, this.props.blockType, this.props.blockId);
                }
            }
        }, env.normalTypingDebounceMillis);
        this.setState({varBundles, units, currentBlockType: props.blockType});
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unregistrables.forEach(unreg => unreg());
    }
    /**
     * @access protected
     */
    render(_, {currentBlockType, varBundles}) {
        if (!currentBlockType) return null;
        return <div class="has-color-pickers form-horizontal px-2">{ varBundles.map(vb => {
            const {v} = vb;
            const Renderer = valueEditors.get(v.type);
            return <Renderer
                showNul={ v.type === 'Color' /*??*/}
                valueCopy={ v.value ? {...v.value} : null }
                argsCopy={ [...v.args] }
                varName={ v.varName }
                label={ v.label }
                onVarValueChanged={ newValAsString => this.debouncedEmitVarValueChange(newValAsString, vb) }
                unitCls={ 'unitCls' }/>;
        }) }</div>;
    }
    /**
     * @returns {String}
     * @access private
     */
    createUnitId() {
        const {blockId, blockType} = this.props;
        return `j-${blockType}-${blockId}`;
    }
}

/**
 * @param {Array<ThemeStyleUnit>} units
 * @param {StylesTab2Props} props
 * @returns {Array<VarBundle>}
 */
function createCompositeStyles(units, {blockType, blockId, getBlockCopy}) {

    const [notSpecial, special] = units.reduce((out, itm) =>
        !isSpecialUnit(itm) ? [out[0].concat(itm), out[1]] : [out[0], itm]
    , [[], null]);

    const partialBlock = {styleClasses: getBlockCopy().styleClasses};
    const activeNotSpecials = notSpecial.filter(({id}) => blockHasStyle(createUnitClass(id, blockType), partialBlock));
    const activeSpecial = special && special.id === blockId ? special : null;

    const defaults = getDefaultVars(blockType);
    const adms = activeNotSpecials.map(unit => VisualStyles.extractVars(unit.scss, createUnitClass(unit.id, blockType)));
    const speci = activeSpecial ? VisualStyles.extractVars(special.scss, special.id, 'attr') : null; // [[v1, v2], ast]

    const out = [];

    for (const def of defaults) {
        const fromSpeci = activeSpecial ? speci[0].find(v => v.varName === def.varName) : null;
        if (fromSpeci) {
            out.push({from: 'special', v: {...fromSpeci, ...{comp: def.comp}}, compileInfo: speci, unitIdx: units.indexOf(activeSpecial)});
            continue;
        }
        const [fromAdmin, idx] = findFrom(adms, def.varName);
        if (fromAdmin) {
            out.push({from: 'admin', v: fromAdmin, compileInfo: adms[idx], unitIdx: notSpecial.indexOf(activeNotSpecials[idx])});
            continue;
        }
        out.push({from: 'defaults', v: def, compileInfo: [null, []], unitIdx: defaults.indexOf(def)});
    }

    // todo add admin styles

    return out;
}

/**
 * @returns {[CssVar|null, Number]}
 */
function findFrom(items, varName) {
    for (let i = 0; i < items.length; ++i) {
        const [vars, _ast] = items[i];
        const found = vars.find(v => v.varName === varName);
        if (found) return [found, i];
    }
    return [null, -1];
}

/**
 * @param {ThemeStyle|null} style
 * @returns {Array<ThemeStyleUnit>}
 */
function getUnits(style) {
    return style ? style.units : [];
}

/**
 * @typedef VarBundle
 * @prop {'special'|'admin'|'defaults'} from
 * @prop {CssVar} v
 * @prop {[Array<CssVar>, Array<Object>]} compileInfo
 * @prop {Number} unitIdx
 *
 * @typedef StylesTab2Props
 * todo
 */

export default BlockStylesTab2;
