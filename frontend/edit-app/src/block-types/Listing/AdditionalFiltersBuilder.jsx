import {__, api, env, Icon, InputError, timingUtils, validationConstraints} from '@sivujetti-commons-for-edit-app';
import {ManyToManyItemSelector} from '../../left-column/page/ManyToManyField.jsx';

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
        const relPageTypeName = findFieldInfo(workableFilter.propPath, this.props.parentProps.getListPageTypeOwnProps()).dataType.rel;
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
                onClick={ () => this.popup.current.open() }
                class="form-select poppable pl-1"
                type="button">{ theCat.length ? this.getSelectedCatTitle(theCat) : '-' }
            </button>
            <Popup ref={ this.popup }>
                <ManyToManyItemSelector
                    curSelections={ [theCat] }
                    onSelectionsChanged={ newList => this.props.parentProps.onFiltersChanged(mergeToFilterAdditional(FilterKind.IS_IN_CAT, newList[0], this.props.parentProps.currentFiltersJson), 'updated') }
                    relPageType={ this.relPageType }
                    onItemsFetched={ manyToManyPages => { this.setState({curAllList: manyToManyPages}); } }
                    useRadios/>
            </Popup>
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
                onClick={ () => this.popup.current.open() }
                class="form-select poppable pl-1"
                type="button">&quot;{ theVal }&quot;
            </button>
            <Popup ref={ this.popup }>
                <input
                    onInput={ this.throttledHandleValueChanged }
                    value={ theValNotCommitted }
                    placeholder={ `/${__('blog')}/` }
                    class={ `form-input tight mt-1${!validationError ? '' : ' is-error'}` }
                    type="text"
                    style="width: auto;"/>
                <InputError errorMessage={ validationError }/>
            </Popup>
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
            this.props.parentProps.onFiltersChanged(mergeToFilterAdditional(FilterKind.URL_STARTS_WITH, val, this.props.parentProps.currentFiltersJson), 'updated');
        else
            this.setState({theValNotCommitted: e.target.value, validationError: err});
    }
}

class AdditionalFiltersBuilder extends preact.Component {
    // addFilterPopup;
    /**
     * @access protected
     */
    componentWillMount() {
        this.addFilterPopup = preact.createRef();
        this.updateFiltersParsedState(this.props.currentFiltersJson);
    }
    /**
     * @param {AdditionalFilterBuilderProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.currentFiltersJson !== this.props.currentFiltersJson)
            this.updateFiltersParsedState(props.currentFiltersJson);
    }
    /**
     * @access protected
     */
    render({onFiltersChanged, howManyType}, {filtersParsed}) {
        const a1 = __('and');
        const a2 = `${__(howManyType !== 'single' ? 'which#nominative' : 'which') }/${ __(howManyType !== 'single' ? 'whose' : 'which#genitive')}`;
        return [
            ...filtersParsed.map((filter, i) => {
                const Cls = filter.kind === FilterKind.URL_STARTS_WITH ? UrlStartsWithPart : IsInCategoryPart;
                return [
                    <span class="group-2 ml-1 pl-2 pr-1 no-round-right">{ // todo trigger next element when clicked
                        (i ? `${__('and')} ` : '') + Cls.getLabel(howManyType)
                    }</span>,
                    <div class="group-2 no-round-left pl-0" data-filter-part-kind={ filter.kind }>
                        <Cls workableFilter={ filter } parentProps={ this.props }/>
                        <button
                            onClick={ () => onFiltersChanged(mergeToFilterAdditional(filter.kind, null, this.props.currentFiltersJson), 'removed') }
                            class="btn btn-sm btn-link btn-icon flex-centered pl-0"
                            type="button"
                            title={ __('Delete filter') }
                            style="background: 0 0;"><Icon iconId="x" className="size-xs color-dimmed"/></button>
                    </div>
                ];
            }),
            <div class="group-2 perhaps ml-1">
                <button class="poppable" onClick={ () => this.addFilterPopup.current.open() } type="button" title={ __('Add filter') }>
                    { (filtersParsed.length ? `${a1} ` : '') + a2 } ... <Icon iconId="plus" className="size-xs float-right ml-1"/>
                </button>
                <Popup ref={ this.addFilterPopup }>
                    <div class="py-1">{ filtersParsed.length ? a1 : '' }</div>
                    <button
                        onClick={ () => { onFiltersChanged(mergeToFilterAdditional(FilterKind.IS_IN_CAT, '', this.props.currentFiltersJson), 'added'); this.addFilterPopup.current.close(); } }
                        class="group-2 poppable perhaps mb-1"
                        type="button">
                            { IsInCategoryPart.getLabel(howManyType) }
                    </button>
                    <div class="py-1">
                        <button
                            onClick={ () => { onFiltersChanged(mergeToFilterAdditional(FilterKind.URL_STARTS_WITH, '', this.props.currentFiltersJson), 'added'); this.addFilterPopup.current.close(); } }
                            class="group-2 poppable perhaps mb-1"
                            type="button">
                                { UrlStartsWithPart.getLabel(howManyType) }
                        </button>
                    </div>
                </Popup>
            </div>
        ];
    }
    /**
     * @param {String} currentFiltersJson
     * @access private
     */
    updateFiltersParsedState(currentFiltersJson) {
        this.setState({filtersParsed: buildWorkableFilters(currentFiltersJson)});
    }
}

/**
 * @param {String} filtersJson
 * @returns {Array<ParsedFilter>}
 */
function buildWorkableFilters(filtersJson) {
    const parsed = JSON.parse(filtersJson);
    const out = [];
    for (const propPath in parsed) {
        if (propPath === 'p.slug') {
            out.push({kind: FilterKind.URL_STARTS_WITH, value: parsed[propPath].$startsWith, propPath});
        } else if (propPath === 'p.categories') {
            out.push({kind: FilterKind.IS_IN_CAT, value: [parsed[propPath].$contains.slice(1, -1)], propPath});
        } else env.window.console.log('Not implemented yet.');
    }
    return out;
}

/**
 * @param {'isInCategory'|'urlStartsWith'} kind
 * @param {String|null} val
 * @param {String} current
 * @returns {String} Updated $current
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
    return JSON.stringify(parsed);
}

/**
 * @param {String} from
 * @returns {String} $from without the isInCategory filter
 */
function removeIsInCatFilter(from) {
    return mergeToFilterAdditional(FilterKind.IS_IN_CAT, null, from);
}

class Popup extends preact.Component {
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
        return <div ref={ this.createPopper.bind(this) } class={ `my-tooltip${!isOpen ? '' : ' visible'}` }>
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
 * @typedef AdditionalFilterBuilderProps
 * @prop {String} currentFiltersJson
 * @prop {(updatedFiltersJson: String, event: 'added'|'updated'|'removed') => void} onFiltersChanged
 * @prop {() => Array<PageTypeField>} getListPageTypeOwnProps
 * @prop {'all'|'single'|'atMost'} howManyType
 *
 * @typedef FilterPartProps
 * @prop {ParsedFilter} workableFilter
 * @prop {AdditionalFilterBuilderProps} parentProps
 */

export default AdditionalFiltersBuilder;
export {Popup, removeIsInCatFilter};
