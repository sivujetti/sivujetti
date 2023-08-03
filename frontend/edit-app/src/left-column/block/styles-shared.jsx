import {__, api, env, http, signals, timingUtils, Icon, hookForm,
    unhookForm, Input, FormGroup, InputErrors, InputError, hasErrors,
    validationConstraints} from '@sivujetti-commons-for-edit-app';
import {PopupPrerendered} from '../../block-types/listing/AddFilterPopup.jsx';
import {createTrier} from '../../block/dom-commons.js';
import CssStylesValidatorHelper from '../../commons/CssStylesValidatorHelper.js';
import store2 from '../../store2.js';
import store, {pushItemToOpQueue} from '../../store.js';
import {createUnitClass} from './VisualStyles.jsx';
import blockTreeUtils from './blockTreeUtils.js';
import {getIsStoredToTreeIdFrom} from '../../block/utils-utils.js';

const SPECIAL_BASE_UNIT_NAME = '_body_';
const specialBaseUnitCls = createUnitClass('', SPECIAL_BASE_UNIT_NAME);

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
 * @param {StyleTextareaProps} props
 * @returns {ThemeStyleUnit}
 */
function getRealUnit(props) {
    return props.unitCopyReal || props.unitCopy;
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
 * @param {Array<{id: String; [key: String]: any;}} currentUnits
 * @returns {Number}
 */
function getLargestPostfixNum(currentUnits) {
    return currentUnits.reduce((out, {id}) => {
        const maybe = parseInt(id.split('-').pop());
        return !isNaN(maybe) ? maybe > out ? maybe : out : out;
    }, 0);
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
 * @param {Array<ThemeStyle>} styles
 * @returns {ThemeStyleUnit}
*/
function findBodyStyle(styles) {
    return styles.find(s => s.blockTypeName === SPECIAL_BASE_UNIT_NAME);
}

/**
 * @param {ThemeStyle} bodyStyle
 * @returns {ThemeStyleUnit}
*/
function findBodyStyleMainUnit(bodyStyle) {
    return bodyStyle.units[0];
}

/**
 * @param {String} styleClassToAdd
 * @param {RawBlock} b
 * @returns {String}
 */
function emitAddStyleClassToBlock(styleClassToAdd, b) {
    const currentClasses = b.styleClasses;
    const newClasses = currentClasses ? `${currentClasses} ${styleClassToAdd}` : styleClassToAdd;
    dispatchNewBlockStyleClasses(newClasses, b);
    return newClasses;
}

/**
 * @param {String} newStyleClasses
 * @param {RawBlock} blockCopy
 * @access private
 */
function dispatchNewBlockStyleClasses(newStyleClasses, {id}) {
    const changes = {styleClasses: newStyleClasses};
    const isOnlyStyleClassesChange = true;
    const isStoredToTreeId = getIsStoredToTreeIdFrom(id, 'mainTree');
    store2.dispatch('theBlockTree/updateDefPropsOf', [id, isStoredToTreeId, changes, isOnlyStyleClassesChange]);
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
    const wrap1 = `.${specialBaseUnitCls}${validateAndGetSpecifier(specifier)} .${selBtype}:not(.no-${unitCls}) {`;
    const wrap2 =  '}';
    return cssValidator.validateAndCompileScss(newScss,
        input => `${wrap1}${input}${wrap2}`, currentlyCommitted, allowImports);
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
 * @param {RawBlock} blockCopy
 * @param {ThemeStyleUnit|null} unit
 * @param {String} cls = null
 * @returns {Boolean}
 */
function blockHasStyle(blockCopy, unit, cls = null) {
    if (!cls && unit) cls = createUnitClass(unit.id, blockCopy.type);
    if (!unit.origin) {
        return blockHasStyleClass(cls, blockCopy, false);
    } else {
        if (unit.origin !== SPECIAL_BASE_UNIT_NAME) throw new Error('Not supported.');
        return blockHasStyleClass(cls, blockCopy, true);
    }
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
 * @param {String} scss
 * @returns {String}
 */
function normalizeScss(scss) {
    return scss.endsWith(';') || scss.endsWith('}') ? scss : `${scss};`;
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

class StylesList extends preact.Component {
    // editableTitleInstances;
    // moreMenu;
    /**
     * @access protected
     */
    componentWillMount() {
        this.editableTitleInstances = [];
        this.moreMenu = preact.createRef();
    }
    /**
     * @access protected
     */
    receiveUnits(unitsEnabled) {
        this.editableTitleInstances = unitsEnabled.map(_ => preact.createRef());
    }
    /**
     * @param {Array<MenuLink>} moreLinks = []
     * @returns {Array<MenuLink>}
     * @access protected
     */
    createContextMenuLinks(moreLinks = []) {
        return [
            {text: __('Edit name'), title: __('Edit name'), id: 'edit-style-title'},
            ...moreLinks,
            {text: __('Delete'), title: __('Delete style'), id: 'delete-style'},
        ];
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
        if (id === 'delete-style') {
            const isCodeBased = this.state.units && !this.state.unitsEnabled;
            const arr = isCodeBased ? this.state.units : this.state.unitsEnabled;
            const unit = arr[this.liIdxOfOpenMoreMenu];
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
     * @access protected
     */
    // eslint-disable-next-line react/require-render-return
    render() {
        throw new Error('Abstract method not implemented.');
    }
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
    const bodyStyle = findBodyStyle(themeStyles);
    const lookFor = createUnitClass(unit1.id, blockTypeName);
    return bodyStyle.units.find(({id}) => id === lookFor) || unit1;
}

/**
 * @param {ThemeStyleUnit} unit
 * @param {RawBlock} block
 */
function removeStyleUnitMaybeRemote(unit, block) {
    const maybeRemote = findRealUnit(unit, block.type);
    if (maybeRemote === unit)
        removeStyleUnit(unit, null, block);
    else
        removeStyleUnit(unit, maybeRemote, null);
}

/**
 * @param {ThemeStyleUnit} unit
 * @param {ThemeStyleUnit|null} remote
 * @param {RawBlock|null} block
 */
function removeStyleUnit(unit, remote, block) {
    if (!remote) {
        // #2
        emitRemoveStyleClassFromBlock(createUnitClass(unit.id, block.type), block);

        // #1
        store2.dispatch('themeStyles/removeUnitFrom', [block.type, remote || unit]);

        const clone = {...unit};
        emitCommitStylesOp(block.type, () => {
            // #1
            store2.dispatch('themeStyles/addUnitTo', [block.type, clone]);
            // #2
            setTimeout(() => { api.saveButton.triggerUndo(); }, 100);

        }, null, null);
    } else {
        // #1 and #2 (both units (remote and its "shell") is removed from themeStyles store here)
        store2.dispatch('themeStyles/removeUnitFrom', [SPECIAL_BASE_UNIT_NAME, remote]);

        const clone = {...remote};
        emitCommitStylesOp(SPECIAL_BASE_UNIT_NAME, () => {
            // #1
            store2.dispatch('themeStyles/addUnitTo', [SPECIAL_BASE_UNIT_NAME, clone]);
            // #2
            store2.dispatch('themeStyles/addUnitTo', [clone.origin, unit]);
        }, unit, remote.origin);
    }
    /*const blockTypeName = !remote ? block.type : unit.origin;
    console.log('blockTypenm',blockTypeName);

    // #2
    const removedClasses = !remote;
    if (removedClasses)
        emitRemoveStyleClassFromBlock(createUnitClass(unit.id, block.type), block);

    store2.dispatch('themeStyles/removeUnitFrom', [blockTypeName, remote || unit]);

    const clone = {...(remote || unit)};
    emitCommitStylesOp(blockTypeName, () => {
        store2.dispatch('themeStyles/addUnitTo', [blockTypeName, clone]);

        if (remote) store2.dispatch('themeStyles/addUnitTo', [clone.origin, unit]);
        else setTimeout(() => { api.saveButton.triggerUndo(); }, 100);

    }, ...(!remote ? [null, null] : [remote, remote.origin])); // removedRemote = null, removedRemoteBlockTypeName
    */
}
//-            if (maybeRemote === unit)
//-                removeStyleUnit(this.props.blockCopy.type, unit);
//-            else
//-                removeStyleUnit(SPECIAL_BASE_UNIT_NAME, maybeRemote, unit);
// ...(!real ? [null, null] : [real, unit.origin])


/**
 * @param {String} styleClassToRemove
 * @param {RawBlock} b
 * @returns {String}
 */
function emitRemoveStyleClassFromBlock(styleClassToRemove, b) {
    const currentClasses = b.styleClasses;
    const newClasses = currentClasses.split(' ').filter(cls => cls !== styleClassToRemove).join(' ');
    dispatchNewBlockStyleClasses(newClasses, b);
    return newClasses;
}

export {SPECIAL_BASE_UNIT_NAME, StyleTextarea, EditableTitle, specialBaseUnitCls,
        getLargestPostfixNum, findBlockTypeStyles, findBodyStyle,
        findBodyStyleMainUnit, emitAddStyleClassToBlock, dispatchNewBlockStyleClasses,
        compileSpecial, updateAndEmitUnitScss, emitUnitChanges, emitCommitStylesOp,
        tempHack2, goToStyle, blockHasStyle, findParentStyleInfo, normalizeScss,
        tempHack, StylesList, findRealUnit};
