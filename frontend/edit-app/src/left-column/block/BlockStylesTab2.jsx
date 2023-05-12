import {__, env, timingUtils, api} from '@sivujetti-commons-for-edit-app';
import {isRemote} from '../../block-styles/commons.js';
import store2, {observeStore as observeStore2} from '../../store2.js';
import {addSpecializedStyleUnit, blockHasStyle, findBlockTypeStyles, isSpecialUnit,
        removeStyleUnit, tempHack, updateAndEmitUnitScss, normalizeScss,
        findParentStyleInfo, goToStyle, findRealUnit} from './BlockStylesTab.jsx';
import VisualStyles, {createSelector, createUnitClass, replaceVarValue, valueEditors} from './VisualStyles.jsx';

const {serialize, stringify} = window.stylis;

class BlockStylesTab2 extends preact.Component {
    // unregistrables;
    // blockCopy;
    // parentStyleInfo;
    // debouncedEmitVarValueChange;
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState({varBundles: null});
        this.unregistrables = [observeStore2('themeStyles', ({themeStyles}, [_event]) => {
            const units = getUnits(findBlockTypeStyles(themeStyles, this.props.blockTypeName));
            if (!this.state.units || this.state.units !== units)
                this.receiveVars(this.props, units, themeStyles);
        })];
        this.props.grabBlockChanges((block, _origin, _isClsChangeOnly, _isUndo) => {
            if (this.blockCopy && this.blockCopy.styleClasses !== block.styleClasses) {
                const {themeStyles} = store2.get();
                const units = getUnits(findBlockTypeStyles(themeStyles, this.props.blockTypeName));
                this.receiveVars(this.props, units, themeStyles, false);
            }
        });
    }
    /**
     * @param {StylesTab2Props} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        const {isVisible, blockTypeName, blockId} = props;
        if (!this.blockCopy || this.blockCopy.type !== props.blockTypeName)
            this.blockCopy = props.getBlockCopy();
        if (isVisible && (
            !this.state.currentBlockType ||
            (blockTypeName !== this.props.blockTypeName || blockId !== this.props.blockId)
        )) {
            const themeStyles = tempHack();
            if (themeStyles)
                this.receiveVars(props, getUnits(findBlockTypeStyles(themeStyles, blockTypeName)), themeStyles);
        } else if (this.state.currentBlockType && !isVisible) {
            this.setState({currentBlockType: null});
            this.blockCopy = null;
        }
    }
    /**
     * @param {StylesTab2Props} props
     * @param {Array<ThemeStyleUnit>} units
     * @param {Array<ThemeStyle>} themeStyles
     * @param {Boolean} updateParentStyleInfo = true
     * @access private
     */
    receiveVars(props, units, themeStyles, updateParentStyleInfo = true) {
        this.blockCopy = props.getBlockCopy();
        if (updateParentStyleInfo) this.parentStyleInfo = findParentStyleInfo(themeStyles, this.blockCopy);
        //
        const varBundles = this.createCompositeVars(units, props, themeStyles);
        this.debouncedEmitVarValueChange = timingUtils.debounce(
            this.emitVarValueChange.bind(this),
            env.normalTypingDebounceMillis
        );
        this.setState({varBundles, units, currentBlockType: props.blockTypeName});
    }
    /**
     * @param {String|null} newValAsString
     * @param {VarBundle} vb
     */
    emitVarValueChange(newValAsString, vb) {
        const [_vars, ast] = vb.compileInfo;
        const [_, node2] = this.getCurrentInfo(vb, ast);
        if (!vb.existsInSpecial && newValAsString)
            this.addScss(newValAsString, vb);
        else if (newValAsString === null)
            this.removeScss(vb);
        else if (newValAsString && vb.existsInSpecial)
            this.updVarDeclOnly(this.getUnitCopy(vb), node2, newValAsString, ast);
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
                !v.wrap ? [] : [
                    le, normalizeScss(v.wrap.replace(/%s/g, vn))
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
            addSpecializedStyleUnit(scss, this.props.blockTypeName, this.props.blockId);
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
        const removeNumLines = 2 + (!vb.v.wrap ? 0 : vb.v.wrap.split('\n').length); // @exportAs + --minHeight + maybeThis
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
            removeStyleUnit(this.props.blockTypeName, unitCopy);
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
        const emitChange = (v, i) => this[v !== null ? 'debouncedEmitVarValueChange' : 'emitVarValueChange'](v, this.state.varBundles[i]);
        return varBundles.length
            ? <div class="has-color-pickers form-horizontal tight px-2 pt-0">{ varBundles.map((vb, i) => {
                const {v} = vb;
                const Renderer = valueEditors.get(v.type);
                return <Renderer
                    valueCopy={ v.value ? {...v.value} : null }
                    argsCopy={ [...v.args] }
                    varName={ v.varName }
                    valueWrapStr={ v.wrap }
                    isClearable={ vb.existsInSpecial && vb.v.value !== null }
                    labelTranslated={ __(v.label) }
                    onVarValueChanged={ newValAsString => emitChange(newValAsString, i) }
                    selector={ createSelector(this.props.blockId, 'attr') }/>;
            }) }{ userCanEditVars && this.parentStyleInfo && this.parentStyleInfo[2] ? [
                <button
                    onClick={ () => goToStyle(this.parentStyleInfo, 'combined-styles-tab') }
                    class="btn btn-sm"
                    type="button">{ __('Show parent styles') }</button>
            ] : [] }</div>
            : <div class="color-dimmed px-2 pt-1">{ __('No editable styles.') }</div>;
    }
    /**
     * @param {Array<ThemeStyleUnit>} units
     * @param {StylesTab2Props} props
     * @returns {Array<VarBundle>}
     */
    createCompositeVars(units, {blockTypeName, blockId}, themeStyles) {

        VisualStyles.init();

        const [notSpecial, activeSpecial] = units.reduce((out, itm) =>
            !isSpecialUnit(itm) || itm.id !== blockId
                ? [[findRealUnit(itm, blockTypeName, themeStyles), ...out[0]], out[1]]
                : [out[0], itm]
        , [[], null]);
        const partialBlock = {styleClasses: this.blockCopy.styleClasses};
        const activeNotSpecials = notSpecial.filter(unit => (!isRemote(unit)
            ? blockHasStyle(createUnitClass(unit.id, blockTypeName), partialBlock, false)
            : blockHasStyle(unit.id, partialBlock, true)));
        const defaults = api.blockStyles.getDefaultVars(blockTypeName);
        const adms = activeNotSpecials.map(unit => VisualStyles.extractVars(unit.scss, createUnitClass(unit.id, blockTypeName)));
        const speci = activeSpecial ? VisualStyles.extractVars(activeSpecial.scss, activeSpecial.id, 'attr') : null; // [[v1, v2], ast]

        const out = [];
        for (const def of defaults) {
            const fromSpeci = speci ? speci[0].find(v => v.varName === def.varName) : null;
            if (fromSpeci) {
                out.push({from: 'defaults', existsInSpecial: true, v: createDetailedVar(fromSpeci, def),
                    compileInfo: speci, unitIdx: units.indexOf(activeSpecial)});
                continue;
            }
            const [fromAdmin, idx] = findFrom(adms, def.varName);
            if (fromAdmin) {
                out.push({from: 'defaults', existsInSpecial: false, v: createDetailedVar(fromAdmin, def),
                    compileInfo: adms[idx], unitIdx: units.indexOf(activeNotSpecials[idx])});
                continue;
            }
            out.push({from: 'defaults', existsInSpecial: false, v: def, compileInfo: [null, []], unitIdx: defaults.indexOf(def)});
        }

        for (const admin of adms) {
            for (const v of admin[0]) {
                if (out.some(b => b.v.varName === v.varName)) continue;
                const fromSpeci = speci ? speci[0].find(v2 => v2.varName === v.varName) : null;
                if (fromSpeci) {
                    out.push({from: 'admin', existsInSpecial: true, v: createDetailedVar(fromSpeci, {wrap: ''/*, no args*/}),
                        compileInfo: speci, unitIdx: units.indexOf(activeSpecial)});
                    continue;
                }
                const i = adms.indexOf(admin);
                out.push({from: 'admin', existsInSpecial: false, v: createDetailedVar(v, {/*no wrap, no args*/}),
                    compileInfo: admin, unitIdx: units.indexOf(activeNotSpecials[i])});
            }
        }

        return out;
    }
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
 * @param {CssVar} a
 * @param {CssVar & {wrap: String;}} b
 * @returns {CssVar & {wrap: String;}}
 */
function createDetailedVar(a, b) {
    return {...a, ...(b.wrap ? {wrap: b.wrap} : {}), ...(b.args ? {args: b.args} : {})};
}

/**
 * @typedef VarBundle
 * @prop {'admin'|'defaults'} from
 * @prop {Boolean} existsInSpecial
 * @prop {CssVar} v
 * @prop {[Array<CssVar>, Array<Object>]} compileInfo
 * @prop {Number} unitIdx
 *
 * @typedef StylesTab2Props
 * @prop {() => RawBlock} getBlockCopy
 * @prop {String} blockTypeName
 * @prop {String} blockId
 * @prop {Boolean} userCanEditVars
 * @prop {Boolean} isVisible
 * @prop {(withFn: (block: RawBlock, origin: blockChangeEvent, isClsChangeOnly: Boolean, isUndo: Boolean) => void) => void} grabBlockChanges
 */

export default BlockStylesTab2;
