import {__, Icon, LoadingSpinner} from '@sivujetti-commons-for-edit-app';
import {stringUtils} from '../commons/utils.js';
import {fetchThemeStyles} from '../DefaultView/GlobalStylesSection.jsx';
import store, {observeStore} from '../store2.js';
let compile, serialize, stringify;

class BlockStylesTab extends preact.Component {
    // blockCopy;
    // handleCssInputChangedThrottled;
    /**
     * @param {{getBlockCopy: () => RawBlock2; userCanEditCss: Boolean; isVisible: Boolean;}} props
     */
    constructor(props) {
        super(props);
        ({compile, serialize, stringify} = window.stylis);
        this.state = {units: [], collapseds: []};
        this.blockCopy = props.getBlockCopy();
        this.handleCssInputChangedThrottled = () => {};
        observeStore('themeStyles', ({themeStyles}) => {
            const {units} = this.getCurrentBlockTypeStyles(themeStyles);
            if (this.state.units !== units)
                this.setState({units, collapseds: createCollapseds(units)});
        });
    }
    /**
     * @access protected
     */
    componentWillReceiveProps({isVisible}) {
        if (isVisible && !this.props.isVisible) {
            const {themeStyles} = store.get();
            if (themeStyles) {
                this.setState({units: this.getCurrentBlockTypeStyles(themeStyles).units});
            } else {
                this.setState({themeStyles: null});
                fetchThemeStyles().then(({styles}) =>
                    store.dispatch('themeStyles/setAll', [styles])
                );
            }
        }
    }
    /**
     * @access protected
     */
    render({userCanEditCss}, {units, collapseds}) {
        return [
            units !== null ? units.length ? <ul class="list styles-list mb-2">{ units.map((unit, i) =>
                <li class={ collapseds[i] }>
                    <header class="flex-centered p-relative">
                        <button
                            onClick={ this.setAsNotCollapsed.bind(this) }
                            class="col-12 btn btn-link text-ellipsis with-icon pl-2 mr-1 no-color"
                            data-row-idx={ i }
                            type="button">
                            <Icon iconId="chevron-down" className={ `size-xs${userCanEditCss ? '' : ' d-none'}` }/>
                            <span class="text-ellipsis">{ unit.title }</span>
                        </button>
                        <label class="form-checkbox p-absolute" title={ __('Use style') } style="right:-.28rem">
                            <input
                                onClick={ this.toggleStyleIsActivated.bind(this) }
                                checked={ this.blockCopy.styleClasses.indexOf(this.createClass(unit.title)) > -1 }
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
                </li>
            ) }</ul> : null : <LoadingSpinner className="ml-1 mb-2 pb-2"/>
        ].concat(userCanEditCss ? [
            <button
                onClick={ this.addStyleUnit.bind(this) }
                class="btn btn-sm"
                type="button">{ __('Add styles') }</button>
        ] : []);
    }
    /**
     * @param {Event} e
     * @access private
     */
    toggleStyleIsActivated(e) {
        e;
    }
    /**
     * @access private
     */
    addStyleUnit() {
        const current = this.getCurrentBlockTypeStyles(store.get().themeStyles);
        const title = createTitle('Specialized', current ? current.units : []);
        const scss = 'color: green';
        const newUnit = {title, scss, generatedCss: this.compileStylis(title, scss)};
        if (current)
            store.dispatch('themeStyles/addUnitTo', [this.blockCopy.type, newUnit]);
        else
            store.dispatch('themeStyles/addStyle', [{units: [newUnit], blockTypeName: this.blockCopy.type}]);
    }
    /**
     * @param {String} title
     * @param {String} scss
     * @returns {String}
     * @access private
     */
    compileStylis(title, scss) {
        const sel = this.createClass(title);
        return serialize(compile(`.${sel}{${scss}}`), stringify);
    }
    /**
     * @param {String} title
     * @returns {String}
     * @access private
     */
    createClass(title) {
        return `j-${this.blockCopy.type}-${stringUtils.slugify(title)}`;
    }
    /**
     * @param {Array<ThemeStyle>} from
     * @returns {ThemeStyle|undefined}
     * @access private
     */
    getCurrentBlockTypeStyles(from) {
        const {type} = this.blockCopy;
        return from.find(({blockTypeName}) => blockTypeName === type);
    }
    /**
     * @param {Event} e
     * @access private
     */
    setAsNotCollapsed(e) {
        if (!this.props.userCanEditCss) { e.target.nextElementSibling.click(); return; }
        this.setState({collapseds: createCollapseds(this.state.units, parseInt(e.target.getAttribute('data-row-idx')))});
    }
}

/**
 * @param {String} candidate
 * @param {Array<{title: String; [key: String]: any;}} notThese
 * @returns {String}
 */
function createTitle(candidate, notThese) {
    return !notThese.length || !notThese.some(({title}) => title === candidate) ? candidate : `${candidate} new`;
}

/**
 * @param {Array<ThemeStyleUnit>} units
 * @param {Number} openIdx = 0
 * @returns {Array<String>}
 */
function createCollapseds(units, openIdx = 0) {
    return units.map((_, i) => i !== openIdx ? '' : ' open');
}

export default BlockStylesTab;
