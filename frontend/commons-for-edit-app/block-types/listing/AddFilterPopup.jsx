import {env} from '@sivujetti-commons-for-web-pages';
import setFocusTo from '../../auto-focusers.js';
import {validationConstraints} from '../../constants.js';
import {__, api, events} from '../../edit-app-singletons.js';
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
     * @returns {string}
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
        const {filterInfo} = this.props;
        const relPageTypeName = findFieldInfo(filterInfo.propPath, this.props.getListPageTypeOwnProps()).dataType.rel;
        this.relPageType = api.getPageTypes().find(({name}) => name === relPageTypeName);
        this.setState(createState(filterInfo));
    }
    /**
     * @param {FilterPartProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.filterInfo.value !== this.props.filterInfo.value)
            this.setState(createState(props.filterInfo));
    }
    /**
     * @access protected
     */
    render(_, {theCat}) {
        return <div>
            <button
                onClick={ () => (setTimeout(() => this.popup.current.popperInstance.update(), 20), this.popup.current.open()) }
                class="form-select poppable pl-1"
                type="button">{ theCat ? this.getSelectedCatTitle(theCat) : '-' }
            </button>
            <PopupPrerendered ref={ this.popup }>
                <div class="select-list-scroller">
                    <ManyToManyItemSelector
                        curSelections={ [theCat] }
                        onSelectionsChanged={ selections => this.emitNewCat(selections[0]) }
                        relPageType={ this.relPageType }
                        onItemsFetched={ this.receivePagesList.bind(this) }
                        useRadios/>
                </div>
            </PopupPrerendered>
        </div>;
    }
    /**
     * @param {Array<RelPage>} manyToManyPages
     * @access private
     */
    receivePagesList(manyToManyPages) {
        const pageDoesntExistAnyMore = this.state.theCat && !manyToManyPages.some(({id}) => id === this.state.theCat);
        if (pageDoesntExistAnyMore)
            this.emitNewCat(null, null);
        //
        this.setState({curAllList: manyToManyPages});
    }
    /**
     * @param {string|null} pageId
     * @param {PopupPrerendered} openPopup = this.popup.current
     * @access private
     */
    emitNewCat(pageId, openPopup = this.popup.current) {
        this.props.onFilterValueChanged(`%${pageId || ''}%`, openPopup);
    }
    /**
     * @param {string} isInCategory
     * @returns {string}
     * @access private
     */
    getSelectedCatTitle(isInCategory) {
        return Array.isArray(this.state.curAllList)
            ? `"${this.state.curAllList.find(({id}) => id === isInCategory).title}"`
            : ''; // loading
    }
}

/**
 * @param {FilterInfo} filterInfo
 * @returns {Object}
 */
function createState({value}) {
    return {theCat: value
        ? value.slice(1, -1) // '%page-id%' -> 'page-id'
        : value
    };
}

/**
 * @param {string} colPath
 * @param {Array<PageTypeField>} fieldsInfo
 * @returns {PageTypeField|undefined}
 */
function findFieldInfo(colPath, fieldsInfo) {
    const col = colPath.split('.')[1];
    return fieldsInfo.find(({name}) => name === col);
}

class UrlStartsWithPart extends preact.Component {
    // popup;
    // inputEl;
    // throttledHandleValueChanged;
    /**
     * @param {'all'|'single'|'atMost'} howManyType
     * @returns {string}
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
        this.inputEl = preact.createRef();
        this.updateState(this.props.filterInfo.value);
    }
    /**
     * @param {FilterPartProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.filterInfo.value !== this.props.filterInfo.value)
            this.updateState(props.filterInfo.value);
    }
    /**
     * @access protected
     */
    render(_, {theVal, theValNotCommitted, validationError}) {
        return <div>
            <button
                onClick={ () => {
                    setTimeout(() => {
                        this.popup.current.popperInstance.update();
                        setFocusTo(this.inputEl);
                    }, 20);
                    this.popup.current.open();
                } }
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
                    style="width: auto;"
                    ref={ this.inputEl }/>
                <InputError errorMessage={ validationError }/>
            </PopupPrerendered>
        </div>;
    }
    /**
     * @param {string} filterValue
     * @access private
     */
    updateState(filterValue) {
        const theVal = filterValue
            ? filterValue.slice(0, -1) // '/slug%' -> '/slug'
            : filterValue;
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
            this.props.onFilterValueChanged(`${val.charAt(0) === '/' ? val : `/${val}`}%`, this.popup.current);
        else
            this.setState({theValNotCommitted: e.target.value, validationError: err});
    }
}

