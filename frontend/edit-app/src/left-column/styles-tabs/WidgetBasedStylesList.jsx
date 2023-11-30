import {__} from '@sivujetti-commons-for-edit-app';
import ContextMenu from '../../commons/ContextMenu.jsx';
import store2, {observeStore as observeStore2} from '../../store2.js';
import {createUnitClass, createUnitClassSpecial, findBlockTypeStyles,
        findBodyStyle, findRealUnit, isBodyRemote, SPECIAL_BASE_UNIT_NAME,
        updateAndEmitUnitScss} from './styles-tabs-common.js';
import EditableTitle from './EditableTitle.jsx';
import {createAddableUnits, createDataPropForValueInputRenderer, getBaseUnit, getEditableUnits,
        getEnabledUnits, removeStyleClassMaybeRemote, removeStyleUnitMaybeRemote,
        withoutAppendix, createVarInsights, compileScss} from './widget-based-tab-funcs.js';
import ScreenSizesVerticalTabs from './ScreenSizesVerticalTabs.jsx';
import {splitToScreenSizeParts, joinFromScreenSizeParts,
        expandToInternalRepr, optimizeFromInternalRepr, withApdxes,
        OPT_SCSS_SPLIT_MARKER} from './scss-manip-funcs.js';
import {extractVars, replaceVarValue, valueEditors, varNameToLabel} from './scss-ast-funcs.js';

