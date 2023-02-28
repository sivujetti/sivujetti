import {__, api, env, http, signals, timingUtils, Icon, LoadingSpinner, hookForm,
    unhookForm, Input, FormGroup, InputErrors, InputError, hasErrors} from '@sivujetti-commons-for-edit-app';
import {Popup} from '../../block-types/listing/AdditionalFiltersBuilder.jsx';
import {createTrier} from '../../block/dom-commons.js';
import ContextMenu from '../../commons/ContextMenu.jsx';
import CssStylesValidatorHelper from '../../commons/CssStylesValidatorHelper.js';
import store2, {observeStore as observeStore2} from '../../store2.js';
import store, {pushItemToOpQueue} from '../../store.js';
import {validationConstraints} from '../../constants.js';
import exampleScss from '../../example-scss.js';
import VisualStyles from './VisualStyles.jsx';
import blockTreeUtils from './blockTreeUtils.js';

let compile, serialize, stringify;
let emitSaveStylesToBackendOp;

const SPECIAL_BASE_UNIT_NAME = '_body_';

class BlockStylesTab extends preact.Component {
    // userCanEditVars;
    // userCanEditCss;
    // useVisualStyles;
    // editableTitleInstances;
    // moreMenu;
    // extraBlockStyleClassesTextareaEl;
    // currentBlockUnitStyleClasses;
    // throttledDoHandleUtilsClassesInput;
    // unregistrables;
    // liIdxOfOpenMoreMenu;
    // refElOfOpenMoreMenu;
    /**
     * @param {{emitAddStyleClassToBlock: (styleClassToAdd: String, block: RawBlock) => void; emitRemoveStyleClassFromBlock: (styleClassToRemove: String, block: RawBlock) => void; emitSetBlockStylesClasses: (newStyleClasses: String, block: RawBlock) => void; getBlockCopy: () => RawBlock; grabBlockChanges: (withFn: (block: RawBlock, origin: blockChangeEvent, isUndo: Boolean) => void) => void; isVisible: Boolean;}} props
     */
    constructor(props) {
        super(props);
        ({compile, serialize, stringify} = window.stylis);
        this.userCanEditVars = api.user.can('editThemeVars');
        this.userCanEditCss = api.user.can('editThemeCss');
        this.useVisualStyles = !this.userCanEditCss && this.userCanEditVars;
        emitSaveStylesToBackendOp = this.userCanEditCss ? emitCommitStylesOp : null;
        this.editableTitleInstances = [];
        this.moreMenu = preact.createRef();
        this.extraBlockStyleClassesTextareaEl = preact.createRef();
        this.currentBlockUnitStyleClasses = '';
        this.throttledDoHandleUtilsClassesInput = timingUtils.debounce(
            this.handleUtilClassesInputChanged.bind(this),
            env.normalTypingDebounceMillis);
        const blockCopy = props.getBlockCopy();
        this.state = Object.assign({units: [], liClasses: [], blockCopy}, this.createBlockClassesState(blockCopy));
        this.unregistrables = [observeStore2('themeStyles', ({themeStyles}, [event]) => {
            const {units} = (findBlockTypeStyles(themeStyles, this.state.blockCopy.type) || {});
            if (this.state.units !== units)
                this.updateUnitsState(units, themeStyles, this.getOpenLiIdx(event, units));
        }),
        ];
        props.grabBlockChanges((block, _origin, _isUndo) => {
            if (this.state.blockCopy.styleClasses !== block.styleClasses)
                this.setState(this.createBlockClassesState(block));
        });
    }
    /**
     * @access protected
     */
    componentWillReceiveProps({isVisible}) {
        if (isVisible && !this.props.isVisible) {
            this.setState({themeStyles: null});
            const themeStyles = tempHack();
            if (themeStyles)
                this.updateUnitsState((findBlockTypeStyles(themeStyles, this.state.blockCopy.type) || {}).units, themeStyles);
            // else Wait for store2.dispatch('themeStyles/setAll')
        }
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
    render({isVisible}, {units, blockCopy, liClasses, extraBlockStyleClassesNotCommitted, extraBlockStyleClassesError,
                        parentStyleInfo}) {
        if (!isVisible) return null;
        const {userCanEditVars, userCanEditCss} = this;
        return [
            units !== null ? units.length ? <ul class="list styles-list mb-2">{ units.map((unit, i) => {
                const liCls = liClasses[i];
                const cls = this.createClass(unit.id);
                const isActivated = this.currentBlockHasStyle(cls);
                const [cssVars, ast] = !this.useVisualStyles ? [[], []] : VisualStyles.extractVars(unit.scss, cls);
                const doShowChevron = userCanEditCss || (this.useVisualStyles && cssVars.length);
                return <li class={ liCls } data-cls={ cls } key={ unit.id }>
                    <header class="flex-centered p-relative">
                        <button
                            onClick={ e => this.handleLiClick(e, i) }
                            class="col-12 btn btn-link text-ellipsis with-icon pl-2 mr-1 no-color"
                            title={ userCanEditCss ? `.${cls}` : '' }
                            type="button">
                            <Icon iconId="chevron-down" className={ `size-xs${doShowChevron ? '' : ' d-none'}` }/>
                            { userCanEditCss
                                ? <EditableTitle
                                    unitId={ unit.id }
                                    currentTitle={ unit.title }
                                    blockCopy={ this.state.blockCopy }
                                    userCanEditCss={ userCanEditCss }
                                    ref={ this.editableTitleInstances[i] }/>
                                : <span class="text-ellipsis">{ unit.title }</span> }
                        </button>
                        <label class="form-checkbox p-absolute" title={ __('Use style') } style="right:-.28rem">
                            <input
                                onClick={ e => this.toggleStyleIsActivated(cls, e.target.checked) }
                                checked={ isActivated }
                                value={ unit.id }
                                type="checkbox"/>
                            <i class="form-icon"></i>
                        </label>
                    </header>
                    { userCanEditCss
                        ? <StyleTextarea
                            unitCopy={ Object.assign({}, unit) }
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
                type="button">{ __('Add styles') }</button>
        ] : [])
        .concat(userCanEditVars && parentStyleInfo && parentStyleInfo[2] ? [
            <button
                onClick={ () => this.goToStyle(parentStyleInfo) }
                class="btn btn-sm"
                type="button">{ __('Show parent styles') }</button>
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
                <span ref={ el => tempHack2(el, 'utilClasses', this) } class="my-tooltip dark">
                    <span>Voit määritellä sekalaiset utility-luokat tähän.</span>
                    <span class="popper-arrow" data-popper-arrow></span>
                </span>
            </div>,
            <InputError errorMessage={ extraBlockStyleClassesError }/>,
            <ContextMenu
                links={ [
                    {text: __('Edit name'), title: __('Edit name'), id: 'edit-style-title'},
                    {text: __('Delete'), title: __('Delete style'), id: 'delete-style'},
                ] }
                onItemClicked={ this.handleMoreMenuLinkClicked.bind(this) }
                onMenuClosed={ () => { this.refElOfOpenMoreMenu.style.opacity = ''; } }
                ref={ this.moreMenu }/>
        ] : []);
    }
    /**
     * @param {Event} e
     * @param {Number} i
     * @access private
     */
    handleLiClick(e, i) {
        if (this.userCanEditCss && this.editableTitleInstances[i].current.isOpen()) return;
        //
        const moreMenuIconEl = e.target.classList.contains('edit-icon-outer') ? e.target : e.target.closest('.edit-icon-outer');
        if (!moreMenuIconEl) {
            const accordBtn = e.target.classList.contains('no-color') ? e.target : e.target.closest('.no-color');
            const hasDecls = accordBtn.querySelector(':scope > .icon-tabler.d-none') === null;
            if (this.userCanEditCss || hasDecls) this.toggleIsCollapsed(i);
        }
        else this.openMoreMenu(moreMenuIconEl, i);
    }
    /**
     * @param {Array<ThemeStyleUnit>|undefined} candidate
     * @param {Array<ThemeStyle>} themeStyles
     * @param {Number} currentOpenIdx = -1
     * @access private
     */
    updateUnitsState(candidate, themeStyles, currentOpenIdx = -1) {
        const units = candidate || [];
        const isUnitStyleOn = ({id}) => this.currentBlockHasStyle(this.createClass(id));
        if (this.useVisualStyles) units.sort((a, b) => isUnitStyleOn(b) - isUnitStyleOn(a));
        this.editableTitleInstances = units.map(_ => preact.createRef());
        this.setState({units, liClasses: createLiClasses(units, currentOpenIdx),
            parentStyleInfo: findParentStyleInfo(themeStyles, this.state.blockCopy)});
    }
    /**
     * @param {RawBlock} block
     * @returns {{blockCopy: RawBlock; extraBlockStyleClassesNotCommitted: String; extraBlockStyleClassesError: String;}}
     * @access private
     */
    createBlockClassesState(block) {
        const [unitClases, nonUnitClses] = splitUnitAndNonUnitClasses(block.styleClasses);
        this.currentBlockUnitStyleClasses = unitClases;
        return {blockCopy: block, extraBlockStyleClassesNotCommitted: nonUnitClses,
            extraBlockStyleClassesError: ''};
    }
    /**
     * @param {HTMLSpanElement} iconEl
     * @param {Number} liIdx
     * @access private
     */
    openMoreMenu(iconEl, liIdx) {
        this.liIdxOfOpenMoreMenu = liIdx;
        this.refElOfOpenMoreMenu = iconEl;
        this.refElOfOpenMoreMenu.style.opacity = '1';
        this.moreMenu.current.open({target: iconEl});
    }
    /**
     * @param {ContextMenuLink} link
     * @access private
     */
    handleMoreMenuLinkClicked({id}) {
        if (id === 'edit-style-title') {
            this.editableTitleInstances[this.liIdxOfOpenMoreMenu].current.open();
        } else if (id === 'delete-style') {
            this.removeStyleUnit(this.state.units[this.liIdxOfOpenMoreMenu]);
        }
    }
    /**
     * @param {String} cls
     * @param {Boolean} newIsActivated
     * @access private
     */
    toggleStyleIsActivated(cls, newIsActivated) {
        const currentIsActivated = this.currentBlockHasStyle(cls);
        if (newIsActivated && !currentIsActivated)
            this.props.emitAddStyleClassToBlock(cls, this.state.blockCopy);
        else if (!newIsActivated && currentIsActivated)
            this.props.emitRemoveStyleClassFromBlock(cls, this.state.blockCopy);
    }
    /**
     * @param {[RawBlock|null, String|null, 'parent'|'base']} parentStyleInfo
     * @access private
     */
    goToStyle([block, unitCls, kind]) {
        if (kind === 'parent')
            signals.emit('block-styles-show-parent-styles-button-clicked', block, unitCls);
        else
            signals.emit('block-styles-go-to-base-styles-button-clicked');
    }
    /**
     * @access private
     */
    addStyleUnit() {
        const {type} = this.state.blockCopy;
        const current = findBlockTypeStyles(store2.get().themeStyles, type);
        const rolling = current ? getLargestPostfixNum(current.units) + 1 : 1;
        const title = rolling > 1 ? `Unit ${rolling}` : 'Default';
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
        const cls = this.createClass(id);

        // #2
        const addedStyleToBlock = !this.currentBlockHasStyle(cls);
        if (addedStyleToBlock)
            this.props.emitAddStyleClassToBlock(cls, this.state.blockCopy);

        // #1
        const newUnit = {title, id, scss, generatedCss: serialize(compile(`.${cls}{${scss}}`), stringify)};
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
     * @param {ThemeStyleUnit} unit
     * @access private
     */
    removeStyleUnit(unit) {
        const {type} = this.state.blockCopy;
        store2.dispatch('themeStyles/removeUnitFrom', [type, unit]);
        //
        const clone = Object.assign({}, unit);
        emitCommitStylesOp(type, () => {
            store2.dispatch('themeStyles/addUnitTo', [type, clone]);
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
        this.props.emitSetBlockStylesClasses(combAsString, this.state.blockCopy);
    }
    /**
     * @param {String} cls
     * @returns {Boolean}
     * @access private
     */
    currentBlockHasStyle(cls) {
        return blockHasStyle(cls, this.state.blockCopy);
    }
    /**
     * @param {String} id
     * @returns {String}
     * @access private
     */
    createClass(id) {
        return createUnitClass(id, this.state.blockCopy.type);
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

class EditableTitle extends preact.Component {
    // popup;
    /**
     * @param {{unitId: String; currentTitle: String; blockCopy: RawBlock; userCanEditCss: Boolean;}} props
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
    render({currentTitle, userCanEditCss}, {popupIsOpen, values}) {
        return [
            <span class="text-ellipsis">{ values ? values.title : currentTitle }</span>,
            userCanEditCss ? <Popup ref={ this.popup }>{ popupIsOpen
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
            </Popup> : null,
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
        const {unitId, currentTitle} = this.props;
        const dataBefore = {title: currentTitle};
        const blockTypeName = this.props.blockCopy.type;
        store2.dispatch('themeStyles/updateUnitOf', [blockTypeName, unitId, {title: newTitle}]);
        emitSaveStylesToBackendOp(blockTypeName, () => {
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
        if (props.unitCopy.scss !== this.state.scssCommitted)
            this.updateState(props);
    }
    /**
     * @access protected
     */
    render({blockTypeName}, {scssNotCommitted, error}) {
        return <div class="pb-2 pr-2">
            { blockTypeName !== SPECIAL_BASE_UNIT_NAME ? null : <div class="p-absolute" style="right: 1.1rem;z-index: 1;margin: 0.3rem 0 0 0;">
                <Icon iconId="info-circle" className="size-xs color-dimmed3"/>
                <span ref={ el => tempHack2(el, 'bodyStyles', this) } class="my-tooltip dark">
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
        this.setState({scssNotCommitted: props.unitCopy.scss, scssCommitted: props.unitCopy.scss, error: ''});
    }
    /**
     * @param {StyleTextareaProps} props
     * @access private
     */
    init(props) {
        if (props.isVisible && !this.handleCssInputChangedThrottled) {
            this.cssValidator = new CssStylesValidatorHelper;
            this.handleCssInputChangedThrottled = timingUtils.debounce(e => {
                updateAndEmitUnitScss(this.props.unitCopy, unitCopy => {
                    const currentlyCommitted = unitCopy.scss;
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
            }, env.normalTypingDebounceMillis);
        }
    }
}

/**
 * @param {ThemeStyleUnit} unitCopy
 * @param {(unitCopy: ThemeStyleUnit) => ({newScss: String; newGenerated: String;}|null)} getUpdates
 * @param {String} blockTypeName
 */
function updateAndEmitUnitScss(unitCopy, getUpdates, blockTypeName) {
    const {id, generatedCss, scss} = unitCopy;
    const dataBefore = {scss, generatedCss};
    //
    const updates = getUpdates(unitCopy);
    if (!updates) return;
    const {newScss, newGenerated} = updates;
    if (!newScss) return;
    //
    store2.dispatch('themeStyles/updateUnitOf', [blockTypeName, id,
        {scss: newScss, generatedCss: newGenerated}]);
    emitCommitStylesOp(blockTypeName, () => {
        store2.dispatch('themeStyles/updateUnitOf', [blockTypeName, id,
        dataBefore]);
    });
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
 * @access private
 */
function emitCommitStylesOp(blockTypeName, doUndo) {
    const url = `/api/themes/${api.getActiveTheme().id}/styles/scope-block-type/${blockTypeName}`;
    store.dispatch(pushItemToOpQueue(`upsert-theme-style#${url}`, {
        doHandle: () => {
            const style = findBlockTypeStyles(store2.get().themeStyles, blockTypeName);
            return http.put(url, {units: style.units})
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
 * @param {String} id
 * @param {String} blockTypeName
 * @returns {String}
 */
function createUnitClass(id, blockTypeName) {
    return `j-${blockTypeName}-${id}`;
}

/**
 * @param {String} cls
 * @param {RawBlock} block
 * @returns {Boolean}
 */
function blockHasStyle(cls, {styleClasses}) {
    return styleClasses.split(' ').indexOf(cls) > -1;
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
        tree = Array.isArray(root) ? root : root.blocks;
    }
    const paren = blockTreeUtils.findBlock(block.id, tree)[2];
    if (!paren) return [null, null, null];
    //
    const {units} = (findBlockTypeStyles(themeStyles, paren.type) || {units: []});
    if (units.length) {
        const unitClses = units.map(({id}) => createUnitClass(id, paren.type));
        const firstEnabledUnit = unitClses.find(cls => blockHasStyle(cls, paren));
        if (firstEnabledUnit) return [paren, firstEnabledUnit, 'parent'];
        // else keep looking
    }
    // keep looking
    return findScopedParentStyle(themeStyles, paren, tree);
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
 * @prop {String} unitCls
 * @prop {String} blockTypeName
 * @prop {Boolean} isVisible
 */

export default BlockStylesTab;
export {StyleTextarea, tempHack, updateAndEmitUnitScss, SPECIAL_BASE_UNIT_NAME};
