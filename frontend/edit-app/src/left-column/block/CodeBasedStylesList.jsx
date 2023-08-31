import {__, api, env, timingUtils, Icon, LoadingSpinner, InputError,
    validationConstraints, floatingDialog} from '@sivujetti-commons-for-edit-app';
import ContextMenu from '../../commons/ContextMenu.jsx';
import store2, {observeStore as observeStore2} from '../../store2.js';
import exampleScss from '../../example-scss.js';
import VisualStyles, {valueEditors} from './VisualStyles.jsx';
import EditUnitOrSetAsDefaultDialog from '../../popups/styles/EditUnitOrSetAsDefaultDialog.jsx';
import {getLargestPostfixNum, findBlockTypeStyles, SPECIAL_BASE_UNIT_NAME, findBodyStyle,
        dispatchNewBlockStyleClasses, compileSpecial, StyleTextarea, emitUnitChanges,
        emitCommitStylesOp, EditableTitle, tempHack2, goToStyle, blockHasStyle,
        findParentStyleInfo, tempHack, StylesList, findRealUnit, findBodyStyleMainUnit,
        specialBaseUnitCls, splitUnitAndNonUnitClasses, createUnitClass} from './styles-shared.jsx';

const {compile, serialize, stringify} = window.stylis;

const SET_AS_DEFAULT = 'set-as-default';
const EDIT_DETAILS = 'edit-yyy';

