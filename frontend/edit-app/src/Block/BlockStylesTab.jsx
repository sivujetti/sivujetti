import {__, api, env, http, Icon, LoadingSpinner} from '@sivujetti-commons-for-edit-app';
import {stringUtils} from '../commons/utils.js';
import {fetchThemeStyles} from '../DefaultView/GlobalStylesSection.jsx';
import store2, {observeStore as observeStore2} from '../store2.js';
import store, {pushItemToOpQueue} from '../store.js';
import {triggerUndo} from '../SaveButton.jsx';
let compile, serialize, stringify;

class BlockStylesTab extends preact.Component {
    // handleCssInputChangedThrottled;
    // unregistrables;
    /**
     * @param {{emitAddStyleToBlock: (newStyleClass: String, block: RawBlock2) => void; getBlockCopy: () => RawBlock2; grabChanges: (withFn: (block: RawBlock2, origin: blockChangeEvent, isUndo: Boolean) => void) => void; userCanEditCss: Boolean; isVisible: Boolean;}} props
     */
    constructor(props) {
        super(props);
        ({compile, serialize, stringify} = window.stylis);
        this.state = {units: [], collapseds: [], blockCopy: props.getBlockCopy()};
        this.handleCssInputChangedThrottled = () => {};
        this.unregistrables = [observeStore2('themeStyles', ({themeStyles}) => {
            const {units} = (findBlockTypeStyles(themeStyles, this.state.blockCopy.type) || {});
            if (this.state.units !== units)
                this.updateUnitsState(units);
        }),
        ];
        props.grabChanges((block, _origin, _isUndo) => {
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
    render({userCanEditCss, isVisible}, {units, collapseds}) {
        if (!isVisible) return null;
        return [
            units !== null ? units.length ? <ul class="list styles-list mb-2">{ units.map((unit, i) => {
                const cls = this.createClass(unit.title);
                return <li class={ collapseds[i] }>
                    <header class="flex-centered p-relative">
                        <button
                            onClick={ () => this.toggleIsCollapsed(i) }
                            class="col-12 btn btn-link text-ellipsis with-icon pl-2 mr-1 no-color"
                            title={ userCanEditCss ? `.${cls}` : __('Use style') }
                            type="button">
                            <Icon iconId="chevron-down" className={ `size-xs${userCanEditCss ? '' : ' d-none'}` }/>
                            <span class="text-ellipsis">{ unit.title }</span>
                        </button>
                        <label class="form-checkbox p-absolute" title={ __('Use style') } style="right:-.28rem">
                            <input
                                onClick={ e => this.toggleStyleIsActivated(cls, e) }
                                checked={ this.state.blockCopy.styleClasses.indexOf(cls) > -1 }
                                value={ unit.title }
                                type="checkbox"/>
                            <i class="form-icon"></i>
                        </label>
                    </header>
                    { userCanEditCss
                    ? <div class="pb-2 pr-2">
                        <textarea
                            value={ 'todo' }
                            onInput={ this.handleCssInputChangedThrottled }
                            class={ `form-input code m-2` }
                            placeholder="color: green\n"></textarea>
                    </div>
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
     * @access private
     */
    updateUnitsState(candidate) {
        const units = candidate || [];
        this.setState({units, collapseds: createCollapseds(units)});
    }
    /**
     * @param {String} cls
     * @param {Event} e
     * @access private
     */
    toggleStyleIsActivated(cls, e) {
        const currentlyHas = this.currentBlockHasStyle(cls);
        if (e.checked && !currentlyHas) {
            //
        } else if (!e.checked && currentlyHas) {
            //
        }
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
        const url = `/api/themes/${api.getActiveTheme().id}/styles/scope-block-type/${type}`;
        store.dispatch(pushItemToOpQueue(`upsert-theme-style#${url}`, {
            doHandle: () => {
                const style = findBlockTypeStyles(store2.get().themeStyles, type);
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
            doUndo: () => {
                // Revert # 1
                if (current) store2.dispatch('themeStyles/removeUnitFrom', [type, newUnit]);
                else store2.dispatch('themeStyles/removeStyle', [type]);

                // Revert # 2
                if (addedStyleToBlock) setTimeout(() => { triggerUndo(); }, 100);
            },
            args: [],
        }));
    }
    /**
     * @param {String} cls
     * @returns {Boolean}
     * @access private
     */
    currentBlockHasStyle(cls) {
        return this.state.blockCopy.styleClasses.split(' ').indexOf(cls) > -1;
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
        if (!this.props.userCanEditCss) { this.toggleStyleIsActivated('?', '?'); return; }
        if (this.state.collapseds[rowIdx] !== ' open') // Hide all except $rowIdx
            this.setState({collapseds: createCollapseds(this.state.units, rowIdx)});
        else // Hide all
            this.setState({collapseds: createCollapseds(this.state.units, -1)});
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

export default BlockStylesTab;
