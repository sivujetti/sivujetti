import {__, Icon} from '@sivujetti-commons-for-edit-app';
import ContextMenu from '../../commons/ContextMenu.jsx';
import exampleScss from '../../example-scss.js';
import store2, {observeStore as observeStore2} from '../../store2.js';
import {blockHasStyle, createUnitClass, emitCommitStylesOp,
        findBlockTypeStyles, findBodyStyle, SPECIAL_BASE_UNIT_NAME,
        updateAndEmitUnitScss} from './styles-tabs-common.js';
import ScreenSizesVerticalTabs from './ScreenSizesVerticalTabs.jsx';
import {createLiClasses} from './code-based-tab-funcs.js';
import {extractVars} from './scss-ast-funcs.js';
import EditableTitle from './EditableTitle.jsx';
import StyleTextarea from './StyleTextarea.jsx';
import {joinFromScreenSizeParts, OPT_SCSS_SPLIT_MARKER, splitOptimizedFromMarker} from './scss-manip-funcs.js';
import AbstractStylesList, {getUnitsOfBlockType, createListItem, getLargestPostfixNum,
                            compileScss, createUpdatesScss} from './AbstractStylesList.jsx';

const SET_AS_DEFAULT = 'set-as-default';
const EDIT_DETAILS = 'edit-details';

