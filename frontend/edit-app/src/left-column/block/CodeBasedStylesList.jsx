import {__, api, env, http, signals, timingUtils, Icon, LoadingSpinner, hookForm,
    unhookForm, Input, FormGroup, InputErrors, InputError, hasErrors,
    validationConstraints, floatingDialog} from '@sivujetti-commons-for-edit-app';
import {PopupPrerendered} from '../../block-types/listing/AddFilterPopup.jsx';
import {createTrier} from '../../block/dom-commons.js';
import ContextMenu from '../../commons/ContextMenu.jsx';
import CssStylesValidatorHelper from '../../commons/CssStylesValidatorHelper.js';
import store2, {observeStore as observeStore2} from '../../store2.js';
import store, {pushItemToOpQueue} from '../../store.js';
import exampleScss from '../../example-scss.js';
import VisualStyles, {createUnitClass} from './VisualStyles.jsx';
import blockTreeUtils from './blockTreeUtils.js';
import EditUnitOrSetAsDefaultDialog from '../../popups/styles/EditUnitOrSetAsDefaultDialog.jsx';

const {compile, serialize, stringify} = window.stylis;

const SPECIAL_BASE_UNIT_NAME = '_body_';
const unitClsBody = createUnitClass('', SPECIAL_BASE_UNIT_NAME);
const SET_AS_DEFAULT = 'set-as-default';
const EDIT_DETAILS = 'edit-yyy';