class CodeBasedStylesList extends StylesList {
    // extraBlockStyleClassesTextareaEl;
    // currentBlockUnitStyleClasses;
    // throttledDoHandleUtilsClassesInput;
    // unregistrables;
    // liIdxOfOpenMoreMenu;
    // refElOfOpenMoreMenu;
    // bodyStyle;
    // userIsSuperAdmin;
    /**
     * @access protected
     */
    componentWillMount() {
        super.componentWillMount();
        this.userIsSuperAdmin = api.user.getRole() === api.user.ROLE_SUPER_ADMIN;
        this.extraBlockStyleClassesTextareaEl = preact.createRef();
        this.currentBlockUnitStyleClasses = '';
        this.throttledDoHandleUtilsClassesInput = timingUtils.debounce(
            this.handleUtilClassesInputChanged.bind(this),
            env.normalTypingDebounceMillis);
        this.setState({
            ...{units: [], liClasses: []},
            ...this.createBlockClassesState(this.props.blockCopy)
        });
        this.unregistrables = [observeStore2('themeStyles', ({themeStyles}, [event]) => {
            this.bodyStyle = findBodyStyle(themeStyles);
            const {units} = (findBlockTypeStyles(themeStyles, this.props.blockCopy.type) || {});
            if (this.state.units !== units)
                this.updateUnitsState(units, themeStyles, this.getOpenLiIdx(event, units));
        })];
        this.doLoad(this.props.blockCopy);
    }
    /**
     * @param {StylesListProps} props
     * @access protected
     */
    componentWillReceiveProps({blockCopy}) {
        if (blockCopy.styleClasses !== this.props.blockCopy.styleClasses)
            this.setState(this.createBlockClassesState(blockCopy));
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
    render({blockCopy}, {units, liClasses, extraBlockStyleClassesNotCommitted,
                            extraBlockStyleClassesError, parentStyleInfo}) {
        const {userCanEditCss, useVisualStyles} = this.props;
        return [
            units !== null ? units.length ? <ul class="list styles-list mb-2">{ units.map((unit, i) => {
                const liCls = liClasses[i];
                const cls = createUnitClass(unit.id, blockCopy.type);
                const isActivated = blockHasStyle(blockCopy, unit, cls);
                const [cssVars] = !useVisualStyles ? [[], []] : VisualStyles.extractVars(unit.scss, cls);
                const doShowChevron = userCanEditCss || (useVisualStyles && cssVars.length);
                const bodyUnitCopy = unit.origin !== SPECIAL_BASE_UNIT_NAME ? null : this.getRemoteBodyUnitCopy(unit, blockCopy);
                const [isDefault, real] = bodyUnitCopy === null ? [false, unit] : [true, bodyUnitCopy];
                const title = real.title;
                const textarea = (real.isDerivable || real.derivedFrom) && liCls !== ''
                    ? this.userIsSuperAdmin ? 'show' : 'showAsDisabled'
                    : userCanEditCss ? 'show' : 'omit';
                return <li class={ liCls } data-cls={ cls } key={ unit.id }>
                    <header class="flex-centered p-relative">
                        <button
                            onClick={ e => this.handleLiClick(e, i, isDefault ? false : !unit.derivedFrom) }
                            class="col-12 btn btn-link text-ellipsis with-icon pl-2 mr-1 no-color"
                            title={ userCanEditCss ? `.${cls}` : '' }
                            type="button">
                            <Icon iconId="chevron-down" className={ `size-xs${doShowChevron ? '' : ' d-none'}` }/>
                            { userCanEditCss
                                ? <EditableTitle
                                    unitId={ unit.id }
                                    unitIdReal={ !isDefault ? null : bodyUnitCopy.id }
                                    currentTitle={ title }
                                    blockTypeName={ blockCopy.type }
                                    allowEditing={ userCanEditCss }
                                    subtitle={ isDefault ? [__('Default'), bodyUnitCopy.specifier ? ` (${bodyUnitCopy.specifier})` : ''].join('') : null }
                                    ref={ this.editableTitleInstances[i] }/>
                                : <span class="text-ellipsis">{ title }</span> }
                        </button>
                        { isActivated ? <span
                            onClick={ () => alert(__('You can add and remove this content\'s styles in "Styles" tab')) }
                            class="p-absolute flex-centered icon-tabler color-dimmed3"
                            style="right: .4rem;font-size: 1.6rem;"
                            title={ __('Currently active') }>•</span> : null }
                    </header>
                    { textarea === 'show'
                        ? <StyleTextarea
                            unitCopy={ {...unit} }
                            unitCopyReal={ bodyUnitCopy }
                            unitCls={ cls }
                            blockTypeName={ blockCopy.type }
                            isVisible={ liCls !== '' }/>
                        : textarea !== 'showAsDisabled'
                            ? null
                            : <textarea
                                value={ (bodyUnitCopy || unit).scss }
                                class="form-input code"
                                rows="12"
                                disabled></textarea>
                    }
                </li>;
            }) }</ul> : <p class="pt-1 mb-2 color-dimmed">{ __('No own templates') }.</p>
            : <LoadingSpinner className="ml-1 mb-2 pb-2"/>
        ].concat(userCanEditCss ? [
            <button
                onClick={ this.addStyleUnit.bind(this) }
                class="btn btn-primary btn-sm mr-1"
                type="button">{ __('Create template') }</button>
        ] : [])
        .concat(parentStyleInfo && parentStyleInfo[2] ? [
            <button
                onClick={ () => goToStyle(parentStyleInfo, 'style-templates-tab') }
                class="btn btn-sm"
                type="button">{ __('Show parent templates') }</button>
        ] : [])
        .concat(userCanEditCss ? [
            <hr style="opacity: .14;margin: .8rem .1rem;"/>,
            <textarea
                value={ extraBlockStyleClassesNotCommitted }
                onInput={ this.throttledDoHandleUtilsClassesInput }
                class={ `form-input code mt-2${!extraBlockStyleClassesError ? '' : ' is-error'}` }
                placeholder="float-left mt-2 mb-2"
                rows="1"
                style="min-height:unset"
                ref={ this.extraBlockStyleClassesTextareaEl }></textarea>,
            <div class="p-absolute" style="right: .8rem;z-index: 1;margin: -1.14rem 0 0;">
                <Icon iconId="info-circle" className="size-xs color-dimmed3"/>
                <span ref={ el => tempHack2(el, 'utilClasses', this) } class="my-tooltip tooltip-prerendered tooltip-dark">
                    <span>Voit määritellä sekalaiset utility-luokat tähän.</span>
                    <span class="popper-arrow" data-popper-arrow></span>
                </span>
            </div>,
            <InputError errorMessage={ extraBlockStyleClassesError }/>,
            <ContextMenu
                links={ this.createContextMenuLinks(this.userIsSuperAdmin ? [
                    {text: __('Set as default'), title: __('Set as default'), id: SET_AS_DEFAULT},
                    {text: __('Edit details'), title: __('Edit details'), id: EDIT_DETAILS},
                    {text: __('Delete'), title: __('Delete style'), id: 'delete-style'},
                ] : []) }
                onItemClicked={ this.handleMoreMenuLinkClicked.bind(this) }
                onMenuClosed={ () => { this.refElOfOpenMoreMenu.style.opacity = ''; } }
                ref={ this.moreMenu }/>
        ] : []);
    }
    /**
     * @param {RawBlock} blockCopy
     * @access private
     */
    doLoad(blockCopy) {
        this.setState({...{themeStyles: null}, ...this.createBlockClassesState(blockCopy)});
        const themeStyles = tempHack();
        if (themeStyles) {
            this.bodyStyle = findBodyStyle(themeStyles);
            this.updateUnitsState((findBlockTypeStyles(themeStyles, blockCopy.type) || {}).units, themeStyles, undefined, blockCopy);
        }
        // else Wait for store2.dispatch('themeStyles/setAll')
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
     * @param {Array<ThemeStyleUnit>|undefined} candidate
     * @param {Array<ThemeStyle>} themeStyles
     * @param {Number} currentOpenIdx = -1
     * @param {RawBlock} blockCopy = this.props.blockCopy
     * @access private
     */
    updateUnitsState(units, themeStyles, currentOpenIdx = -1, blockCopy = this.props.blockCopy) {
        this.receiveUnits(units);
        this.setState({units, liClasses: createLiClasses(units, currentOpenIdx),
            parentStyleInfo: findParentStyleInfo(themeStyles, blockCopy)});
    }
    /**
     * @param {RawBlock} block
     * @returns {{extraBlockStyleClassesNotCommitted: String; extraBlockStyleClassesError: String;}}
     * @access private
     */
    createBlockClassesState(block) {
        const [unitClses, nonUnitClses] = block
            ? splitUnitAndNonUnitClasses(block.styleClasses)
            : ['', ''];
        this.currentBlockUnitStyleClasses = unitClses;
        return {extraBlockStyleClassesNotCommitted: nonUnitClses,
                extraBlockStyleClassesError: ''};
    }
    /**
     * @param {ContextMenuLink} link
     * @access private
     */
    handleMoreMenuLinkClicked(link) {
        if (super.handleMoreMenuLinkClicked(link))
            return true;
        const {id} = link;
        if (id === SET_AS_DEFAULT || id === EDIT_DETAILS) {
            this.handleEditOrSetAsDefaultMenuItemClicked(id !== SET_AS_DEFAULT);
            return true;
        }
        return false;
    }
    /**
     * @param {Boolean} wasEditLink
     * @access private
     */
    handleEditOrSetAsDefaultMenuItemClicked(wasEditLink) {
        const unit = this.state.units[this.liIdxOfOpenMoreMenu];
        const blockTypeName = this.props.blockCopy.type;
        const remote = wasEditLink ? findRealUnit(unit, blockTypeName) : null;
        const [unitId, blockTypeNameAdjusted] = !wasEditLink || remote === unit ? [unit.id, blockTypeName] : [remote.id, SPECIAL_BASE_UNIT_NAME];
        const [title, specifier, isDerivable, onConfirmed] = wasEditLink
            ? ['Edit details', remote.specifier, remote.isDerivable, (specifierNew, isDerivableNew) => {
                if (specifierNew !== specifier)
                    emitUpdatedRemoteCss(specifierNew, remote, blockTypeName);
                if (isDerivableNew !== isDerivable) {
                    const dataBefore = {isDerivable};
                    const changes = {isDerivable: isDerivableNew};
                    emitUnitChanges(changes, dataBefore, blockTypeNameAdjusted, unitId);
                }
            }]
            : ['Set as default', undefined, unit.isDerivable, (specifier, isDerivable) => {
                this.setUnitAsDefault(specifier, isDerivable, unit);
            }];
        const showSpecifier = !wasEditLink || remote !== unit;
        floatingDialog.open(EditUnitOrSetAsDefaultDialog, {
            title: __(title),
            height: wasEditLink ? showSpecifier ? 286 : 206 : 322,
        }, {
            blockTypeName,
            specifier,
            showSpecifier,
            isDerivable,
            wasEditLink,
            onConfirmed,
        });
    }
    /**
     * @param {String} specifier 'something' or ''
     * @param {Boolean} isDerivable
     * @param {ThemeStyleUnit} unit
     * @access private
     */
    setUnitAsDefault(specifier, isDerivable, unit) {
        const dataBefore = {...unit, ...{origin: '', specifier: '', isDerivable: false}};
        const blockTypeName = this.props.blockCopy.type;
        const [emptied, toBody] = createDefaultUnit(unit, blockTypeName, specifier, isDerivable);

        // 1. Add new unit to body
        store2.dispatch('themeStyles/addUnitTo', [emptied.origin, toBody]);
        emitCommitStylesOp(emptied.origin, () => {
            // Do nothing, see below
        });

        // 2. Clear this unit & update
        const id = emptied.id;
        const copyEmptied = {...emptied};
        const copyBody = {...toBody};
        const {generatedCss, scss} = emptied;
        const before = {scss, generatedCss};
        emitUnitChanges(copyEmptied, before, blockTypeName, id, () => {
            store2.dispatch('themeStyles/removeUnitFrom', [copyEmptied.origin, copyBody]);
            store2.dispatch('themeStyles/updateUnitOf', [blockTypeName, id, dataBefore]);
            setTimeout(() => {
                // Remove 1. from the queue
                api.saveButton.triggerUndo();
            }, 100);
        });
    }
    /**
     * @access private
     */
    addStyleUnit() {
        const {type} = this.props.blockCopy;
        const current = findBlockTypeStyles(store2.get().themeStyles, type);
        const rolling = current ? getLargestPostfixNum(current.units) + 1 : 1;
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
        const scss = createInitialScss(type);
        const cls = createUnitClass(id, this.props.blockCopy.type);

        const newUnit = {title, id, scss, generatedCss: serialize(compile(`.${cls}{${scss}}`), stringify),
            origin: '', specifier: '', isDerivable: false, derivedFrom: null};
        if (current) store2.dispatch('themeStyles/addUnitTo', [type, newUnit]);
        else store2.dispatch('themeStyles/addStyle', [{units: [newUnit], blockTypeName: type}]);

        //
        emitCommitStylesOp(type, () => {
            if (current) store2.dispatch('themeStyles/removeUnitFrom', [type, newUnit]);
            else store2.dispatch('themeStyles/removeStyle', [type]);
        });
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleUtilClassesInputChanged(e) {
        const v = e.target.value;
        let error = v.length <= validationConstraints.HARD_SHORT_TEXT_MAX_LEN ? ''
            : __('maxLength').replace('{field}', __('Other classes')).replace('{arg0}', validationConstraints.HARD_SHORT_TEXT_MAX_LEN);
        if (!error && v.split(' ').some(cls => cls.startsWith('j-')))
            error = __('%s must not start with %s', __('Other classes'), '"j-"');
        if (error) {
            this.setState({extraBlockStyleClassesNotCommitted: v,
                extraBlockStyleClassesError: error});
            return;
        }
        const unitClses = this.currentBlockUnitStyleClasses;
        const both = unitClses + (unitClses && v.length ? ` ${v}` : v);
        dispatchNewBlockStyleClasses(both, this.props.blockCopy);
    }
    /**
     * @param {Number} liIdx
     * @access private
     */
    toggleIsCollapsed(liIdx) {
        if (this.state.liClasses[liIdx] !== ' open') // Hide all except $liIdx
            this.setState({liClasses: createLiClasses(this.state.units, liIdx)});
        else // Hide all
            this.setState({liClasses: createLiClasses(this.state.units, -1)});
    }
    /**
     * @param {String} event 'themeStyles/*'
     * @param {Array<ThemeStyleUnit>} units
     * @returns {Number}
     * @access private
     */
    getOpenLiIdx(event, units) {
        return event === 'themeStyles/addUnitTo' || event === 'themeStyles/addStyle'
            ? units.length - 1
            : this.state.liClasses.findIndex(cls => cls !== '');
    }
}

/**
 * @param {Array<ThemeStyleUnit>} units
 * @param {Number} openIdx
 * @returns {Array<String>}
 */
function createLiClasses(units, openIdx) {
    return units.map((_, i) => i !== openIdx ? '' : ' open');
}

/**
 * @param {ThemeStyleUnit} from
 * @param {String} blockTypeName
 * @param {String} specifier
 * @param {Boolean} isDerivable = false
 */
function createDefaultUnit(from, blockTypeName, specifier, isDerivable = false) {
    const emptied = {
        title: '',
        id: from.id, // 'unit-13'
        scss: '',
        generatedCss: '',
        origin: SPECIAL_BASE_UNIT_NAME, // '_body_'
        specifier: '',
        isDerivable: false,
        derivedFrom: null,
    };
    const moveToBody = {
        title: from.title,
        id: createUnitClass(emptied.id, blockTypeName), // 'j-Section-unit-13'
        scss: from.scss,
        generatedCss: 'filled-below', // '.j-_body_ .j-Section:not(.no-j-Section-unit-13) {<compiled>}}'
        origin: blockTypeName,
        specifier: specifier || '',
        isDerivable,
        derivedFrom: from.derivedFrom, // 'unit-2'
    };

    //
    const [shouldCommit, result] = compileSpecial(moveToBody.scss, '', moveToBody.specifier,
        moveToBody.id, blockTypeName);
    // Wasn't valid -> commit to local state only
    if (!shouldCommit) {
        env.window.console.error('Shouldn\'t happen', result.error);
        return null;
    }
    // Was valid, dispatch to the store (which is grabbed by BlockStylesTab.contructor and then this.componentWillReceiveProps())
    moveToBody.generatedCss = result.generatedCss;
    return [emptied, moveToBody];
}

/**
 * @param {String} specifier 'something' or ''
 * @param {ThemeStyleUnit} remoteUnit
 * @param {String} blockTypeName
 */
function emitUpdatedRemoteCss(specifier, remoteUnit, blockTypeName) {
    const prev = {...remoteUnit, ...{specifier: remoteUnit.specifier || ''}};
    const [_shouldCommit, result] = compileSpecial(prev.scss, prev.scss, specifier, remoteUnit.id, blockTypeName);
    const updates = {specifier, generatedCss: result.generatedCss};
    emitUnitChanges(updates, prev, SPECIAL_BASE_UNIT_NAME, remoteUnit.id);
}

export default CodeBasedStylesList;
