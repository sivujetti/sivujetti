import {env} from '@sivujetti-commons-for-web-pages';
import {validationConstraints,} from '../../constants.js';
import {__, api, signals} from '../../edit-app-singletons.js';
import {InputError} from '../../Form.jsx';
import {Icon} from '../../Icon.jsx';
import {timingUtils} from '../../utils.js';
import {ManyToManyItemSelector} from '../page-info/ManyToManyField.jsx';

const FilterKind = {
    IS_IN_CAT: 'isInCategory',
    URL_STARTS_WITH: 'urlStartsWith',
};

class IsInCategoryPart extends preact.Component {
    // popup;
    // relPageType;
    /**
     * @param {'all'|'single'|'atMost'} howManyType
     * @returns {String}
     * @access public
     */
    static getLabel(howManyType) {
        return `${__(howManyType !== 'single' ? 'which are' : 'which is')} ${__('added to category')}`;
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.popup = preact.createRef();
        const {workableFilter} = this.props;
        const relPageTypeName = findFieldInfo(workableFilter.propPath, this.props.getListPageTypeOwnProps()).dataType.rel;
        this.relPageType = api.getPageTypes().find(({name}) => name === relPageTypeName);
        this.updateState(workableFilter);
    }
    /**
     * @param {FilterPartProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.workableFilter.value[0] !== this.props.workableFilter.value[0])
            this.updateState(props.workableFilter);
    }
    /**
     * @access protected
     */
    render(_, {theCat}) {
        return <div>
            <button
                onClick={ () => (setTimeout(() => this.popup.current.popperInstance.update(), 20), this.popup.current.open()) }
                class="form-select poppable pl-1"
                type="button">{ theCat.length ? this.getSelectedCatTitle(theCat) : '-' }
            </button>
            <PopupPrerendered ref={ this.popup }>
                <div class="select-list-scroller">
                    <ManyToManyItemSelector
                        curSelections={ [theCat] }
                        onSelectionsChanged={ newList => this.props.parent.onFiltersChanged(mergeToFilterAdditional(FilterKind.IS_IN_CAT, newList[0], this.props.currentFiltersJson), 'updated', this.popup.current) }
                        relPageType={ this.relPageType }
                        onItemsFetched={ manyToManyPages => { this.setState({curAllList: manyToManyPages}); } }
                        useRadios/>
                </div>
            </PopupPrerendered>
        </div>;
    }
    /**
     * @param {ParsedFilter} workableFilter
     * @access private
     */
    updateState({value}) {
        this.setState({theCat: value[0]});
    }
    /**
     * @param {String} isInCategory
     * @returns {String}
     * @access private
     */
    getSelectedCatTitle(isInCategory) {
        return Array.isArray(this.state.curAllList)
            ? `"${this.state.curAllList.find(({id}) => id === isInCategory).title}"`
            : ''; // loading
    }
}

/**
 * @param {String} colPath
 * @param {Array<PageTypeField>} fieldsInfo
 * @returns {PageTypeField|undefined}
 */
function findFieldInfo(colPath, fieldsInfo) {
    const col = colPath.split('.')[1];
    return fieldsInfo.find(({name}) => name === col);
}

