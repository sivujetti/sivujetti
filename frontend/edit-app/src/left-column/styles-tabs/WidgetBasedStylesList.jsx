import {__, api} from '@sivujetti-commons-for-edit-app';
import ContextMenu from '../../commons/ContextMenu.jsx';
import store2, {observeStore as observeStore2} from '../../store2.js';
import {createUnitClass, emitCommitStylesOp, findBodyStyle, isBodyRemote,
        SPECIAL_BASE_UNIT_NAME, updateAndEmitUnitScss} from './styles-tabs-common.js';
import EditableTitle from './EditableTitle.jsx';
import {createAddableUnits, createDataPropForValueInputRenderer, getBaseUnit,
        getEnabledUnits, withoutAppendix, varsToInsights, createAddUnitsDropdownList,
        emitAddStyleClassToBlock, getEditableUnits} from './widget-based-tab-funcs.js';
import ScreenSizesVerticalTabs from './ScreenSizesVerticalTabs.jsx';
import {splitToScreenSizeParts, joinFromScreenSizeParts,
        expandToInternalRepr, optimizeFromInternalRepr, withApdxes,
        OPT_SCSS_SPLIT_MARKER} from './scss-manip-funcs.js';
import {extractVars, replaceVarValue, valueEditors, varNameToLabel} from './scss-ast-funcs.js';
import AbstractStylesList, {getUnitsOfBlockType, createListItem,
                            getLargestPostfixNum, compileScss} from './AbstractStylesList.jsx';

