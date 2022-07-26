import {__, api, env, http, Icon, LoadingSpinner, InputError} from '@sivujetti-commons-for-edit-app';
import {stringUtils, timingUtils} from '../commons/utils.js';
import CssStylesValidatorHelper from '../commons/CssStylesValidatorHelper.js';
import {fetchThemeStyles} from '../DefaultView/GlobalStylesSection.jsx';
import store2, {observeStore as observeStore2} from '../store2.js';
import store, {pushItemToOpQueue} from '../store.js';
import {triggerUndo} from '../SaveButton.jsx';
let compile, serialize, stringify;

class BlockStylesTab extends preact.Component {
    // unregistrables;
    /**
     * @param {{emitAddStyleToBlock: (styleClassToAdd: String, block: RawBlock2) => void; emitRemoveStyleFromBlock: (styleClassToRemove: String, block: RawBlock2) => void; getBlockCopy: () => RawBlock2; grabBlockChanges: (withFn: (block: RawBlock2, origin: blockChangeEvent, isUndo: Boolean) => void) => void; userCanEditCss: Boolean; isVisible: Boolean;}} props
     */
    constructor(props) {
        super(props);
        ({compile, serialize, stringify} = window.stylis);
        this.state = {units: [], collapseds: [], blockCopy: props.getBlockCopy()};
        this.unregistrables = [observeStore2('themeStyles', ({themeStyles}) => {
            const {units} = (findBlockTypeStyles(themeStyles, this.state.blockCopy.type) || {});
            if (this.state.units !== units)
                this.updateUnitsState(units, this.state.collapseds.length ? this.state.collapseds.findIndex(s => s !== '') : 0);
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
    render({userCanEditCss, isVisible}, {units, blockCopy, collapseds}) {
        if (!isVisible) return null;
        return [
            units !== null ? units.length ? <ul class="list styles-list mb-2">{ units.map((unit, i) => {
                const cls = this.createClass(unit.title);
                const isActivated = this.currentBlockHasStyle(cls);
                const handleLiClick = userCanEditCss ? () => this.toggleIsCollapsed(i) : () => this.toggleStyleIsActivated(cls, !isActivated);
                return <li class={ collapseds[i] } key={ unit.title }>
                    <header class="flex-centered init-relative">
                        <button
                            onClick={ handleLiClick }
                            class="col-12 btn btn-link text-ellipsis with-icon pl-2 mr-1 no-color"
                            title={ userCanEditCss ? `.${cls}` : __('Use style') }
                            type="button">
                            <Icon iconId="chevron-down" className={ `size-xs${userCanEditCss ? '' : ' d-none'}` }/>
                            <span class="text-ellipsis">{ unit.title }</span>
                        </button>
                        <label class="form-checkbox init-absolute" title={ __('Use style') } style="right:-.28rem">
                            <input
                                onClick={ e => this.toggleStyleIsActivated(cls, e.target.checked) }
                                checked={ isActivated }
                                value={ unit.title }
                                type="checkbox"/>
                            <i class="form-icon"></i>
                        </label>
                    </header>
                    { userCanEditCss
                    ? <StyleTextarea
                        unitCopy={ Object.assign({}, unit) }
                        emitSaveStylesToBackendOp={ this.emitCommitStylesOp.bind(this) }
                        unitCls={ cls }
                        blockTypeName={ blockCopy.type }
                        isVisible={ collapseds[i] !== '' }/>
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
        this.setState({units, collapseds: createCollapseds(units, currentOpenIdx)});
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
        const title = createTitle('Special', current ? current.units : []);
        const scss = 'color: green';
        const cls = this.createClass(title);

        // #2
        const addedStyleToBlock = !this.currentBlockHasStyle(cls);
        if (addedStyleToBlock)
            this.props.emitAddStyleToBlock(cls, this.state.blockCopy);

        // #1
        const newUnit = {title, scss, generatedCss: this.compileStylis(cls, scss)};
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
     * @param {String} title
     * @returns {String}
     * @access private
     */
    createClass(title) {
        return `j-${this.state.blockCopy.type}-${stringUtils.slugify(title)}`;
    }
    /**
     * @param {Number} rowIdx
     * @access private
     */
    toggleIsCollapsed(rowIdx) {
        if (this.state.collapseds[rowIdx] !== ' open') // Hide all except $rowIdx
            this.setState({collapseds: createCollapseds(this.state.units, rowIdx)});
        else // Hide all
            this.setState({collapseds: createCollapseds(this.state.units, -1)});
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
        const {title, generatedCss, scss} = this.props.unitCopy;
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
        store2.dispatch('themeStyles/updateUnitOf', [blockTypeName, title,
            {scss: e.target.value.trim(),
             generatedCss: result.generatedCss || ''}]);
        emitSaveStylesToBackendOp(blockTypeName, () => {
            store2.dispatch('themeStyles/updateUnitOf', [blockTypeName, title,
            dataBefore]);
        });
    }
}

/**
 * @param {String} candidate
 * @param {Array<{title: String; [key: String]: any;}} notThese
 * @returns {String}
 */
function createTitle(candidate, notThese) {
    if (!notThese.length) return 'Default';
    const similar = notThese.filter(({title}) => title === candidate || title.startsWith(`${candidate} new`));
    if (!similar.length) return candidate;
    const longest = similar.reduce((out, {title}) => title.length > out.length ? title : out, similar[0].title);
    return `${longest} new`;
}

/**
 * @param {Array<ThemeStyleUnit>} units
 * @param {Number} openIdx = 0
 * @returns {Array<String>}
 */
function createCollapseds(units, openIdx = 0) {
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
 * @prop {(blockTypeName: String, doUndo: () => void) => void} emitSaveStylesToBackendOp
 * @prop {String} unitCls
 * @prop {String} blockTypeName
 * @prop {Boolean} isVisible
 */

export default BlockStylesTab;