class CodeBasedStylesList extends preact.Component {
    // editableTitleInstances;
    // moreMenu;
    // extraBlockStyleClassesTextareaEl;
    // currentBlockUnitStyleClasses;
    // throttledDoHandleUtilsClassesInput;
    // unregistrables;
    // liIdxOfOpenMoreMenu;
    // refElOfOpenMoreMenu;
    // bodyStyle;
    /**
     * @access protected
     */
    componentWillMount() {
        this.editableTitleInstances = [];
        this.moreMenu = preact.createRef();
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
            this.bodyStyle = themeStyles.find(({blockTypeName}) => blockTypeName === SPECIAL_BASE_UNIT_NAME);
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
        const {userCanEditVars, userCanEditCss, useVisualStyles} = this.props;
        return [
            units !== null ? units.length ? <ul class="list styles-list mb-2">{ units.map((unit, i) => {
                const liCls = liClasses[i];
                const cls = createUnitClass(unit.id, blockCopy.type);
                const [cssVars, ast] = !useVisualStyles ? [[], []] : VisualStyles.extractVars(unit.scss, cls);
                const doShowChevron = userCanEditCss || (useVisualStyles && cssVars.length);
                const bodyUnitCopy = unit.origin !== SPECIAL_BASE_UNIT_NAME ? null : this.getRemoteBodyUnitCopy(unit, blockCopy);
                const isDefault = bodyUnitCopy !== null;
                const title = (bodyUnitCopy || unit).title;
                return <li class={ liCls } data-cls={ cls } key={ unit.id }>
                    <header class="flex-centered p-relative">
                        <button
                            onClick={ e => this.handleLiClick(e, i, isDefault) }
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
                                    userCanEditCss={ userCanEditCss }
                                    subtitle={ isDefault ? [__('Default'), bodyUnitCopy.specifier ? ` (${bodyUnitCopy.specifier})` : ''].join('') : null }
                                    ref={ this.editableTitleInstances[i] }/>
                                : <span class="text-ellipsis">{ title }</span> }
                        </button>
                    </header>
                    { userCanEditCss
                        ? <StyleTextarea
                            unitCopy={ {...unit} }
                            unitCopyReal={ bodyUnitCopy }
                            unitCls={ cls }
                            blockTypeName={ blockCopy.type }
                            isVisible={ liCls !== '' }/>
                        : userCanEditVars
                            ? <VisualStyles
                                vars={ cssVars }
                                ast={ ast }
                                scss={ unit.scss }
                                unitCls={ cls }
                                emitVarValueChange={ getStyleUpdates => {
                                    updateAndEmitUnitScss(Object.assign({}, unit), getStyleUpdates, blockCopy.type);
                                } }/>
                            : null
                    }
                </li>;
            }) }</ul> : <p class="pt-1 mb-2 color-dimmed">{ __('No own styles') }.</p>
            : <LoadingSpinner className="ml-1 mb-2 pb-2"/>
        ].concat(userCanEditCss ? [
            <button
                onClick={ this.addStyleUnit.bind(this) }
                class="btn btn-primary btn-sm mr-1"
                type="button">{ __('Add template') }</button>
        ] : [])
        .concat(userCanEditVars && parentStyleInfo && parentStyleInfo[2] ? [
            <button
                onClick={ () => goToStyle(parentStyleInfo) }
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
                links={ [
                    {text: __('Edit name'), title: __('Edit name'), id: 'edit-style-title'},
                    {text: __('Set as default'), title: __('Set as default'), id: SET_AS_DEFAULT},
                    {text: __('Edit details'), title: __('Edit details'), id: EDIT_DETAILS},
                    {text: __('Delete'), title: __('Delete style'), id: 'delete-style'},
                ] }
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
            this.bodyStyle = themeStyles.find(({blockTypeName}) => blockTypeName === SPECIAL_BASE_UNIT_NAME);
            this.updateUnitsState((findBlockTypeStyles(themeStyles, blockCopy.type) || {}).units, themeStyles, undefined, blockCopy);
        }
        // else Wait for store2.dispatch('themeStyles/setAll')
    }
    /**
     * @param {ThemeStyleUnit} unit Example: {"title":"Oletus","id":"unit-1","scss":<scss>,"generatedCss":"","origin":"_body_","specifier":"","isDerivable":false,"derivedFrom":"unit-2"}
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
     * @param {Boolean} isDefaultUnit
     * @access private
     */
    handleLiClick(e, i, isDefaultUnit) {
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
            this.moreMenu.current.open({target: moreMenuIconEl}, !isDefaultUnit
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
    updateUnitsState(candidate, themeStyles, currentOpenIdx = -1, blockCopy = this.props.blockCopy) {
        const units = candidate ? candidate.filter(unit => !isSpecialUnit(unit)): [];
        const isUnitStyleOn = ({id}) => blockHasStyle(blockCopy, createUnitClass(id, blockCopy.type));
        if (this.props.useVisualStyles) units.sort((a, b) => isUnitStyleOn(b) - isUnitStyleOn(a));
        this.editableTitleInstances = units.map(_ => preact.createRef());
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
    handleMoreMenuLinkClicked({id}) {
        if (id === 'edit-style-title')
            this.editableTitleInstances[this.liIdxOfOpenMoreMenu].current.open();
        else if (id === SET_AS_DEFAULT || id === EDIT_DETAILS) {
            const unit = this.state.units[this.liIdxOfOpenMoreMenu];
            const blockTypeName = this.props.blockCopy.type;
            const remote = id === SET_AS_DEFAULT ? null : findRealUnit(unit, blockTypeName);
            const [unitId, blockTypeNameAdjusted] = remote === unit ? [unit.id, blockTypeName] : [remote.id, SPECIAL_BASE_UNIT_NAME];
            const [isEdit, title, specifier, isDerivable, onConfirmed] = id === SET_AS_DEFAULT
                ? [false, 'Set as default', undefined, unit.isDerivable, (specifier, isDerivable) => {
                    this.setUnitAsDefault(specifier, isDerivable, unit);
                }]
                : [true, 'Edit details', remote.specifier, remote.isDerivable, (specifierNew, isDerivableNew) => {
                    if (specifierNew !== specifier)
                        emitUpdatedRemoteCss(specifier, remote, blockTypeName);
                    if (isDerivableNew !== isDerivable) {
                        const dataBefore = {isDerivable};
                        const changes = {isDerivable: isDerivableNew};
                        emitUnitChanges(changes, dataBefore, blockTypeNameAdjusted, unitId);
                    }
                }];
            floatingDialog.open(EditUnitOrSetAsDefaultDialog, {
                title: __(title),
                height: 286,
            }, {
                blockTypeName,
                specifier,
                showSpecifier: !isEdit || remote !== unit,
                isDerivable,
                isEdit,
                onConfirmed,
            });
        } else if (id === 'delete-style') {
            const unit = this.state.units[this.liIdxOfOpenMoreMenu];
            const maybeRemote = findRealUnit(unit, this.props.blockCopy.type);
            if (maybeRemote === unit)
                removeStyleUnit(this.props.blockCopy.type, unit);
            else
                removeStyleUnit(SPECIAL_BASE_UNIT_NAME, maybeRemote, unit);
        }
    }
    /**
     * @param {String} specifier 'something' or ''
     * @param {Boolean} isDerivable
     * @param {ThemeStyleUnit} unit
     * @access private
     */
    setUnitAsDefault(specifier, isDerivable, unit) {
        const dataBefore = {...unit, ...{origin: '', specifier: '', isDerivable}};
        const blockTypeName = this.props.blockCopy.type;
        const [emptied, toBody] = createDefaultUnit(unit, blockTypeName, specifier);

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

        // #2
        const addedStyleToBlock = !blockHasStyle(this.props.blockCopy, cls);
        if (addedStyleToBlock)
            this.props.emitAddStyleClassToBlock(cls, this.props.blockCopy);

        // #1
        const newUnit = {title, id, scss, generatedCss: serialize(compile(`.${cls}{${scss}}`), stringify),
            origin: '', specifier: '', isDerivable: /yleinen|yleiset|common/.test(title.toLowerCase()), derivedFrom: null};
        if (current) store2.dispatch('themeStyles/addUnitTo', [type, newUnit]);
        else store2.dispatch('themeStyles/addStyle', [{units: [newUnit], blockTypeName: type}]);

        //
        emitCommitStylesOp(type, () => {
            // Revert # 1
            if (current) store2.dispatch('themeStyles/removeUnitFrom', [type, newUnit]);
            else store2.dispatch('themeStyles/removeStyle', [type]);

            // Revert # 2
            if (addedStyleToBlock) setTimeout(() => { api.saveButton.triggerUndo(); }, 100);
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
        const combAsString = unitClses + (unitClses ? ` ${v}` : v);
        // emit > props.grabBlockChanges() @constructor -> setState()
        this.props.emitSetBlockStylesClasses(combAsString, this.props.blockCopy);
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
 * @param {String} blockTypeName
 * @param {ThemeStyleUnit} unit
 * @param {ThemeStyleUnit|null} real
 */
function removeStyleUnit(blockTypeName, unit, real) {
    store2.dispatch('themeStyles/removeUnitFrom', [blockTypeName, unit]);
    //
    const clone = Object.assign({}, unit);
    emitCommitStylesOp(blockTypeName, () => {
        store2.dispatch('themeStyles/addUnitTo', [blockTypeName, clone]);
        if (real) store2.dispatch('themeStyles/addUnitTo', [clone.origin, real]);
    }, ...(!real ? [null, null] : [real, unit.origin]));
}

class EditableTitle extends preact.Component {
    // popup;
    /**
     * @param {{unitId: String; unitIdReal: String|null; currentTitle: String; blockTypeName: String; userCanEditCss: Boolean; subtitle: String|null;}} props
     */
    constructor(props) {
        super(props);
        this.popup = preact.createRef();
        this.state = {popupIsOpen: false};
    }
    /**
     * @access public
     */
    open() {
        this.setState(hookForm(this, [
            {name: 'title', value: this.props.currentTitle, validations: [['required'], ['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]],
             label: __('Style name')},
        ], {
            popupIsOpen: true,
        }));
        this.popup.current.open();
    }
    /**
     * @returns {Boolean}
     * @access public
     */
    isOpen() {
        return this.timeout ? true : this.popup.current && this.popup.current.state.isOpen;
    }
    /**
     * @access protected
     */
    render({currentTitle, userCanEditCss, subtitle}, {popupIsOpen, values}) {
        return [
            <span class="text-ellipsis">
                { values ? values.title : currentTitle }
                { subtitle
                    ? <i style="font-size: .5rem; left: 1.7rem; bottom: -6px;" class="p-absolute color-dimmed3">
                        { subtitle }
                    </i>
                    : null
                }
            </span>,
            userCanEditCss ? <PopupPrerendered ref={ this.popup }>{ popupIsOpen
                ? <form onSubmit={ this.applyNewTitleAndClose.bind(this) } class="text-left pb-1">
                    <FormGroup>
                        <label htmlFor="title" class="form-label pt-1">{ __('Style name') }</label>
                        <Input vm={ this } prop="title"/>
                        <InputErrors vm={ this } prop="title"/>
                    </FormGroup>
                    <button class="btn btn-sm px-2" type="submit" disabled={ hasErrors(this) }>Ok</button>
                    <button onClick={ this.discardNewTitleAndClose.bind(this) } class="btn btn-sm btn-link ml-1" type="button">{ __('Cancel') }</button>
                </form>
                : null
            }
            </PopupPrerendered> : null,
            <span class="pl-2 pt-1 edit-icon-outer">
            <Icon iconId="dots" className={ `size-xs color-dimmed${userCanEditCss ? '' : ' d-none'}` }/>
            </span>
        ];
    }
    /**
     * @param {Event} e
     * @access private
     */
    applyNewTitleAndClose(e) {
        e.preventDefault();
        if (hasErrors(this)) return;
        const newTitle = this.state.values.title;
        const {currentTitle, subtitle} = this.props;
        const dataBefore = {title: currentTitle};
        const [blockTypeName, unitId] = !subtitle
            ? [this.props.blockTypeName, this.props.unitId]
            : [SPECIAL_BASE_UNIT_NAME, this.props.unitIdReal];
        store2.dispatch('themeStyles/updateUnitOf', [blockTypeName, unitId, {title: newTitle}]);
        emitCommitStylesOp(blockTypeName, () => {
            store2.dispatch('themeStyles/updateUnitOf', [blockTypeName, unitId, dataBefore]);
        });
        this.close();
    }
    /**
     * @access private
     */
    close() {
        this.popup.current.close();
        this.setState({popupIsOpen: false, values: null, errors: null});
        // Prevent @BlockStyleTab.render()'s handleLiClick from triggering
        this.timeout = 1;
        setTimeout(() => {
            this.timeout = false;
            unhookForm(this);
        }, 1);
    }
    /**
     * @access private
     */
    discardNewTitleAndClose() {
        this.close();
    }
}

/**
 * @param {StyleTextareaProps} props
 * @returns {ThemeStyleUnit}
 */
function getRealUnit(props) {
    return props.unitCopyReal || props.unitCopy;
}

class StyleTextarea extends preact.Component {
    // handleCssInputChangedThrottled;
    /**
     * @access protected
     */
    componentWillMount() {
        this.init(this.props);
        this.updateState(this.props);
    }
    /**
     * @param {StyleTextareaProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        this.init(props);
        if (getRealUnit(props).scss !== this.state.scssCommitted)
            this.updateState(props);
    }
    /**
     * @access protected
     */
    render(props, {scssNotCommitted, error}) {
        return <div class="pb-2 pr-2">
            { props.blockTypeName !== SPECIAL_BASE_UNIT_NAME ? null : <div class="p-absolute" style="right: 1.1rem;z-index: 1;margin: 0.3rem 0 0 0;">
                <Icon iconId="info-circle" className="size-xs color-dimmed3"/>
                <span ref={ el => tempHack2(el, 'bodyStyles', this) } class="my-tooltip tooltip-prerendered tooltip-dark">
                    <span>&lt;body&gt; -elementin tyylit. Voit esim. määritellä tänne muuttujia ja käyttää niitä sisältölohkojen tyyleissä.</span>
                    <span class="popper-arrow" data-popper-arrow></span>
                </span>
            </div> }
            <textarea
                value={ scssNotCommitted }
                onInput={ this.handleCssInputChangedThrottled }
                class="form-input code"
                placeholder={ `color: green;\n.nested {\n  color: blue;\n}` }
                rows="12"></textarea>
            <InputError errorMessage={ error }/>
        </div>;
    }
    /**
     * @param {StyleTextareaProps} props
     * @access private
     */
    updateState(props) {
        this.setState({scssNotCommitted: getRealUnit(props).scss, scssCommitted: getRealUnit(props).scss, error: ''});
    }
    /**
     * @param {StyleTextareaProps} props
     * @access private
     */
    init(props) {
        if (props.isVisible && !this.handleCssInputChangedThrottled) {
            this.cssValidator = new CssStylesValidatorHelper;
            this.handleCssInputChangedThrottled = timingUtils.debounce(e => {
                if (!this.props.unitCopyReal)
                    updateAndEmitUnitScss(this.props.unitCopy, copy => {
                        const currentlyCommitted = copy.scss;
                        const {unitCls} = this.props;
                        const allowImports = unitCls === 'j-_body_';
                        const [shouldCommit, result] = this.cssValidator.validateAndCompileScss(e.target.value,
                            input => `.${unitCls}{${input}}`, currentlyCommitted, allowImports);
                        // Wasn't valid -> commit to local state only
                        if (!shouldCommit) {
                            this.setState({scssNotCommitted: e.target.value, error: result.error});
                            return null;
                        }
                        // Was valid, dispatch to the store (which is grabbed by BlockStylesTab.contructor and then this.componentWillReceiveProps())
                        return {newScss: e.target.value,
                                newGenerated: result.generatedCss || ''};
                    }, this.props.blockTypeName);
                else
                    updateAndEmitUnitScss(this.props.unitCopyReal, copy => {
                        const [shouldCommit, result] = compileSpecial(e.target.value, copy.scss, copy.specifier,
                            this.props.unitCls, this.props.blockTypeName, this.cssValidator);
                        //
                        if (!shouldCommit) {
                            this.setState({scssNotCommitted: e.target.value, error: result.error});
                            return null;
                        }
                        //
                        return {newScss: e.target.value,
                                newGenerated: result.generatedCss || ''};
                    }, SPECIAL_BASE_UNIT_NAME);
            }, env.normalTypingDebounceMillis);
        }
    }
}

/**
 * @param {ThemeStyleUnit} unitCopy
 * @param {(unitCopy: ThemeStyleUnit) => ({scss?: String; generatedCss?: String; specifier?: String;}|null)} getUpdates
 * @param {String} blockTypeName
 */
function updateAndEmitUnitScss(unitCopy, getUpdates, blockTypeName) {
    const {id, generatedCss, scss} = unitCopy;
    const dataBefore = {scss, generatedCss};
    //
    const updates = getUpdates(unitCopy);
    if (!updates) return;
    //
    emitUnitChanges({scss: updates.newScss, generatedCss: updates.newGenerated},
        dataBefore, blockTypeName, id);
}

/**
 * @param {{scss?: String; generatedCss?: String; specifier?: String; isDerivable?: String;}} updates
 * @param {ThemeStyleUnit} before
 * @param {String} blockTypeName
 * @param {String} unitId
 * @param {() => void} doUndo = null
 */
function emitUnitChanges(updates, before, blockTypeName, unitId, doUndoFn = null) {
    store2.dispatch('themeStyles/updateUnitOf', [blockTypeName, unitId, updates]);
    emitCommitStylesOp(blockTypeName, doUndoFn || (() => {
        store2.dispatch('themeStyles/updateUnitOf', [blockTypeName, unitId, before]);
    }));
}

/**
 * @param {String} newScss
 * @param {String} curScss
 * @param {String} specifier '>' or ''
 * @param {String} unitCls 'j-Section-unit-13'
 * @param {String} blockTypeName 'Section'
 * @param {CssStylesValidatorHelper} cssValidator = new CssStylesValidatorHelper
 * @returns {Array<Boolean|{generatedCss: String|null; error: String;}>}
 */
function compileSpecial(newScss, curScss, specifier, unitCls, blockTypeName, cssValidator = new CssStylesValidatorHelper) {
    const currentlyCommitted = curScss;
    const allowImports = false;
    const selBtype = createUnitClass('', blockTypeName);
    // '.j-_body_ .j-Section:not(.no-j-Section-unit-1) {' or '.j-_body_ > .j-Section:not(.no-j-Section-unit-1) {' or
    // '.j-_body_ > .j-Section:not(...'
    const wrap1 = `.${unitClsBody}${validateAndGetSpecifier(specifier)} .${selBtype}:not(.no-${unitCls}) {`;
    const wrap2 =  '}';
    return cssValidator.validateAndCompileScss(newScss,
        input => `${wrap1}${input}${wrap2}`, currentlyCommitted, allowImports);
}

/**
 * @param {Array<{title: String; [key: String]: any;}} currentUnits
 * @returns {Number}
 */
function getLargestPostfixNum(currentUnits) {
    return currentUnits.reduce((out, {id}) => {
        const maybe = parseInt(id.split('-').pop());
        return !isNaN(maybe) ? maybe > out ? maybe : out : out;
    }, 0);
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
 * @param {Array<ThemeStyle>} from
 * @param {String} blockTypeName
 * @returns {ThemeStyle|undefined}
 */
function findBlockTypeStyles(from, blockTypeName) {
    return from.find(s => s.blockTypeName === blockTypeName);
}

/**
 * @param {String} blockTypeName
 * @param {() => void} doUndo
 * @param {ThemeStyleUnit} removedRemote = null
 * @param {String} removedRemoteBlockTypeName = null
 */
function emitCommitStylesOp(blockTypeName, doUndo, removedRemote = null, removedRemoteBlockTypeName = null) {
    const url = `/api/themes/${api.getActiveTheme().id}/styles/scope-block-type/${blockTypeName}`;
    store.dispatch(pushItemToOpQueue(`upsert-theme-style#${url}`, {
        doHandle: () => {
            const style = findBlockTypeStyles(store2.get().themeStyles, blockTypeName);
            const remoteStyle = removedRemote ? getRemoteStyleIfRemoved(style.units, removedRemote.id, removedRemoteBlockTypeName) : null;
            const data = {
                ...{units: style.units},
                ...(!remoteStyle ? {} : {connectedUnits: remoteStyle.units, connectedUnitsBlockTypeName: removedRemoteBlockTypeName})
            };
            return http.put(url, data)
                .then(resp => {
                    if (resp.ok !== 'ok') throw new Error('-');
                    return true;
                })
                .catch(err => {
                    env.window.console.error(err);
                    return true;
                });
        },
        doUndo,
        args: [],
    }));
}

/**
 * @param {Array<ThemeStyleUnit>} bodyUnits
 * @param {String} removedUnitId
 * @param {String} removedUnitBlockTypeName
 */
function getRemoteStyleIfRemoved(bodyUnits, removedUnitId, removedUnitBlockTypeName) {
    const lookFor = createUnitClass(removedUnitId, removedUnitBlockTypeName);
    // Normal case: $lookFor is _not_ found from $bodyUnits
    if (!bodyUnits.some(({id}) => id === lookFor))
        return findBlockTypeStyles(store2.get().themeStyles, removedUnitBlockTypeName);

    return null;
}

/**
 * @param {RawBlock} blockCopy
 * @param {String} cls
 * @param {ThemeStyleUnit|null} unit = null
 * @returns {Boolean}
 */
function blockHasStyle(blockCopy, cls, unit = null) {
    return !(unit && unit.origin === SPECIAL_BASE_UNIT_NAME) ? blockHasStyleClass(cls, blockCopy) : !blockHasStyleClass(`no-${cls}`, blockCopy);
}

/**
 * @param {String} cls
 * @param {RawBlock} block
 * @param {Boolean} isRemote = false
 * @returns {Boolean}
 */
function blockHasStyleClass(cls, {styleClasses}, isRemote = false) {
    return !isRemote
        ? styleClasses.split(' ').indexOf(cls) > -1
        : styleClasses.split(' ').indexOf(`no-${cls}`) < 0;
}

/**
 * @param {ThemeStyleUnit} unit
 * @returns {Boolean}
 */
function isSpecialUnit({id}) {
    const pushIdLength = 20;
    return !id.startsWith('unit-') && id.length === pushIdLength;
}

let stylesCached = null;

/**
 * @returns {Promise<{globalStyles: Array<RawCssRule>; styles: Array<ThemeStyle>;}>}
 */
function fetchThemeStyles() {
    if (stylesCached)
        return Promise.resolve(stylesCached);
    return http.get(`/api/themes/${api.getActiveTheme().id}/styles`)
        .then(styles => {
            stylesCached = styles;
            return stylesCached;
        })
        .catch(env.window.console.error);
}

function tempHack(then = null) {
    const {themeStyles} = store2.get();
    if (!themeStyles) {
        fetchThemeStyles().then(stylesCombined => {
            store2.dispatch('themeStyles/setAll', [stylesCombined.styles]);
            if (then) then(stylesCombined);
        });
        return null;
    } else {
        if (then) then(stylesCached);
        return themeStyles;
    }
}

/**
 * @param {String} styleClasses
 * @returns {[String, String]} [unitClasses, nonUnitClasses]
 */
function splitUnitAndNonUnitClasses(styleClasses) {
    const all = styleClasses.split(' ');
    return all
        .map(cls => cls.startsWith('j-'))
        .reduce((arrs, isUnitCls, i) => {
            arrs[isUnitCls ? 0 : 1].push(all[i]);
            return arrs;
        }, [[], []])
        .map(clsList => clsList.join(' '));
}

/**
 * @param {Array<ThemeStyle>} themeStyles
 * @param {RawBlock} block
 * @returns {[RawBlock|null, String|null, 'parent'|'base']} [parentBlock, styleUnitClass, styleType]
 */
function findParentStyleInfo(themeStyles, block) {
    const scoped = findScopedParentStyle(themeStyles, block);
    if (scoped[0]) return scoped;
    //
    return [null, `j-${SPECIAL_BASE_UNIT_NAME}`, 'base'];
}

/**
 * @param {Array<ThemeStyle>} themeStyles
 * @param {RawBlock} block
 * @param {Array<RawBlock>|null} tree = null
 * @returns {[RawBlock|null, String|null, 'parent'|null]} [parentBlock, styleUnitClass, type]
 */
function findScopedParentStyle(themeStyles, block, tree = null) {
    if (!tree) {
        const root = blockTreeUtils.findBlockSmart(block.id, store2.get().theBlockTree)[3];
        tree = blockTreeUtils.isMainTree(root) ? root : root.blocks;
    }
    const paren = blockTreeUtils.findBlock(block.id, tree)[2];
    if (!paren) return [null, null, null];
    //
    const {units} = (findBlockTypeStyles(themeStyles, paren.type) || {units: []});
    if (units.length) {
        const unitClses = units.map(({id}) => createUnitClass(id, paren.type));
        const firstEnabledUnit = unitClses.find(cls => blockHasStyleClass(cls, paren));
        if (firstEnabledUnit) return [paren, firstEnabledUnit, 'parent'];
        // else keep looking
    }
    // keep looking
    return findScopedParentStyle(themeStyles, paren, tree);
}

/**
 * @param {[RawBlock|null, String|null, 'parent'|'base']} parentStyleInfo
 * @param {'style-templates-tab'} origin = null
 */
function goToStyle([block, unitCls, kind], origin = null) {
    if (kind === 'parent')
        signals.emit('block-styles-show-parent-styles-button-clicked', block, unitCls, origin);
    else
        signals.emit('block-styles-go-to-base-styles-button-clicked');
}

/**
 * @param {String} scss
 * @returns {String}
 */
function normalizeScss(scss) {
    return scss.endsWith(';') || scss.endsWith('}') ? scss : `${scss};`;
}

/**
 * @param {ThemeStyleUnit} unit1
 * @param {String} blockTypeName
 * @param {Array<ThemeStyle>} themeStyles = null
 * @returns {ThemeStyleUnit}
 */
function findRealUnit(unit1, blockTypeName, themeStyles = null) {
    if (!unit1.origin) return unit1;
    if (unit1.origin !== SPECIAL_BASE_UNIT_NAME) throw new Error('Not implemented.');
    //
    if (!themeStyles) ({themeStyles} = store2.get());
    const bodyStyle = themeStyles.find(({blockTypeName}) => blockTypeName === SPECIAL_BASE_UNIT_NAME);
    const lookFor = createUnitClass(unit1.id, blockTypeName);
    return bodyStyle.units.find(({id}) => id === lookFor) || unit1;
}

/**
 * @param {String} candidate
 * @returns {String} ` ${candidate}` or ''
 */
function validateAndGetSpecifier(candidate) {
    if (!candidate) return '';
    // todo validate
    return ` ${candidate}`;
}

/**
 * @param {ThemeStyleUnit} from
 * @param {String} blockTypeName
 * @param {String} specifier
 */
function createDefaultUnit(from, blockTypeName, specifier) {
    // Example: {"title":"","id":"unit-13","scss":"","generatedCss":"","origin":"_body_","specifier":"","isDerivable":false,"derivedFrom":"unit-2"}
    const emptied = {
        title: '',
        id: from.id,
        scss: '',
        generatedCss: '',
        origin: SPECIAL_BASE_UNIT_NAME,
        specifier: '',
        isDerivable: false,
        derivedFrom: null,
    };
    // Example: {"title":"Default","id":"j-Section-unit-13","scss":<scss>,"generatedCss":".j-_body_ .j-Section:not(.no-j-Section-unit-13) {<compiled>}}","origin":null,"specifier":"","isDerivable":false,"derivedFrom":"unit-2"}
    const moveToBody = {
        title: from.title,
        id: createUnitClass(emptied.id, blockTypeName),
        scss: from.scss,
        generatedCss: 'filled-below',
        origin: blockTypeName,
        specifier: specifier || '',
        isDerivable: from.isDerivable,
        derivedFrom: from.derivedFrom,
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

function tempHack2(el, popperId, cmp) {
    if (!el || cmp[`${popperId}-load`]) return;
    cmp[`${popperId}-load`] = true;
    createTrier(() => {
        if (!window.Popper) return false;
        createPopper(el, popperId, cmp);
        cmp[`${popperId}-load`] = false;
        return true;
    }, 100, 20)();
}

/**
 * @param {HTMLElement} el
 * @param {String} popperId
 * @param {BlockStylesTab} cmp
 * @param {Number} overflowPadding = 8
 */
function createPopper(el, popperId, cmp, overflowPadding = 8) {
    if (!el || cmp[popperId]) return;
    //
    const ref = el.previousElementSibling;
    const content = el;
    cmp[popperId] = window.Popper.createPopper(ref, content, {
        placement: 'top',
        modifiers: [{
            name: 'offset',
            options: {offset: [0, 8]},
        }, {
            name: 'preventOverflow',
            options: {altAxis: true, padding: overflowPadding},
        }],
    });
    ref.addEventListener('mouseenter', () => showPopper(content, cmp[popperId]));
    ref.addEventListener('mouseleave', () => hidePopper(content));
}

function showPopper(content, popperInstance) {
    content.classList.add('visible');
    popperInstance.update();
}

function hidePopper(content) {
    content.classList.remove('visible');
}

/**
 * @typedef StyleTextareaProps
 * @prop {ThemeStyleUnit} unitCopy
 * @prop {ThemeStyleUnit|null} unitCopyReal
 * @prop {String} unitCls
 * @prop {String} blockTypeName
 * @prop {Boolean} isVisible
 */

export default CodeBasedStylesList;
export {normalizeScss, getLargestPostfixNum, findBlockTypeStyles, tempHack, blockHasStyle,
        findParentStyleInfo, updateAndEmitUnitScss, emitCommitStylesOp, goToStyle,
        EditableTitle, compileSpecial, StyleTextarea, SPECIAL_BASE_UNIT_NAME};