class WidgetBasedStylesList extends preact.Component {
    // unregistrables;
    // editableTitleInstances;
    // moreMenu;
    // curBlockStyleClasses;
    // bodyStyle;
    /**
     * @access protected
     */
    componentWillMount() {
        this.unregistrables = [];
        this.editableTitleInstances = [];
        this.moreMenu = preact.createRef();
        this.curBlockStyleClasses = this.props.blockCopy.styleClasses;
        this.bodyStyle = findBodyStyle(store2.get().themeStyles);
        const createStateCandidate = themeStyles => {
            const blockCopy = this.curBlockStyleClasses !== this.props.blockCopy.styleClasses
                ? {...this.props.blockCopy, ...{styleClasses: this.curBlockStyleClasses}}
                : this.props.blockCopy;
            const unitsOfThisBlockType = findBlockTypeStyles(themeStyles, blockCopy.type)?.units || [];
            const unitsEnabled = getEnabledUnits(unitsOfThisBlockType, this.bodyStyle.units, blockCopy);
            return {blockCopy, unitsOfThisBlockType, unitsEnabled};
        };
        const updateState = ({blockCopy, unitsOfThisBlockType, unitsEnabled}) => {
            const state = this.createNewState(unitsOfThisBlockType, blockCopy, unitsEnabled);
            this.editableTitleInstances = state.itemsToShow.map(_ => preact.createRef());
            this.setState(state);
        };
        updateState(createStateCandidate(store2.get().themeStyles));
        //
        observeStore2('themeStyles', ({themeStyles}, [_event]) => {
            const candidate = createStateCandidate(themeStyles);
            if (
                // Additions, deletions for example
                this.state.unitsOfThisBlockType !== candidate.unitsOfThisBlockType ||
                // Changes of remote unit scss
                (this.state.unitsEnabled || []) !== candidate.unitsEnabled
            ) {
                updateState(candidate);
            }
        });
    }
    /**
     * @param {StylesListProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        //
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
    render({blockCopy, userCanEditVisualStyles}, {itemsToShow}) {
        const [curTabIdx, setCurTabIdx] = preactHooks.useState(0);
        return [itemsToShow.length
            ? <ul class="list styles-list mb-2">{ itemsToShow.map((itm, i) => {
                const {unit, screenSizesScss, isDefault, cls} = itm;
                const key = unit.id;
                const curScreenSizeTabScss = screenSizesScss[curTabIdx];
                const [cssVars, ast] = extractVars(curScreenSizeTabScss, 'dummy');
                const varsInsights = (function () {
                    if (!unit.derivedFrom) return []; // todo
                    const baseScss = itm.parenPartScssApdxified;
                    const [baseVars, _baseAst] = extractVars(baseScss, 'dummy');
                    return createVarInsights(cssVars, baseVars);
                })();
                return <li key={ key } class="open">
                    <header class="flex-centered p-relative">
                        <b
                            onClick={ e => this.handleLiClick(e, i, isDefault) }
                            class="col-12 btn btn-link text-ellipsis with-icon mt-0 mr-1 pt-0 pb-0 pl-1 no-color"
                            type="button">
                            <EditableTitle
                                unitId={ unit.id }
                                unitIdReal={ unit.id }
                                currentTitle={ unit.title }
                                blockTypeName={ blockCopy.type }
                                allowEditing={ userCanEditVisualStyles
                                    ? true               // admin user -> always
                                    : !!unit.derivedFrom // non-admin -> onyl if this unit is derived
                                }
                                subtitle={ isDefault ? [__('Default'), unit.specifier ? ` (${unit.specifier})` : ''].join('') : null }
                                subtitleMarginLeft={ 0.3 }
                                ref={ this.editableTitleInstances[i] }/>
                        </b>
                    </header>
                    <ScreenSizesVerticalTabs curTabIdx={ curTabIdx } setCurTabIdx={ setCurTabIdx }>
                        <div class="form-horizontal tight has-color-pickers pt-0 px-2">{ cssVars.length ? cssVars.map((cssVar, i2) => {
                            const Renderer = valueEditors.get(cssVar.type);
                            const insights = varsInsights[i2] || {};
                            const valueIsClearable = insights.hasBaseValue === false;
                            return <Renderer
                                varName={ cssVar.varName }
                                valueReal={ {...cssVar.value} }
                                argsCopy={ cssVar.args ? [...cssVar.args] : [] }
                                data={ createDataPropForValueInputRenderer(cssVar, unit, cls, [
                                    null,
                                    '@media (max-width: 960px) { ',
                                    '@media (max-width: 840px) { ',
                                    '@media (max-width: 600px) { ',
                                    '@media (max-width: 480px) { ',
                                ][curTabIdx]) }
                                isClearable={ valueIsClearable }
                                labelTranslated={ __(varNameToLabel(withoutAppendix(cssVar.varName))) }
                                onVarValueChanged={ newValAsString => {
                                    this.emitVarValueChange(newValAsString, cssVar, ast, itm, insights, curTabIdx);
                                } }
                                noticeDismissedWith={ accepted => {
                                    `if (accepted) // Do create copy, replace block's cssClass '-unit-<old>' -> '-unit-<newCopy>'
                                        this.addUnitManyUnitClones(mutatedStyleInfo);
                                    dismissedCopyStyleNotices[this.props.blockCopy.__duplicatedFrom] = 'dismissed';
                                    this.setState({mutatedStyleInfo: null})`;
                                } }
                                key={ `${key}-${cssVar.varName}` }/>;
                        }) : <div class="pt-1">{ __('This style does not have editable values.') }</div> }</div>
                    </ScreenSizesVerticalTabs>
                </li>;
            }) }</ul>
            : <p class="pt-1 mb-2 color-dimmed">{ __('No own styles') }.</p>,
            <ContextMenu
                links={ this.createContextMenuLinks([
                    {text: __('Deactivate'), title: __('Deactivate style'), id: 'deactivate-style'}
                ]) }
                onItemClicked={ this.handleMoreMenuLinkClicked.bind(this) }
                onMenuClosed={ () => { this.refElOfOpenMoreMenu.style.opacity = ''; } }
                ref={ this.moreMenu }/>
            ];
    }
    /**
     * @param {Array<ThemeStyleUnit>} unitsOfThisBlockType
     * @param {Array<RawBlock>} blockCopy
     * @param {Array<ThemeStyleUnit>|null} unitsEnabled = null
     * @access private
     */
    createNewState(unitsOfThisBlockType, blockCopy, unitsEnabled = null) {
        if (unitsEnabled === null)
            unitsEnabled = getEnabledUnits(unitsOfThisBlockType, this.bodyStyle.units, blockCopy);
        const userIsTechnical = !this.props.useVisualStyles;
        const [unitsToShow, addable] = unitsEnabled !== null
            ? [
                getEditableUnits(unitsEnabled, userIsTechnical),
                createAddableUnits(unitsOfThisBlockType, unitsEnabled, blockCopy.type, userIsTechnical)
            ] : [
                null,
                null
            ];
        return {
            itemsToShow: unitsToShow.map(unit => {
                let screenSizesScss;
                let parenPartScssApdxified;
                if (!unit.derivedFrom) {
                    const screenSizesScss1 = splitToScreenSizeParts(unit.scss);
                    const basePart = screenSizesScss1[0];
                    parenPartScssApdxified = null;
                    screenSizesScss = screenSizesScss1.map((p, i) => i > 0
                        ? expandToInternalRepr(`${p.indexOf(OPT_SCSS_SPLIT_MARKER) < 0 ? OPT_SCSS_SPLIT_MARKER : ''}${p}`, basePart)
                        : p);
                } else {
                    const screenSizesScss1 = splitToScreenSizeParts(unit.scss);
                    const parenUnit = getBaseUnit(unit, unitsOfThisBlockType);
                    const basePart = splitToScreenSizeParts(parenUnit.scss)[0];
                    parenPartScssApdxified = withApdxes(basePart, 'u5');
                    screenSizesScss = screenSizesScss1.map(p => expandToInternalRepr(p, parenPartScssApdxified, null));
                }
                const isDefault = isBodyRemote(unit.id);
                return {
                    unit,
                    parenPartScssApdxified,
                    screenSizesScss,
                    isDefault,
                    cls: !isDefault ? createUnitClass(unit.id, blockCopy.type) : createUnitClassSpecial(unit.id, blockCopy.type),
                };
            }),
            addable,
            unitsOfThisBlockType,
            unitsEnabled
        };
    }
    /**
     * @param {String|null} newVal
     * @param {CssVar} cssVar
     * @param {Array<StylisAstNode>} ast
     * @param {WidgetBasedStyleListItem} item
     * @param {UnitVarInsights} insights
     * @param {Number} partIdx
     * @access private
     */
    emitVarValueChange(newVal, cssVar, ast, {unit, screenSizesScss, cls}, {baseValueLiteral, hasBaseValue}, partIdx) {
        let val, partToOptimized;
        if (!unit.derivedFrom) {
            val = newVal;
            const baseUnitScss = screenSizesScss[0];
            partToOptimized = (p, i) => i > 0 ? optimizeFromInternalRepr(p, baseUnitScss) : p;
        } else {
            if ((newVal !== null && hasBaseValue === false) || // already had custom val (update var val)
                (newVal !== null && hasBaseValue === true) || // has default val (add var)
                (newVal === null && hasBaseValue === false)) { // already has custom, but new is null (clear var)
                val = newVal || baseValueLiteral;
                const baseUnitScss = getBaseUnit(unit, this.state.unitsOfThisBlockType).scss;
                partToOptimized = p => optimizeFromInternalRepr(p, baseUnitScss);
            }
        }
        if (partToOptimized) updateAndEmitUnitScss(unit, () => {
            const node = ast[0].children[cssVar.__idx];
            const varDecl = node.props; // '--foo'
            node.children = val;
            node.value = `${varDecl}:${val};`;
            const partUpdated = replaceVarValue(screenSizesScss[partIdx], node, val);
            const updatedPartsIR = screenSizesScss.map((s, i) => i !== partIdx ? s : partUpdated);
            const updatedParts = updatedPartsIR.map(partToOptimized);
            const asString = joinFromScreenSizeParts(updatedParts);
            return {newScss: asString,
                    newGenerated: compileScss(asString, cls)};
        }, !unit.origin ? this.props.blockCopy.type : SPECIAL_BASE_UNIT_NAME);
    }
    /**
     * @param {Event} e
     * @param {Number} i
     * @param {Boolean} isBodyRemote
     * @access private
     */
    handleLiClick(e, i, isBodyRemote) {
        if (this.props.userCanEditCss && this.editableTitleInstances[i].current.isOpen()) return;
        //
        const moreMenuIconEl = e.target.classList.contains('edit-icon-outer') ? e.target : e.target.closest('.edit-icon-outer');
        if (moreMenuIconEl) {
            this.liIdxOfOpenMoreMenu = i;
            this.refElOfOpenMoreMenu = moreMenuIconEl;
            this.refElOfOpenMoreMenu.style.opacity = '1';
            this.moreMenu.current.open({target: moreMenuIconEl}, !isBodyRemote
                ? links => links
                : links => links.filter(({id}) => id !== 'deactivate-style'));
        }
    }
    /**
     * @param {ContextMenuLink} link
     * @returns {Boolean}
     * @access protected
     */
    handleMoreMenuLinkClicked({id}) {
        if (id === 'edit-style-title') {
            this.editableTitleInstances[this.liIdxOfOpenMoreMenu].current.open();
            return true;
        }
        if (id === 'deactivate-style') {
            const [unit] = this.getOpenUnit();
            removeStyleClassMaybeRemote(unit, this.props.blockCopy);
            return true;
        }
        if (id === 'delete-style') {
            const [unit, arr, isCodeBased] = this.getOpenUnit();
            if (isCodeBased) {
                const maybeRemote = findRealUnit(unit, this.props.blockCopy.type);
                if (maybeRemote.isDerivable && arr.some(unit => unit.derivedFrom === maybeRemote.id)) {
                    alert(__('This template has derivates and cannot be deleted.'));
                    return true;
                }
            }
            removeStyleUnitMaybeRemote(unit, this.props.blockCopy);
            return true;
        }
        return false;
    }
    /**
     * @param {Array<MenuLink>} moreLinks
     * @returns {Array<MenuLink>}
     * @access protected
     */
    createContextMenuLinks(moreLinks) {
        return [
            {text: __('Edit name'), title: __('Edit name'), id: 'edit-style-title'},
            ...moreLinks,
        ];
    }
}

/**
 * @typedef WidgetBasedStyleListItem
 * @prop {ThemeStyleUnit} unit
 * @prop {String|null} parenPartScssApdxified
 * @prop {Array<String>} screenSizesScss
 * @prop {Boolean} isDefault
 * @prop {String} cls
 */

export default WidgetBasedStylesList;
