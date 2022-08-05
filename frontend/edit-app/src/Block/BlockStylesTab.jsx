import {__, api, env, http, Icon, LoadingSpinner, InputError, FormGroup, hookForm,
        Input, InputErrors, hasErrors, unhookForm} from '@sivujetti-commons-for-edit-app';
import {timingUtils} from '../commons/utils.js';
import ContextMenu from '../commons/ContextMenu.jsx';
import CssStylesValidatorHelper from '../commons/CssStylesValidatorHelper.js';
import store2, {observeStore as observeStore2} from '../store2.js';
import store, {pushItemToOpQueue} from '../store.js';
import {validationConstraints} from '../constants.js';
import {triggerUndo} from '../SaveButton.jsx';
import {Popup} from '../block-types/Listing/EditForm.jsx';
import {createTrier} from '../../../webpage/src/EditAppAwareWebPage.js';
import exampleScss from '../example-scss.js';

let compile, serialize, stringify;

class BlockStylesTab extends preact.Component {
    // editableTitleInstances;
    // moreMenu;
    // extraBlockStyleClassesTextareaEl;
    // currentBlockUnitStyleClasses;
    // throttledDoHandleUtilsClassesInput;
    // unregistrables;
    // liIdxOfOpenMoreMenu;
    // refElOfOpenMoreMenu;
    /**
     * @param {{emitAddStyleToBlock: (styleClassToAdd: String, block: RawBlock2) => void; emitRemoveStyleFromBlock: (styleClassToRemove: String, block: RawBlock2) => void; emitSetBlockStyles: (newStyleClasses: String, block: RawBlock2) => void; getBlockCopy: () => RawBlock2; grabBlockChanges: (withFn: (block: RawBlock2, origin: blockChangeEvent, isUndo: Boolean) => void) => void; userCanEditCss: Boolean; isVisible: Boolean;}} props
     */
    constructor(props) {
        super(props);
        ({compile, serialize, stringify} = window.stylis);
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
            if (this.state.units !== units) {
                const openLiIdx = event === 'themeStyles/addUnitTo' || event === 'themeStyles/addStyle'
                    ? units.length - 1
                    : this.state.liClasses.findIndex(s => s !== '');
                this.updateUnitsState(units, openLiIdx);
            }
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
                this.updateUnitsState((findBlockTypeStyles(themeStyles, this.state.blockCopy.type) || {}).units);
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
    render({userCanEditCss, isVisible}, {units, blockCopy, liClasses, extraBlockStyleClassesNotCommitted, extraBlockStyleClassesError}) {
        if (!isVisible) return null;
        const emitSaveStylesToBackendOp = userCanEditCss ? emitCommitStylesOp : null;
        return [
            units !== null ? units.length ? <ul class="list styles-list mb-2">{ units.map((unit, i) => {
                const liCls = liClasses[i];
                const cls = this.createClass(unit.id);
                const isActivated = this.currentBlockHasStyle(cls);
                const handleLiClick = userCanEditCss ? e => {
                    if (this.editableTitleInstances[i].current.isOpen()) return;
                    const moreMenuIconEl = e.target.classList.contains('edit-icon-outer') ? e.target : e.target.closest('.edit-icon-outer');
                    if (!moreMenuIconEl) this.toggleIsCollapsed(i);
                    else this.openMoreMenu(moreMenuIconEl, i);
                } : () => this.toggleStyleIsActivated(cls, !isActivated);
                return <li class={ liCls } key={ unit.id }>
                    <header class="flex-centered init-relative">
                        <button
                            onClick={ handleLiClick }
                            class="col-12 btn btn-link text-ellipsis with-icon pl-2 mr-1 no-color"
                            title={ userCanEditCss ? `.${cls}` : __('Use style') }
                            type="button">
                            { userCanEditCss ? [
                            <Icon iconId="chevron-down" className={ `size-xs${userCanEditCss ? '' : ' d-none'}` }/>,
                            <EditableTitle
                                unitId={ unit.id }
                                currentTitle={ unit.title }
                                blockCopy={ this.state.blockCopy }
                                userCanEditCss={ userCanEditCss }
                                emitSaveStylesToBackendOp={ emitSaveStylesToBackendOp }
                                ref={ this.editableTitleInstances[i] }/>,
                            ] : <span class="text-ellipsis">{ unit.title }</span> }
                        </button>
                        <label class="form-checkbox init-absolute" title={ __('Use style') } style="right:-.28rem">
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
                        emitSaveStylesToBackendOp={ emitSaveStylesToBackendOp }
                        unitCls={ cls }
                        blockTypeName={ blockCopy.type }
                        isVisible={ liCls !== '' }/>
                    : null
                    }
                </li>;
            }) }</ul> : (userCanEditCss
                ? null
                : <p class="pt-1 mb-0 color-dimmed">{ __('No editable styles') }.</p>
            ) : <LoadingSpinner className="ml-1 mb-2 pb-2"/>
        ].concat(userCanEditCss ? [
            <button
                onClick={ this.addStyleUnit.bind(this) }
                class="btn btn-sm"
                type="button">{ __('Add styles') }</button>,
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
     * @param {Array<ThemeStyleUnit>|undefined} candidate
     * @param {Number} currentOpenIdx = -1
     * @access private
     */
    updateUnitsState(candidate, currentOpenIdx = -1) {
        const units = candidate || [];
        this.editableTitleInstances = units.map(_ => preact.createRef());
        this.setState({units, liClasses: createLiClasses(units, currentOpenIdx)});
    }
    /**
     * @param {RawBlock2} block
     * @returns {{blockCopy: RawBlock2; extraBlockStyleClassesNotCommitted: String; extraBlockStyleClassesError: String;}}
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
            this.props.emitAddStyleToBlock(cls, this.state.blockCopy);
        else if (!newIsActivated && currentIsActivated)
            this.props.emitRemoveStyleFromBlock(cls, this.state.blockCopy);
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
            this.props.emitAddStyleToBlock(cls, this.state.blockCopy);

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
            if (addedStyleToBlock) setTimeout(() => { triggerUndo(); }, 100);
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
        this.props.emitSetBlockStyles(combAsString, this.state.blockCopy);
    }
    /**
     * @param {String} cls
     * @returns {Boolean}
     * @access private
     */
    currentBlockHasStyle(cls) {
        return this.state.blockCopy.styleClasses.indexOf(cls) > -1;
    }
    /**
     * @param {String} id
     * @returns {String}
     * @access private
     */
    createClass(id) {
        return `j-${this.state.blockCopy.type}-${id}`;
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
}

class EditableTitle extends preact.Component {
    // popup;
    /**
     * @param {{unitId: String; currentTitle: String; blockCopy: RawBlock2; userCanEditCss: Boolean; emitSaveStylesToBackendOp: emitSaveStylesToBackendOpFn;}} props
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
        this.props.emitSaveStylesToBackendOp(blockTypeName, () => {
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
    // emitSaveStylesToBackendOp;
    /**
     * @access protected
     */
    componentWillMount() {
        this.init(this.props);
        this.updateState(this.props);
        this.emitSaveStylesToBackendOp = typeof this.props.emitSaveStylesToBackendOp === 'function'
            ? this.props.emitSaveStylesToBackendOp
            : emitCommitStylesOp;
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
            { blockTypeName !== '_body_' ? null : <div class="p-absolute" style="right: 1.1rem;z-index: 1;margin: 0.3rem 0 0 0;">
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
            this.handleCssInputChangedThrottled = timingUtils.debounce(
                this.handleScssInputChanged.bind(this),
                env.normalTypingDebounceMillis
            );
        }
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleScssInputChanged(e) {
        const {id, generatedCss, scss} = this.props.unitCopy;
        const currentlyCommitted = scss;
        const [shouldCommit, result] = this.cssValidator.validateAndCompileScss(e,
            input => `.${this.props.unitCls}{${input}}`, currentlyCommitted);
        // Wasn't valid -> commit to local state only
        if (!shouldCommit) {
            this.setState({scssNotCommitted: e.target.value, error: result.error});
            return;
        }
        // Was valid, dispatch to the store (which is grabbed by BlockStylesTab.contructor and then this.componentWillReceiveProps())
        const dataBefore = {scss: currentlyCommitted, generatedCss};
        const {blockTypeName} = this.props;
        store2.dispatch('themeStyles/updateUnitOf', [blockTypeName, id,
            {scss: e.target.value,
             generatedCss: result.generatedCss || ''}]);
        this.emitSaveStylesToBackendOp(blockTypeName, () => {
            store2.dispatch('themeStyles/updateUnitOf', [blockTypeName, id,
            dataBefore]);
        });
    }
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
 * @prop {emitSaveStylesToBackendOpFn?} emitSaveStylesToBackendOp
 * @prop {String} unitCls
 * @prop {String} blockTypeName
 * @prop {Boolean} isVisible
 *
 * @typedef {(blockTypeName: String, doUndo: () => void) => void} emitSaveStylesToBackendOpFn
 */

export default BlockStylesTab;
export {StyleTextarea, tempHack};