class CodeBasedStylesList extends AbstractStylesList {
    // unregistrables;
    // bodyStyle;
    /**
     * @access protected
     */
    componentWillMount() {
        super.componentWillMount();
        this.unregistrables = [];
        const themeStylesInitial = store2.get().themeStyles;
        this.bodyStyle = findBodyStyle(themeStylesInitial);
        const createStateCandidate = themeStyles => {
            const unitsOfThisBlockType = getUnitsOfBlockType(themeStyles, this.props.blockCopy.type);
            return unitsOfThisBlockType;
        };
        const updateState = (unitsOfThisBlockType, openLiIdx) => {
            this.receiveUnits(unitsOfThisBlockType);
            this.setState(this.createNewState(unitsOfThisBlockType, openLiIdx));
        };
        updateState(createStateCandidate(themeStylesInitial), null);
        //
        this.unregistrables = [observeStore2('themeStyles', ({themeStyles}, [event]) => {
            const unitsOfThisBlockType = createStateCandidate(themeStyles);
            if (this.state.unitsOfThisBlockType !== unitsOfThisBlockType)
                updateState(unitsOfThisBlockType,
                            event === 'themeStyles/addUnitTo' || event === 'themeStyles/addStyle'
                                ? unitsOfThisBlockType.length - 1
                                : this.state.liClasses.findIndex(cls => cls !== ''));
        })];
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
    render({blockCopy}, {itemsToShow, liClasses, curTabIdxs}) {
        const {userCanEditCss} = this.props;
        return [itemsToShow.length ? <ul class="list styles-list mb-2">{ itemsToShow.map((itm, i) => {
            const {unit, unit0, screenSizesScss, isDefault, cls} = itm;
            const curTabIdx = curTabIdxs[i];
            const curScreenSizeTabScss = screenSizesScss[curTabIdx];
            const [a, _b] = curScreenSizeTabScss;
            const [cssVars, _ast] = extractVars(a, cls);
            const isActivated = blockHasStyle(blockCopy, unit0, cls);
            const doShowChevron = userCanEditCss || cssVars.length;
            const title = unit.title;
            const liCls = liClasses[i];
            return <li class={ liCls } data-cls={ cls } key={ unit.id }>
                <header class="flex-centered p-relative">
                    <button
                        onClick={ e => this.handleLiClick(e, i, isDefault ? false : !unit0.derivedFrom) }
                        class="col-12 btn btn-link text-ellipsis with-icon pl-2 mr-1 no-color"
                        title={ userCanEditCss ? `.${cls}` : '' }
                        type="button">
                        <Icon iconId="chevron-down" className={ `size-xs${doShowChevron ? '' : ' d-none'}` }/>
                        { userCanEditCss
                            ? <EditableTitle
                                unitId={ unit.id }
                                unitIdReal={ !isDefault ? null : unit.id }
                                currentTitle={ title }
                                blockTypeName={ blockCopy.type }
                                allowEditing={ userCanEditCss }
                                subtitle={ isDefault ? [__('Default'), unit.specifier ? ` (${unit.specifier})` : ''].join('') : null }
                                ref={ this.editableTitleInstances[i] }/>
                            : <span class="text-ellipsis">{ title }</span> }
                    </button>
                    { isActivated ? <span
                        onClick={ () => alert(__('You can add and remove this content\'s styles in "Styles" tab')) }
                        class="p-absolute flex-centered icon-tabler color-dimmed3"
                        style="right: .4rem;font-size: 1.6rem;"
                        title={ __('Currently active') }>•</span> : null }
                </header>
                { !userCanEditCss || liCls === ''
                    ? null
                    : !this.userIsSuperAdmin && unit0.isDerivable
                        ? <textarea
                            value={ unit.scss }
                            class="form-input code"
                            rows="12"
                            disabled></textarea>
                        : <ScreenSizesVerticalTabs
                            curTabIdx={ curTabIdx }
                            setCurTabIdx={ to => this.setState(ScreenSizesVerticalTabs.createTabIdxesWithNewCurrentIdx(curTabIdxs, i, to)) }>
                            <StyleTextarea
                                scss={ a }
                                unitCls={ cls }
                                onScssChanged={ newScss => {
                                    updateAndEmitUnitScss(unit0, () => {
                                        const partUpdated = newScss;
                                        const baseScss = null;
                                        const partToOptimized = (p, i) => screenSizesScss[i][1] !== null ? p + OPT_SCSS_SPLIT_MARKER : p;
                                        return createUpdatesScss(screenSizesScss.map(([a, _b]) => a), curTabIdx, partUpdated, cls,
                                                                    baseScss, partToOptimized);
                                    }, blockCopy.type);
                                } }/>
                        </ScreenSizesVerticalTabs>
                }
            </li>;
        }) }</ul> : <p class="pt-1 mb-2 color-dimmed">{ __('No own templates') }.</p>,
        userCanEditCss
            ? <button
                onClick={ this.addStyleTemplate.bind(this) }
                class="btn btn-primary btn-sm mr-1"
                type="button">{ __('Create template') }</button>
            : null,
        <ContextMenu
            links={ this.createContextMenuLinks(this.userIsSuperAdmin ? [
                {text: __('Set as default'), title: __('Set as default'), id: SET_AS_DEFAULT},
                {text: __('Edit details'), title: __('Edit details'), id: EDIT_DETAILS},
                {text: __('Delete'), title: __('Delete style'), id: 'delete-style'},
            ] : []) }
            onItemClicked={ this.handleMoreMenuLinkClicked.bind(this) }
            onMenuClosed={ () => { this.refElOfOpenMoreMenu.style.opacity = ''; } }
            ref={ this.moreMenu }/>
        ];
    }
    /**
     * @param {Array<ThemeStyleUnit>} unitsOfThisBlockType
     * @param {Number|null} openLiIdx
     * @returns {todo} 
     * @access private
     */
    createNewState(unitsOfThisBlockType, openLiIdx) {
        const {blockCopy} = this.props;
        return {
            itemsToShow: unitsOfThisBlockType.map(unit0 => {
                const bodyUnitCopy = unit0.origin !== SPECIAL_BASE_UNIT_NAME ? null : this.getRemoteBodyUnitCopy(unit0, blockCopy);
                const unit = bodyUnitCopy || unit0;
                const commons = createListItem(unit, blockCopy.type);
                commons.screenSizesScss = commons.screenSizesScss.map(scss => scss.indexOf(OPT_SCSS_SPLIT_MARKER) > -1 ? splitOptimizedFromMarker(scss) : [scss, null]);
                return {...{
                    unit,
                    unit0,
                    bodyUnitCopy,
                }, ...commons};
            }),
            liClasses: createLiClasses(unitsOfThisBlockType, openLiIdx || 0),
            curTabIdxs: ScreenSizesVerticalTabs.createTabIdxes(unitsOfThisBlockType, this),
            unitsOfThisBlockType,
        };
    }
    /**
     * @access private
     */
    addStyleTemplate() {
        const {type} = this.props.blockCopy;
        const rolling = getLargestPostfixNum(this.state.itemsToShow.map(({unit}) => unit)) + 1;
        const title = rolling > 1 ? `Unit ${rolling}` : __('Default');
        const id = `unit-${rolling}`;
        const createInitialScss = blockTypeName => {
            const e = exampleScss[blockTypeName];
            if (!e) return 'color: blueviolet';
            return [
                `// ${__('Css for the outermost %s (%s)', __(!e.outermostElIsWrapper ? 'element': 'wrapper-element'), e.outermostEl)}`,
                e.first,
                '',
                `// ${__('Css for the inner elements')}`,
                e.second,
            ].join('\n');
        };
        const basePart = createInitialScss(type);
        const scss = joinFromScreenSizeParts([
            basePart,
            OPT_SCSS_SPLIT_MARKER,
            OPT_SCSS_SPLIT_MARKER,
            OPT_SCSS_SPLIT_MARKER,
            OPT_SCSS_SPLIT_MARKER,
        ]);
        const cls = createUnitClass(id, this.props.blockCopy.type);

        const newUnit = {title, id, scss, generatedCss: compileScss(scss, cls),
            origin: '', specifier: '', isDerivable: false, derivedFrom: null};
        const themeStyleExists = !!findBlockTypeStyles(store2.get().themeStyles, type);
        if (themeStyleExists) store2.dispatch('themeStyles/addUnitTo', [type, newUnit]);
        else throw new Error(`todo store2.dispatch('themeStyles/addStyle', [{units: [newUnit], blockTypeName: type}])`);

        //
        emitCommitStylesOp(type, () => {
            if (themeStyleExists) store2.dispatch('themeStyles/removeUnitFrom', [type, newUnit]);
            else  throw new Error(`store2.dispatch('themeStyles/removeStyle', [type])`);
        });
    }
    /**
     * @param {Event} e
     * @param {Number} i
     * @param {Boolean} canBeSetAsDefault
     * @access private
     */
    handleLiClick(e, i, canBeSetAsDefault) {
        if (this.props.userCanEditCss && this.editableTitleInstances[i].current.isOpen()) return;
        //
        const moreMenuIconEl = e.target.classList.contains('edit-icon-outer') ? e.target : e.target.closest('.edit-icon-outer');
        if (!moreMenuIconEl) {
            const accordBtn = e.target.classList.contains('no-color') ? e.target : e.target.closest('.no-color');
            const hasDecls = accordBtn.querySelector(':scope > .icon-tabler.d-none') === null;
            if (this.props.userCanEditCss || hasDecls) this.toggleIsCollapsed(i);
        } else {
            this.liIdxOfOpenMoreMenu = i;
            this.refElOfOpenMoreMenu = moreMenuIconEl;
            this.refElOfOpenMoreMenu.style.opacity = '1';
            this.moreMenu.current.open({target: moreMenuIconEl}, canBeSetAsDefault
                ? links => links
                : links => links.filter(({id}) => id !== SET_AS_DEFAULT));
        }
    }
    /**
     * @param {ThemeStyleUnit} unit
     * @param {RawBlock} blockCopy
     * @returns {ThemeStyleUnit|null}
     * @access private
     */
    getRemoteBodyUnitCopy(unit, blockCopy) {
        const lookFor = createUnitClass(unit.id, blockCopy.type);
        const out = this.bodyStyle.units.find(u => u.id === lookFor);
        return out ? {...out} : null;
    }
    /**
     * @param {Number} liIdx
     * @access private
     */
    toggleIsCollapsed(liIdx) {
        if (this.state.liClasses[liIdx] !== ' open') // Hide all except $liIdx
            this.setState({liClasses: createLiClasses(this.state.itemsToShow, liIdx)});
        else // Hide all
            this.setState({liClasses: createLiClasses(this.state.itemsToShow, -1)});
    }
}

export default CodeBasedStylesList;