class AddFilterPopup extends preact.Component {
    /**
     * @param {{filtersCopy: AdditionalFilters; howManyTypeAdjusted: 'all'|'single'|'atMost'; showAddCategoryFilterButton: boolean; parent: ListingBlockEditForm;}} props
     * @access protected
     */
    render({filtersCopy, howManyTypeAdjusted, showAddCategoryFilterButton, parent}) {
        const a1 = __('and');
        return [
            <div class="py-1">{ filtersCopy.tokens.length ? a1 : '' }</div>,
            <div class="instructions-list d-grid">
                { showAddCategoryFilterButton ? <button
                    onClick={ () => { parent.onFiltersChanged(createFilters(filtersCopy, mut => insertFilterAt(FilterKind.IS_IN_CAT, mut)), 'added'); parent.closeCurrentPopup(); } }
                    class="group-2 poppable perhaps text-left"
                    type="button">
                    { IsInCategoryPart.getLabel(howManyTypeAdjusted) }
                </button> : null }
                <button
                    onClick={ () => { parent.onFiltersChanged(createFilters(filtersCopy, mut => insertFilterAt(FilterKind.URL_STARTS_WITH, mut)), 'added'); parent.closeCurrentPopup(); } }
                    class="group-2 poppable perhaps text-left"
                    type="button">
                    { UrlStartsWithPart.getLabel(howManyTypeAdjusted) }
                </button>
            </div>
        ];
    }
}

/**
 * @param {AdditionalFilters} from
 * @param {(filtersMut: AdditionalFilters) => any} mutator
 * @returns {AdditionalFilters}
 */
function createFilters(from, mutator) {
    const out = cloneFilters(from);
    mutator(out);
    return out;
}

/**
 * @param {number} at
 * @param {AdditionalFilters} filtersMut
 */
function deleteFilter(at, filtersMut) {
    const paramKey = filtersMut.tokens[at + 2];
    const and = filtersMut.tokens.length > 3 ? 1 : 0;
    filtersMut.tokens.splice(at - (at > 0 ? and : 0), 3 + and);
    delete filtersMut.paramMap[paramKey];
}

/**
 * @param {filterKind} kind
 * @param {AdditionalFilters} filtersMut
 */
function insertFilterAt(kind, filtersMut) {
    const keysCur = Object.keys(filtersMut.paramMap);
    const paramKey = `:b${getLargestIxd(keysCur) + 1}`;
    const cont = keysCur.length ? ['AND'] : [];
    if (kind === FilterKind.URL_STARTS_WITH) {
        filtersMut.tokens.push(...cont, 'p.slug', 'LIKE', paramKey);
        filtersMut.paramMap[paramKey] = `/%`; // dupe
    }
    if (kind === FilterKind.IS_IN_CAT) {
        filtersMut.tokens.push(...cont, 'p.categories', 'LIKE', paramKey);
        filtersMut.paramMap[paramKey] = `%%`; // dupe
    }
}

/**
 * @param {AdditionalFilters} filters
 * @returns {AdditionalFilters}
 */
function cloneFilters(filters) {
    return {tokens: [...filters.tokens], paramMap: {...filters.paramMap}};
}

/**
 * @param {Array<string} keys Example [':b0', ':b1']
 * @returns {number}
 */
function getLargestIxd(keys) {
    return keys.reduce((max, key) => {
        const asInt = parseInt(key.substring(2), 10);
        return asInt > max ? asInt : max;
    }, -1);
}

class PopupPrerendered extends preact.Component {
    // popperInstance;
    // unregistrables;
    /**
     * @param {{children: () => preact.ComponentChild; marginLeft?: string;}} props
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
                {name: 'eventListeners', enabled: true},
            ]},
        ));
        // Update its position
        setTimeout(() => {
            this.popperInstance.update();
        }, 1);
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
    componentDidMount() {
        const updatePopper = () => {
            if (this.state.isOpen && this.popperInstance)
                this.popperInstance.update();
        };
        this.unregistrables = [
            events.on('left-column-width-changed', updatePopper),
            events.on('inspector-panel-height-changed', updatePopper),
            (() => {
                const closeOnEsc = e => { if (this.state.isOpen && e.key === 'Escape') this.close(); };
                window.addEventListener('keydown', closeOnEsc);
                return () => { window.removeEventListener('keydown', closeOnEsc); };
            })(),
        ];
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
 * @typedef AdditionalFilters
 * @prop {Array<string>} tokens
 * @prop {{[key: string]: any}} paramMap
 *
 * @typedef FilterInfo
 * @prop {filterKind} kind
 * @prop {string|Array<string>} value
 * @prop {string} propPath
 * @prop {string} paramKey
 *
 * @typedef {'urlStartsWith'|'isInCategory'} filterKind
 *
 * @typedef FilterPartProps
 * @prop {FilterInfo} filterInfo
 * @prop {() => Array<PageTypeField>} getListPageTypeOwnProps
 * @prop {(newValue: string, openPopup: PopupPrerendered) => void} onFilterValueChanged
 * @prop {ListingBlockEditForm} parent
 */

export default AddFilterPopup;
export {
    cloneFilters,
    createFilters,
    deleteFilter,
    FilterKind,
    IsInCategoryPart,
    PopupPrerendered,
    UrlStartsWithPart,
};