class UrlStartsWithPart extends preact.Component {
    // popup;
    // throttledHandleValueChanged;
    /**
     * @param {'all'|'single'|'atMost'} howManyType
     * @returns {String}
     * @access public
     */
    static getLabel(howManyType) {
        return __('%s %s starts with', __(howManyType !== 'single' ? 'whose' : 'which#genitive'), __('Url (slug)').toLowerCase());
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.popup = preact.createRef();
        this.updateState(this.props.workableFilter.value);
    }
    /**
     * @param {FilterPartProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.workableFilter.value !== this.props.workableFilter.value)
            this.updateState(props.workableFilter.value);
    }
    /**
     * @access protected
     */
    render(_, {theVal, theValNotCommitted, validationError}) {
        return <div>
            <button
                onClick={ () => (setTimeout(() => this.popup.current.popperInstance.update(), 20), this.popup.current.open()) }
                class="form-select poppable pl-1"
                type="button">&quot;{ theVal }&quot;
            </button>
            <PopupPrerendered ref={ this.popup }>
                <input
                    onInput={ this.throttledHandleValueChanged }
                    value={ theValNotCommitted }
                    placeholder={ `/${__('blog')}/` }
                    class={ `form-input tight mt-1${!validationError ? '' : ' is-error'}` }
                    type="text"
                    style="width: auto;"/>
                <InputError errorMessage={ validationError }/>
            </PopupPrerendered>
        </div>;
    }
    /**
     * @param {String} filterValue
     * @access private
     */
    updateState(filterValue) {
        const theVal = filterValue || '/';
        this.throttledHandleValueChanged = timingUtils.debounce(this.handleValueChanged.bind(this),
            env.normalTypingDebounceMillis);
        this.setState({theVal, theValNotCommitted: theVal, validationError: ''});
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleValueChanged(e) {
        const val = e.target.value.trim();
        const isValid = str => str.length <= 92;
        let err = isValid(val) ? '' : __('maxLength').replace('{field}', __('This value')).replace('{arg0}', '92');
        if (!err && !(new RegExp(validationConstraints.SLUG_REGEXP)).test(val)) {
            err = __('regexp').replace('{field}', __('This value'));
        }
        if (!err)
            this.props.parent.onFiltersChanged(mergeToFilterAdditional(FilterKind.URL_STARTS_WITH, val, this.props.currentFiltersJson), 'updated', this.popup.current);
        else
            this.setState({theValNotCommitted: e.target.value, validationError: err});
    }
}

class AddFilterPopup extends preact.Component {
    /**
     * @param {{filtersParsed: Array<Object>; howManyTypeAdjusted: 'all'|'single'|'atMost'; currentFiltersJson: String; parent: ListingBlockEditForm;}} props
     * @access protected
     */
    render({filtersParsed, howManyTypeAdjusted, currentFiltersJson, parent}) {
        const a1 = __('and');
        return [
            <div class="py-1">{ filtersParsed.length ? a1 : '' }</div>,
            <div class="instructions-list d-grid">
                <button
                    onClick={ () => { parent.onFiltersChanged(mergeToFilterAdditional(FilterKind.IS_IN_CAT, '', currentFiltersJson), 'added'); parent.closeCurrentPopup(); } }
                    class="group-2 poppable perhaps text-left"
                    type="button">
                    { IsInCategoryPart.getLabel(howManyTypeAdjusted) }
                </button>
                <button
                    onClick={ () => { parent.onFiltersChanged(mergeToFilterAdditional(FilterKind.URL_STARTS_WITH, '', currentFiltersJson), 'added'); parent.closeCurrentPopup(); } }
                    class="group-2 poppable perhaps text-left"
                    type="button">
                    { UrlStartsWithPart.getLabel(howManyTypeAdjusted) }
                </button>
            </div>
        ];
    }
}

/**
 * @param {Object} filters
 * @returns {Array<ParsedFilter>}
 */
function buildWorkableFilters(filters) {
    const out = [];
    for (const propPath in filters) {
        if (propPath === 'p.slug') {
            out.push({kind: FilterKind.URL_STARTS_WITH, value: filters[propPath].$startsWith, propPath});
        } else if (propPath === 'p.categories') {
            out.push({kind: FilterKind.IS_IN_CAT, value: [filters[propPath].$contains.slice(1, -1)], propPath});
        } else env.window.console.log('Not implemented yet.');
    }
    return out;
}

/**
 * @param {'isInCategory'|'urlStartsWith'} kind
 * @param {String|null} val
 * @param {String} current
 * @returns {Object} Updated $current
 */
function mergeToFilterAdditional(kind, val, current) {
    const parsed = JSON.parse(current);
    if (kind === FilterKind.URL_STARTS_WITH) {
        if (val !== null)
            parsed['p.slug'] = {$startsWith: val.charAt(0) === '/' ? val : `/${val}`};
        else
            delete parsed['p.slug'];
    } else if (kind === FilterKind.IS_IN_CAT) {
        if (val !== null)
            parsed['p.categories'] = {$contains: val.length ? `"${val}"` : ''};
        else
            delete parsed['p.categories'];
    } else
        throw new Error(`Unkown additional filter \`${kind}\``);
    return parsed;
}

/**
 * @param {String} from
 * @returns {Object} $from without the isInCategory filter
 */
function removeIsInCatFilter(from) {
    return mergeToFilterAdditional(FilterKind.IS_IN_CAT, null, from);
}

class PopupPrerendered extends preact.Component {
    // popperInstance;
    /**
     * @param {{children: () => preact.ComponentChild; marginLeft?: String;}} props
     */
    constructor(props) {
        super(props);
        this.state = {isOpen: false};
    }
    /**
     * @access public
     */
    open() {
        if (this.state.isOpen) return;
        // Make the tooltip visible
        this.setState({isOpen: true});
        // Enable the event listeners
        this.popperInstance.setOptions((options) => Object.assign({},
            options,
            {modifiers: [
                ...options.modifiers,
                { name: 'eventListeners', enabled: true },
            ]},
        ));
        // Update its position
        setTimeout(() => {
            this.popperInstance.update();
        }, 1);
        const updatePopper = () => {
            if (this.state.isOpen && this.popperInstance)
                this.popperInstance.update();
        };
        this.unregistrables = [
            signals.on('left-column-width-changed', updatePopper),
            signals.on('inspector-panel-height-changed', updatePopper)
        ];
    }
    /**
     * @access public
     */
    close() {
        // Hide the tooltip
        this.setState({isOpen: false});
        // Disable the event listeners
        this.popperInstance.setOptions((options) => Object.assign({},
            options,
            {modifiers: [
                ...options.modifiers,
                { name: 'eventListeners', enabled: false },
            ]}
        ));
    }
    /**
     * @access protected
     */
    render({children}, {isOpen}) {
        return <div ref={ this.createPopper.bind(this) } class={ `my-tooltip tooltip-prerendered${!isOpen ? '' : ' visible'}` }>
            { children }
            <div class="popper-arrow" data-popper-arrow></div>
            <button
                onClick={ this.close.bind(this) }
                class="btn btn-link btn-sm p-1 p-absolute"
                title={ __('Close') }
                style="right:0;top:0;background:0 0"
                type="button">
                <Icon iconId="x" className="size-xs"/>
            </button>
        </div>;
    }
    /**
     * @param {HTMLDivElement} el
     * @access private
     */
    createPopper(el) {
        if (!el || this.popperInstance) return;
        //
        this.popperInstance = 'loading';
        setTimeout(() => {
            const button = el.previousElementSibling;
            const content = el;
            this.popperInstance = window.Popper.createPopper(button, content, {
                modifiers: [{
                    name: 'offset',
                    options: {offset: [0, 8]},
                }, {
                    name: 'preventOverflow',
                    options: {altAxis: true, padding: 20},
                }],
            });
        }, 200);
    }
}

/**
 * @typedef ParsedFilter
 * @prop {'urlStartsWith'|'isInCategory'} kind
 * @prop {String|Array<String>} value
 * @prop {String} propPath
 *
 * @typedef FilterPartProps
 * @prop {ParsedFilter} workableFilter
 * @prop {() => Array<PageTypeField>} getListPageTypeOwnProps
 * @prop {String} currentFiltersJson
 */

export default AddFilterPopup;
export {
    buildWorkableFilters,
    FilterKind,
    IsInCategoryPart,
    mergeToFilterAdditional,
    PopupPrerendered,
    removeIsInCatFilter,
    UrlStartsWithPart,
};
