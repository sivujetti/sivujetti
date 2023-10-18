import {__, api, env, http, signals, Icon, hookForm,
        unhookForm, Input, FormGroup, InputErrors, hasErrors,
        validationConstraints} from '@sivujetti-commons-for-edit-app';
import {PopupPrerendered} from '../../block-types/listing/AddFilterPopup.jsx';
import store2 from '../../store2.js';
import {getIsStoredToTreeIdFrom} from '../../block/utils-utils.js';
import blockTreeUtils from './blockTreeUtils.js';
import StyleTextarea, {findBaseUnitOf, optimizeScss, emitUnitChanges, emitCommitStylesOp,
        updateAndEmitUnitScss, compileSpecial, tempHack2, createUnitClass,
        createUnitClassSpecial, SPECIAL_BASE_UNIT_NAME, specialBaseUnitCls} from './StylesTextarea.jsx';
import {isBodyRemote} from './style-utils.js';

class EditableTitle extends preact.Component {
    // popup;
    /**
     * @param {{unitId: String; unitIdReal: String|null; currentTitle: String; blockTypeName: String; allowEditing: Boolean; subtitle: String|null; subtitleMarginLeft?: Number;}} props
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
    render({currentTitle, allowEditing, subtitle}, {popupIsOpen, values}) {
        return [
            <span class="text-ellipsis">
                { values ? values.title : currentTitle }
                { subtitle
                    ? <i style={ `font-size: .5rem; left: ${parseFloat(this.props.subtitleMarginLeft || 1.7)}rem; bottom: -6px;` } class="p-absolute color-dimmed3">
                        { subtitle }
                    </i>
                    : null
                }
            </span>,
            allowEditing ? <PopupPrerendered ref={ this.popup }>{ popupIsOpen
                ? <form onSubmit={ this.applyNewTitleAndClose.bind(this) } class="text-left pb-1">
                    <FormGroup>
                        <label htmlFor="styleTitle" class="form-label pt-1">{ __('Style name') }</label>
                        <Input vm={ this } prop="title" id="styleTitle"/>
                        <InputErrors vm={ this } prop="title"/>
                    </FormGroup>
                    <button class="btn btn-sm px-2" type="submit" disabled={ hasErrors(this) }>Ok</button>
                    <button onClick={ this.discardNewTitleAndClose.bind(this) } class="btn btn-sm btn-link ml-1" type="button">{ __('Cancel') }</button>
                </form>
                : null
            }
            </PopupPrerendered> : null,
            <span class="pl-2 pt-1 edit-icon-outer">
            <Icon iconId="dots" className={ `size-xs color-dimmed${allowEditing ? '' : ' d-none'}` }/>
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
 * @param {RawBlock} block
 * @returns {String}
 */
function emitAddStyleClassToBlock(styleClassToAdd, block) {
    const currentClasses = block.styleClasses;
    const [a1, b] = splitUnitAndNonUnitClasses(currentClasses);
    const a = a1 ? `${a1} ${styleClassToAdd}` : styleClassToAdd;
    const newClasses = `${a}${a && b ? ' ' : ''}${b}`;
    dispatchNewBlockStyleClasses(newClasses, block);
    return newClasses;
}

/**
 * @param {RawBlock|BlockStub} block Example 'j-Button-d-7 foo'
 * @param {String} clsFrom Example 'j-Button-d-7'
 * @param {String} clsTo Example 'j-Button-d-23'
 * @returns {String} Example 'j-Button-d-23 foo'
 */
function emitReplaceClassesFromBlock(block, clsFrom, clsTo) {
    const currentClasses = block.styleClasses;
    const newClasses = withoutTrailingSpace(currentClasses.replace(clsFrom, clsTo));
    dispatchNewBlockStyleClasses(newClasses, block);
    return newClasses;
}

/**
 * @param {String} cls Example 'j-Section j-Section-unit-15 j-Section-d-16 '
 * @returns {String} Example 'j-Section j-Section-unit-15 j-Section-d-16'
 */
function withoutTrailingSpace(cls) {
    const pcs = cls ? cls.split(' ') : [];
    return pcs.at(-1) === '' && isUnitClass(pcs.at(-2)) ? pcs.slice(0, -1).join(' ') : cls;
}

/**
 * @param {String} styleClasses
 * @returns {[String, String]} [unitClasses, nonUnitClasses]
 */
function splitUnitAndNonUnitClasses(styleClasses) {
    const all = styleClasses.split(' ');
    return all
        .reduce((arrs, cls, i) => {
            arrs[isUnitClass(cls) ? 0 : 1].push(all[i]);
            return arrs;
        }, [[], []])
        .map(clsList => clsList.join(' '));
}

/**
 * @param {String} cls Example 'j-Section-unit-15' or 'j-Section-d-16'
 * @returns {Boolean}
 */
function isUnitClass(cls) {
    const pcs = cls.split('-');
    return pcs.length === 4 && pcs[0] === 'j';
}

/**
 * @param {String} styleClassToRemove
 * @param {RawBlock} block
 * @returns {String}
 */
function emitRemoveStyleClassFromBlock(styleClassToRemove, block) {
    const currentClasses = block.styleClasses;
    const newClasses = currentClasses.split(' ').filter(cls => cls !== styleClassToRemove).join(' ');
    dispatchNewBlockStyleClasses(newClasses, block);
    return newClasses;
}

/**
 * @param {String} newStyleClasses
 * @param {RawBlock|BlockStub} blockCopy
 * @access private
 */
function dispatchNewBlockStyleClasses(newStyleClasses, blockCopy) {
    const changes = {styleClasses: newStyleClasses};
    const isOnlyStyleClassesChange = true;
    const {id, styleClasses} = blockCopy;
    const prevData = styleClasses;
    const isStoredToTreeId = getIsStoredToTreeIdFrom(id, 'mainTree');
    store2.dispatch('theBlockTree/updateDefPropsOf', [id, isStoredToTreeId, changes, isOnlyStyleClassesChange, prevData]);
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
 * @param {RawBlock|BlockStub} block
 * @param {ThemeStyleUnit} unit
 * @returns {Boolean}
 */
function ir1(block, unit) {
    if (!unit.isDerivable) {
        return blockHasStyle(block, unit);
    } else {
        return false;
    }
}

/**
 * @param {RawBlock|BlockStub} blockCopy
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
 * @param {RawBlock|BlockStub} block
 * @param {Boolean} isRemote = false
 * @returns {Boolean}
 */
function blockHasStyleClass(cls, {styleClasses}, isRemote = false) {
    return !isRemote
        ? styleClasses.split(' ').indexOf(cls) > -1
        : styleClasses.split(' ').indexOf(`no-${cls}`) > -1;
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
    receiveUnits(units) {
        this.editableTitleInstances = units.map(_ => preact.createRef());
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
     * @access protected
     */
    // eslint-disable-next-line react/require-render-return
    render() {
        throw new Error('Abstract method not implemented.');
    }
    /**
     * @returns {[ThemeStyleUnit, Array<ThemeStyleUnit>, Boolean]}
     * @access private
     */
    getOpenUnit() {
        const isCodeBased = this.state.units && !this.state.unitsToShow;
        const arr = isCodeBased ? this.state.units : this.state.unitsToShow;
        return [arr[this.liIdxOfOpenMoreMenu], arr, isCodeBased];
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
 * @param {RawBlock} block
 */
function removeStyleClassMaybeRemote(unit, block) {
    if (unit.derivedFrom && !isBodyRemote(unit.derivedFrom)) {
        const a = createUnitClass(unit.derivedFrom, block.type); // Example 'j-Section-unit-3'
        const b = createUnitClass(unit.id, block.type);          // Example 'j-Section-d-4'
        return emitReplaceClassesFromBlock(block, `${a} ${b}`, '');
    }
    const maybeRemote = findRealUnit(unit, block.type);
    const to = false;
    const from = true;
    return toggleStyleIsActivated(createUnitClass(unit.id, block.type),
                                    to, from, maybeRemote !== unit, block);
}

/**
 * @param {String} cls
 * @param {Boolean} newIsActivated
 * @param {Boolean} currentIsActivated
 * @param {Boolean} isRemote
 * @param {RawBlock} blockCopy
 * @returns {String}
 */
function toggleStyleIsActivated(cls, newIsActivated, currentIsActivated, isRemote, blockCopy) {
    if (!isRemote) {
        if (newIsActivated && !currentIsActivated)
            return emitAddStyleClassToBlock(cls, blockCopy);
        if (!newIsActivated && currentIsActivated)
            return emitRemoveStyleClassFromBlock(cls, blockCopy);
    } else { // invert
        // Example: 'no-j-Section-unit-1'
        const no = `no-${cls}`;
        const hasNo = blockHasStyle(blockCopy, null, no);
        if (!newIsActivated && !hasNo)
            return emitAddStyleClassToBlock(no, blockCopy);
        if (newIsActivated && hasNo)
            return emitRemoveStyleClassFromBlock(no, blockCopy);
    }
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
}

/**
 * @param {Array<ThemeStyleUnit>} unitsOfThisBlockType
 * @param {Array<ThemeStyleUnit>} bodyStyleUnits
 * @param {BlockStub|RawBlock} block
 * @returns {Array<ThemeStyleUnit>}
 */
function getEnabledUnits(unitsOfThisBlockType, bodyStyleUnits, block) {
    const out = [];
    for (const unit of unitsOfThisBlockType) {
        if (unit.origin !== SPECIAL_BASE_UNIT_NAME) {
            if (ir1(block, unit))
                out.push(unit);
        } else {
            const remote = getRemoteBodyUnit(unit, block.type, bodyStyleUnits, false);
            if (remote && !blockHasStyleClass(`no-${createUnitClass(unit.id, block.type)}`, block, true)) out.push(remote);
        }
    }
    return out;
}

/**
 * @param {ThemeStyleUnit} unit
 * @param {String} blockTypeName
 * @param {Array<ThemeStyleUnit>} bodyStyleUnits
 * @param {Boolean} copy = false
 * @returns {ThemeStyleUnit|null}
 */
function getRemoteBodyUnit(unit, blockTypeName, bodyStyleUnits, copy = true) {
    const lookFor = createUnitClass(unit.id, blockTypeName);
    const out = bodyStyleUnits.find(u => u.id === lookFor);
    return out ? copy ? {...out} : out : null;
}

export {StyleTextarea, SPECIAL_BASE_UNIT_NAME, EditableTitle, specialBaseUnitCls,
        getLargestPostfixNum, findBlockTypeStyles, findBodyStyle, findBodyStyleMainUnit,
        //
        createUnitClass, createUnitClassSpecial,
        emitAddStyleClassToBlock, emitReplaceClassesFromBlock, splitUnitAndNonUnitClasses, dispatchNewBlockStyleClasses,
        //
        compileSpecial, updateAndEmitUnitScss, emitUnitChanges, emitCommitStylesOp,
        tempHack2, goToStyle, blockHasStyle, findParentStyleInfo, normalizeScss,
        tempHack, StylesList, findRealUnit, optimizeScss, findBaseUnitOf,
        getEnabledUnits, getRemoteBodyUnit};