class WidgetBasedStylesList extends AbstractStylesList {
    // unregistrables;
    // curBlockStyleClasses;
    // bodyStyle;
    /**
     * @access protected
     */
    componentWillMount() {
        super.componentWillMount();
        this.unregistrables = [];
        this.curBlockStyleClasses = this.props.blockCopy.styleClasses;
        this.bodyStyle = findBodyStyle(store2.get().themeStyles);
        const createStateCandidate = themeStyles => {
            const blockCopy = this.curBlockStyleClasses !== this.props.blockCopy.styleClasses
                ? {...this.props.blockCopy, ...{styleClasses: this.curBlockStyleClasses}}
                : this.props.blockCopy;
            const unitsOfThisBlockType = getUnitsOfBlockType(themeStyles, blockCopy.type);
            const unitsEnabled = getEnabledUnits(unitsOfThisBlockType, this.bodyStyle.units, blockCopy);
            return {blockCopy, unitsOfThisBlockType, unitsEnabled};
        };
        const updateState = ({blockCopy, unitsOfThisBlockType, unitsEnabled}) => {
            const state = this.createNewState(unitsOfThisBlockType, blockCopy, unitsEnabled);
            this.receiveUnits(state.itemsToShow);
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
    render({blockCopy, userCanEditVisualStyles}, {itemsToShow, curTabIdxs, addable, selectOptions}) {
        return [itemsToShow.length
            ? <ul class="list styles-list mb-2">{ itemsToShow.map((itm, i) => {
                const {unit, screenSizesScss, isDefault, cls} = itm;
                const key = unit.id;
                const curTabIdx = curTabIdxs[i];
                const curScreenSizeTabScss = screenSizesScss[curTabIdx];
                const [cssVars, ast] = extractVars(curScreenSizeTabScss, 'dummy');
                const varsInsights = !unit.derivedFrom && curTabIdx === 0 ? [] : varsToInsights(cssVars, extractVars(itm.baseScss, 'dummy')[0]);
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
                    <ScreenSizesVerticalTabs
                        curTabIdx={ curTabIdx }
                        setCurTabIdx={ to => this.setState(ScreenSizesVerticalTabs.createTabIdxesWithNewCurrentIdx(curTabIdxs, i, to)) }>
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
            selectOptions.length
                ? <span class="btn btn-dropdown p-relative d-inline-flex btn-primary btn-sm mr-1">
                    <label htmlFor="addStyleDropdown">{ __('Add style') }</label>
                    <select onChange={ e => this.handleConfirmAddStyle(e, addable, blockCopy) } value="" id="addStyleDropdown">
                        <option disabled selected value>{ __('Select style') }</option>
                        { selectOptions.map(({value, label}) =>
                            <option value={ value } disabled={ value === '-' }>{ label }</option>
                        ) }
                    </select>
                </span>
                : null,
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
                let baseScss;
                if (!unit.derivedFrom) {
                    const screenSizesScss1 = splitToScreenSizeParts(unit.scss);
                    baseScss = screenSizesScss1[0];
                    screenSizesScss = screenSizesScss1.map((p, i) => i > 0
                        ? expandToInternalRepr(`${p.indexOf(OPT_SCSS_SPLIT_MARKER) < 0 ? OPT_SCSS_SPLIT_MARKER : ''}${p}`, baseScss)
                        : p);
                } else {
                    const screenSizesScss1 = splitToScreenSizeParts(unit.scss);
                    const parenUnit = getBaseUnit(unit, unitsOfThisBlockType);
                    const basePart = splitToScreenSizeParts(parenUnit.scss)[0];
                    baseScss = withApdxes(basePart, `u${unit.id.split('-').at(-1)}`);
                    screenSizesScss = screenSizesScss1.map(p => expandToInternalRepr(p, baseScss, null));
                }
                const commons = createListItem(unit, blockCopy.type);
                return {...{
                    unit,
                    baseScss,
                    screenSizesScss,
                }, ...commons};
            }),
            curTabIdxs: ScreenSizesVerticalTabs.createTabIdxes(unitsToShow, this),
            addable,
            unitsOfThisBlockType,
            unitsEnabled,
            selectOptions: addable ? createAddUnitsDropdownList(addable) : [],
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
    emitVarValueChange(newVal, cssVar, ast, {unit, baseScss, screenSizesScss, cls}, {baseValueLiteral, hasBaseValue}, partIdx) {
        let partToOptimized;
        if (!unit.derivedFrom) {
            partToOptimized = (p, i) => i > 0 ? optimizeFromInternalRepr(p, baseScss) : p;
        } else {
            if ((newVal !== null && hasBaseValue === false) || // already had custom val (update var val)
                (newVal !== null && hasBaseValue === true) || // has default val (add var)
                (newVal === null && hasBaseValue === false)) { // already has custom, but new is null (clear var)
                const baseUnitScss = getBaseUnit(unit, this.state.unitsOfThisBlockType).scss;
                partToOptimized = p => optimizeFromInternalRepr(p, baseUnitScss);
            }
        }
        if (!partToOptimized) return;
        const val = newVal || baseValueLiteral;
        updateAndEmitUnitScss(unit, () => {
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
     * @param {EventTarget} e
     * @param {[Array<ThemeStyleUnit>, Array<ThemeStyleUnit>]} addable
     * @param {RawBlock} block
     * @access private
     */
    handleConfirmAddStyle(e, [instantiable, reference], block) {
        const tmp = instantiable.find(({id}) => id === e.target.value);
        const unit = tmp || reference.find(({id}) => id === e.target.value);
        this.addUnitFrom(unit, block, !!tmp && !unit.derivedFrom);
    }
    /**
     * @param {ThemeStyleUnit} unit
     * @param {RawBlock} block
     * @param {Boolean} isInstantiable
     * @access private
     */
    addUnitFrom(unit, block, isInstantiable) {
        if (!isInstantiable)
            this.addStyleClassOnly(unit);
        else
            this.addUnitClone(unit, block, !isBodyRemote(unit.id) ? '_base' : '_default');
    }
    /**
     * @param {ThemeStyleUnit} unit
     * @access private
     */
    addStyleClassOnly(unit) {
        const blockTypeName = this.props.blockCopy.type;
        const tmp = createUnitClass(unit.id, blockTypeName);
        const cls = unit.derivedFrom && !isBodyRemote(unit.derivedFrom) ? `${createUnitClass(unit.derivedFrom, blockTypeName)} ${tmp}` : tmp;
        this.curBlockStyleClasses = emitAddStyleClassToBlock(cls, this.props.blockCopy);
        this.updateState(this.state.unitsOfThisBlockType, store2.get().themeStyles, {...this.props.blockCopy, ...{styleClasses: this.curBlockStyleClasses}});
    }
    /**
     * @param {ThemeStyleUnit} base
     * @param {RawBlock} block
     * @param {String} varApdx = '_base' Example '_base', '_default' or '_u23'
     * @access private
     */
    addUnitClone(base, block, varApdx = '_base') {
        const {type} = this.props.blockCopy;
        const rolling = getLargestPostfixNum(this.state.unitsOfThisBlockType) + 1;
        const title = `${__(block.title || block.type)} ${rolling}`;
        const id = `d-${rolling}`;
        const cls = createUnitClass(id, type);
        const baseClsStr = varApdx !== '_default' ? `${createUnitClass(base.id, type)} ` : '';

        // #2 Classes
        this.curBlockStyleClasses = emitAddStyleClassToBlock(`${baseClsStr}${cls}`, this.props.blockCopy);
        // if remote ?

        // #1 Style
        const scss = joinFromScreenSizeParts([
            OPT_SCSS_SPLIT_MARKER,
            OPT_SCSS_SPLIT_MARKER,
            OPT_SCSS_SPLIT_MARKER,
            OPT_SCSS_SPLIT_MARKER,
            OPT_SCSS_SPLIT_MARKER
        ]) + '\n';
        const newUnit = {title, id, scss, generatedCss: compileScss(scss, cls),
            optimizedScss: null, optimizedGeneratedCss: null,
            origin: '', specifier: '', isDerivable: false, derivedFrom: base.id};

        store2.dispatch('themeStyles/addUnitTo', [type, newUnit]);

        emitCommitStylesOp(type, () => {
            // Revert #1
            store2.dispatch('themeStyles/removeUnitFrom', [type, newUnit]);

            setTimeout(() => {
                // #2
                api.saveButton.triggerUndo();
            }, 100);
        });
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
}

/**
 * @typedef WidgetBasedStyleListItem
 * @prop {ThemeStyleUnit} unit
 * @prop {String|null} baseScss screenSizes[0] if unit.derivedFrom is falsey, apdxifiedParenUnitScreenSizes[0] if unit.derivedFrom is truthy
 * @prop {Array<String>} screenSizesScss
 * @prop {Boolean} isDefault
 * @prop {String} cls
 */

export default WidgetBasedStylesList;
