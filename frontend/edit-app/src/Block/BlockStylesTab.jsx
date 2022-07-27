import {__, api, env, http, Icon, LoadingSpinner, InputError, FormGroup, hookForm,
        Input, InputErrors, hasErrors, unhookForm} from '@sivujetti-commons-for-edit-app';
import {timingUtils} from '../commons/utils.js';
import CssStylesValidatorHelper from '../commons/CssStylesValidatorHelper.js';
import {fetchThemeStyles} from '../DefaultView/GlobalStylesSection.jsx';
import store2, {observeStore as observeStore2} from '../store2.js';
import store, {pushItemToOpQueue} from '../store.js';
import {validationConstraints} from '../constants.js';
import {triggerUndo} from '../SaveButton.jsx';
import {Popup} from '../block-types/Listing/EditForm.jsx';

let compile, serialize, stringify;

class BlockStylesTab extends preact.Component {
    // editableTitleInstances;
    // unregistrables;
    /**
     * @param {{emitAddStyleToBlock: (styleClassToAdd: String, block: RawBlock2) => void; emitRemoveStyleFromBlock: (styleClassToRemove: String, block: RawBlock2) => void; getBlockCopy: () => RawBlock2; grabBlockChanges: (withFn: (block: RawBlock2, origin: blockChangeEvent, isUndo: Boolean) => void) => void; userCanEditCss: Boolean; isVisible: Boolean;}} props
     */
    constructor(props) {
        super(props);
        ({compile, serialize, stringify} = window.stylis);
        this.editableTitleInstances = [];
        this.state = {units: [], liClasses: [], blockCopy: props.getBlockCopy()};
        this.unregistrables = [observeStore2('themeStyles', ({themeStyles}) => {
            const {units} = (findBlockTypeStyles(themeStyles, this.state.blockCopy.type) || {});
            if (this.state.units !== units)
                this.updateUnitsState(units, this.state.liClasses.length ? this.state.liClasses.findIndex(s => s !== '') : 0);
        }),
        ];
        props.grabBlockChanges((block, _origin, _isUndo) => {
            if (this.state.blockCopy.styleClasses !== block.styleClasses)
                this.setState({blockCopy: block});
        });
    }
    /**
     * @access protected
     */
    componentWillReceiveProps({isVisible}) {
        if (isVisible && !this.props.isVisible) {
            const {themeStyles} = store2.get();
            if (themeStyles)
                this.updateUnitsState((findBlockTypeStyles(themeStyles, this.state.blockCopy.type) || {}).units);
            else {
                this.setState({themeStyles: null});
                fetchThemeStyles().then(({styles}) =>
                    store2.dispatch('themeStyles/setAll', [styles])
                );
            }
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
    render({userCanEditCss, isVisible}, {units, blockCopy, liClasses}) {
        if (!isVisible) return null;
        const emitSaveStylesToBackendOp = userCanEditCss ? this.emitCommitStylesOp.bind(this) : null;
        const sub = units && units.length ? units.length - 1 : null;
        return [
            units !== null ? units.length ? <ul class="list styles-list mb-2">{ liClasses.map((liCls, i) => {
                const revi = sub - i;
                const unit = units[revi];
                const cls = this.createClass(unit.id);
                const isActivated = this.currentBlockHasStyle(cls);
                const handleLiClick = userCanEditCss ? e => {
                    if (this.editableTitleInstances[i].current.isOpen()) return;
                    const editNameEl = e.target.classList.contains('edit-icon-outer') ? e.target : e.target.closest('.edit-icon-outer');
                    if (!editNameEl) this.toggleIsCollapsed(i);
                    else this.editableTitleInstances[i].current.open();
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
            }) }</ul> : null : <LoadingSpinner className="ml-1 mb-2 pb-2"/>
        ].concat(userCanEditCss ? [
            <button
                onClick={ this.addStyleUnit.bind(this) }
                class="btn btn-sm"
                type="button">{ __('Add styles') }</button>
        ] : []);
    }
    /**
     * @param {Array<ThemeStyleUnit>|undefined} candidate
     * @param {Number|undefined} currentOpenIdx = undefined
     * @access private
     */
    updateUnitsState(candidate, currentOpenIdx = undefined) {
        const units = candidate || [];
        this.editableTitleInstances = units.map(_ => preact.createRef());
        this.setState({units, liClasses: createLiClasses(units, currentOpenIdx)});
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
        const title = current ? `Unit-${rolling}` : 'Default';
        const id = `unit-${rolling}`;
        const scss = 'color: green';
        const cls = this.createClass(id);

        // #2
        const addedStyleToBlock = !this.currentBlockHasStyle(cls);
        if (addedStyleToBlock)
            this.props.emitAddStyleToBlock(cls, this.state.blockCopy);

        // #1
        const newUnit = {title, id, scss, generatedCss: this.compileStylis(cls, scss)};
        if (current) store2.dispatch('themeStyles/addUnitTo', [type, newUnit]);
        else store2.dispatch('themeStyles/addStyle', [{units: [newUnit], blockTypeName: type}]);

        //
        this.emitCommitStylesOp(type, () => {
            // Revert # 1
            if (current) store2.dispatch('themeStyles/removeUnitFrom', [type, newUnit]);
            else store2.dispatch('themeStyles/removeStyle', [type]);

            // Revert # 2
            if (addedStyleToBlock) setTimeout(() => { triggerUndo(); }, 100);
        });
    }
    /**
     * @param {String} blockTypeName
     * @param {() => void} doUndo
     * @access private
     */
    emitCommitStylesOp(blockTypeName, doUndo) {
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
     * @param {String} cls
     * @returns {Boolean}
     * @access private
     */
    currentBlockHasStyle(cls) {
        return this.state.blockCopy.styleClasses.indexOf(cls) > -1;
    }
    /**
     * @param {String} cls
     * @param {String} scss
     * @returns {String}
     * @access private
     */
    compileStylis(cls, scss) {
        return serialize(compile(`.${cls}{${scss}}`), stringify);
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
     * @param {Number} rowIdx
     * @access private
     */
    toggleIsCollapsed(rowIdx) {
        if (this.state.liClasses[rowIdx] !== ' open') // Hide all except $rowIdx
            this.setState({liClasses: createLiClasses(this.state.units, rowIdx)});
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
        return this.state.popupIsOpen;
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
            <Icon iconId="pencil" className={ `size-xs color-dimmed${userCanEditCss ? '' : ' d-none'}` }/>
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
        // Prevent @BlockStyleTab.render()'s handleLiClick from triggering
        setTimeout(() => {
            this.setState({popupIsOpen: false, values: null, errors: null});
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
    render(_, {scssNotCommitted, error}) {
        return <div class="pb-2 pr-2">
            <textarea
                value={ scssNotCommitted }
                onInput={ this.handleCssInputChangedThrottled }
                class={ `form-input code m-2` }
                placeholder="color: green\n"></textarea>
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
        const {blockTypeName, emitSaveStylesToBackendOp} = this.props;
        store2.dispatch('themeStyles/updateUnitOf', [blockTypeName, id,
            {scss: e.target.value,
             generatedCss: result.generatedCss || ''}]);
        emitSaveStylesToBackendOp(blockTypeName, () => {
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
 * @param {Number} openIdx = 0
 * @returns {Array<String>}
 */
function createLiClasses(units, openIdx = 0) {
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
 * @typedef StyleTextareaProps
 * @prop {ThemeStyleUnit} unitCopy
 * @prop {emitSaveStylesToBackendOpFn} emitSaveStylesToBackendOp
 * @prop {String} unitCls
 * @prop {String} blockTypeName
 * @prop {Boolean} isVisible
 *
 * @typedef {(blockTypeName: String, doUndo: () => void) => void} emitSaveStylesToBackendOpFn
 */

export default BlockStylesTab;
