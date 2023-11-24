import {__} from '@sivujetti-commons-for-edit-app';
import ContextMenu from '../../commons/ContextMenu.jsx';
import store2 from '../../store2.js';
import {createUnitClass, createUnitClassSpecial, findBaseUnitOf, findBlockTypeStyles,
        findBodyStyle, findRealUnit, isBodyRemote, SPECIAL_BASE_UNIT_NAME} from './styles-tabs-common.js';
import EditableTitle from './EditableTitle.jsx';
import {createAddableUnits, createDataPropForValueInputRenderer, getEditableUnits,
        getEnabledUnits, removeStyleClassMaybeRemote,
        removeStyleUnitMaybeRemote, withoutAppendix} from './widget-based-tab-funcs.js';
import ScreenSizesVerticalTabs from './ScreenSizesVerticalTabs.jsx';
import {splitToScreenSizeParts} from './scss-manip-funcs.js';
import {extractVars, valueEditors, varNameToLabel} from './scss-ast-funcs.js';
import {optimizedToExpanded} from '../block/style-hoist-funcs.js';

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
        const themeStyles = store2.get().themeStyles;
        this.curBlockStyleClasses = this.props.blockCopy.styleClasses;
        const blockCopy = this.curBlockStyleClasses !== this.props.blockCopy.styleClasses
            ? {...this.props.blockCopy, ...{styleClasses: this.curBlockStyleClasses}}
            : this.props.blockCopy;
        const unitsOfThisBlockType = findBlockTypeStyles(themeStyles, blockCopy.type)?.units || [];
        this.bodyStyle = findBodyStyle(themeStyles);
        const unitsEnabled = getEnabledUnits(unitsOfThisBlockType, this.bodyStyle.units, blockCopy);
        //
        const state = this.createNewState(unitsOfThisBlockType, blockCopy, unitsEnabled);
        this.editableTitleInstances = state.itemsToShow.map(_ => preact.createRef());
        this.setState(state);
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
            ? <ul class="list styles-list mb-2">{ itemsToShow.map(({unit, screenSizesScss}, i) => {
                const isDefault = isBodyRemote(unit.id);
                const cls = !isDefault ? createUnitClass(unit.id, blockCopy.type) : createUnitClassSpecial(unit.id, blockCopy.type);
                const key = unit.id;
                const curScreenSizeTabScss = screenSizesScss[curTabIdx];
                const [cssVars, _ast] = extractVars(curScreenSizeTabScss, 'dummy');
                const varsInsights = [];
                return <li key={ key } class="open">
                    <header class="flex-centered p-relative">
                        <b
                            onClick={ e => this.handleLiClick(e, i, isBodyRemote(unit.id)) }
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
                            const valueIsClearable = varsInsights[i2]?.hasChanged;
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
                                    `const val = newValAsString !== null
                                        ? newValAsString
                                        : extractVal(varsInsights[i2].lineB);
                                    this.emitChange(val, cssVar, unit, ast, cls, parts, expanded, basePart)`;
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
                if (!unit.derivedFrom) {
                    screenSizesScss = splitToScreenSizeParts(unit.scss);
                } else {
                    const screenSizesScss1 = splitToScreenSizeParts(unit.scss);
                    const isDerivedFromBodyUnit = isBodyRemote(unit.derivedFrom);
                    const baseStyleUnits = !isDerivedFromBodyUnit ? unitsOfThisBlockType : findBlockTypeStyles(store2.get().themeStyles, SPECIAL_BASE_UNIT_NAME).units;
                    const baseUnitScss = findBaseUnitOf(unit, baseStyleUnits).scss;
                    const basePart = splitToScreenSizeParts(baseUnitScss)[0];
                    screenSizesScss = screenSizesScss1.map((p, i) => i > 0 ? optimizedToExpanded(p, basePart, 'u5') : p);
                }
                return {
                    unit,
                    screenSizesScss
                };
            }),
            addable,
            unitsOfThisBlockType,
            unitsEnabled
        };
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

export default WidgetBasedStylesList;
