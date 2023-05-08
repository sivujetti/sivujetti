import {__, env, timingUtils} from '@sivujetti-commons-for-edit-app';
import {observeStore as observeStore2} from '../../store2.js';
import {addSpecializedStyleUnit, blockHasStyle, findBlockTypeStyles, isSpecialUnit,
        removeStyleUnit, tempHack, updateAndEmitUnitScss, normalizeScss, findParentStyleInfo, goToStyle} from './BlockStylesTab.jsx';
import getDefaultVars from './defaultStyleVars.js';
import VisualStyles, {createSel, createUnitClass, replaceVarValue, valueEditors} from './VisualStyles.jsx';

const {serialize, stringify} = window.stylis;

class BlockStylesTab2 extends preact.Component {
    // unregistrables;
    // parentStyleInfo;
    // debouncedEmitVarValueChange;
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState({varBundles: null});
        this.unregistrables = [observeStore2('themeStyles', ({themeStyles}, [_event]) => {
            const units = getUnits(findBlockTypeStyles(themeStyles, this.props.blockType));
            if (!this.state.units || this.state.units !== units) {
                this.parentStyleInfo = findParentStyleInfo(themeStyles, this.props.getBlockCopy());
                this.receiveVars(this.props, units);
            }
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
            if (themeStyles) {
                this.parentStyleInfo = findParentStyleInfo(themeStyles, this.props.getBlockCopy());
                this.receiveVars(props, getUnits(findBlockTypeStyles(themeStyles, blockType)));
            }
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
        const varBundles = createCompositeVars(units, props);
        this.debouncedEmitVarValueChange = timingUtils.debounce(
            this.emitVarValueChange.bind(this),
            env.normalTypingDebounceMillis
        );
        this.setState({varBundles, units, currentBlockType: props.blockType});
    }
    /**
     * @param {String|null} newValAsString
     * @param {VarBundle} vb
     */
    emitVarValueChange(newValAsString, vb) {
        const [_vars, ast] = vb.compileInfo;
        const [node1, node2] = this.getCurrentInfo(vb, ast);
        const isVarDeclOnly = node2 && !node1;
        const isDeclOnly = node1 && !node2;
        const hasBoth = !isVarDeclOnly && !isDeclOnly;
        const exist = isVarDeclOnly || isDeclOnly || hasBoth;
        //
        if (!exist || vb.from === 'defaults' || vb.from === 'admin') {
            if (newValAsString)
                this.addScss(newValAsString, vb);
            else
                this.removeScss(vb);
        } else {
            if (vb.from === 'special') {
                if (newValAsString) {
                    if (isVarDeclOnly || hasBoth) {
                        this.updVarDeclOnly(this.getUnitCopy(vb), node2, newValAsString, ast);
                    } else if (isDeclOnly) {
                        window.console.error('not implemented');
                    }
                } else {
                    this.removeScss(vb);
                }
            } else {
                window.console.error('?');
            }
        }
    }
    /**
     * @param {String} newValAsString Example: '#333333ff', '1rem'
     * @param {VarBundle} vb
     */
    addScss(newValAsString, vb) {
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
    /**
     * @param {VarBundle} vb
     */
    removeScss(vb) {
        const unitCopy = this.getUnitCopy(vb);
        // Example: [
        //     '@exportAs(length)',
        //     '--paddingTop: 3rem;',
        //     '// @exportAs(length)',            <- this
        //     '--minHeight: 12rem;',             <- this
        //     'min-height: var(--minHeight)',    <- maybe this
        // ]
        const lines = unitCopy.scss.split('\n');
        const varDeclPos = lines.findIndex(line => line.trim().startsWith(`--${vb.v.varName}:`));
        const exportAsPos = varDeclPos - 1;
        const removeNumLines = 2 + (!vb.v.comp ? 0 : vb.v.comp.split('\n').length); // @exportAs + --minHeight + maybeThis
        lines.splice(exportAsPos, removeNumLines);
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
    }
    /**
     * @param {ThemeStyleUnit} unitCopy
     * @param {StylisAstNode} varDeclAstNode
     * @param {String} newValAsString Example: '#333333ff', '1rem'
     * @param {Array<StylisAstNode>} ast
     */
    updVarDeclOnly(unitCopy, varDeclAstNode, newValAsString, ast) {
        const varDecl = varDeclAstNode.props; // '--foo'
        updateAndEmitUnitScss(unitCopy, unitCopy => {
            varDeclAstNode.children = newValAsString;
            varDeclAstNode.value = `${varDecl}:${newValAsString};`;
            return {newScss: replaceVarValue(unitCopy.scss, varDeclAstNode, newValAsString),
                    newGenerated: serialize(ast, stringify)};
        }, this.state.currentBlockType);
    }
    /**
     * @param {VarBundle} vb
     * @returns {ThemeStyleUnit}
     */
    getUnitCopy({unitIdx}) {
        const unit = this.state.units[unitIdx];
        return {...unit};
    }
    /**
     * @param {VarBundle} vb
     * @param {Array<StylisAstNode>} ast
     * @returns {[StylisAstNode|null, StylisAstNode|null]}
     */
    getCurrentInfo(vb, ast) {
        let node1 = null;
        let node2 = null;
        for (const {children} of ast) {
            if (!node1) node1 = children.find(node => node.value.indexOf(`var(--${vb.v.varName})`) > -1); // 'something:var(--varName);'
            if (!node2) node2 = children.find(node => node.props === `--${vb.v.varName}`); // '--varName:3rem;'
        }
        return [node1, node2];
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
    render({userCanEditVars}, {currentBlockType, varBundles}) {
        if (!currentBlockType) return null;
        return <div class="has-color-pickers form-horizontal px-2 pt-0">{ varBundles.map(vb => {
            const {v} = vb;
            const Renderer = valueEditors.get(v.type);
            return <Renderer
                valueCopy={ v.value ? {...v.value} : null }
                isClearable={ vb.from === 'special' && vb.v.value !== null }
                argsCopy={ [...v.args] }
                varName={ v.varName }
                label={ v.label }
                onVarValueChanged={ newValAsString => this[newValAsString !== null ? 'debouncedEmitVarValueChange' : 'emitVarValueChange'](newValAsString, vb) }
                unitCls={ 'unitCls' }/>;
        }) }{ userCanEditVars && this.parentStyleInfo && this.parentStyleInfo[2] ? [
            <button
                onClick={ () => goToStyle(this.parentStyleInfo, 'combined-styles-tab') }
                class="btn btn-sm"
                type="button">{ __('Show parent styles') }</button>
        ] : [] }</div>;
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
function createCompositeVars(units, {blockType, blockId, getBlockCopy}) {

    VisualStyles.init();

    const [notSpecial, activeSpecial] = units.reduce((out, itm) =>
        !isSpecialUnit(itm) || itm.id !== blockId ? [out[0].concat(itm), out[1]] : [out[0], itm]
    , [[], null]);

    const partialBlock = {styleClasses: getBlockCopy().styleClasses};
    const activeNotSpecials = notSpecial.filter(({id}) => blockHasStyle(createUnitClass(id, blockType), partialBlock));
    const defaults = getDefaultVars(blockType);
    const adms = activeNotSpecials.map(unit => VisualStyles.extractVars(unit.scss, createUnitClass(unit.id, blockType)));
    const speci = activeSpecial ? VisualStyles.extractVars(activeSpecial.scss, activeSpecial.id, 'attr') : null; // [[v1, v2], ast]

    const out = [];
    const t = (a, b) => ({...a, ...(b.comp ? {comp: b.comp} : {}), ...(b.args ? {args: b.args} : {})});
    for (const def of defaults) {
        const fromSpeci = speci ? speci[0].find(v => v.varName === def.varName) : null;
        if (fromSpeci) {
            out.push({from: 'special', v: t(fromSpeci, def), compileInfo: speci, unitIdx: units.indexOf(activeSpecial)});
            continue;
        }
        const [fromAdmin, idx] = findFrom(adms, def.varName);
        if (fromAdmin) {
            out.push({from: 'special', v: t(fromAdmin, def), compileInfo: adms[idx], unitIdx: units.indexOf(activeNotSpecials[idx])});
            continue;
        }
        out.push({from: 'defaults', v: def, compileInfo: [null, []], unitIdx: defaults.indexOf(def)});
    }

    for (const admin of adms) {
        for (const v of admin[0]) {
            if (out.some(b => b.v.varName === v.varName)) continue;
            const fromSpeci = speci ? speci[0].find(v2 => v2.varName === v.varName) : null;
            if (fromSpeci) {
                out.push({from: 'special', v: t(fromSpeci, {comp: ''/*, args: []?*/}), compileInfo: speci, unitIdx: units.indexOf(activeSpecial)});
                continue;
            }
            const i = adms.indexOf(admin);
            out.push({from: 'admin', v: t(v, {/*comp, args ?*/}), compileInfo: admin, unitIdx: units.indexOf(activeNotSpecials[i])});
        }
    }

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
