import {__, env, http, api, Icon, InputError} from '@sivujetti-commons-for-edit-app';

const orderToText = {
    desc: 'newest to oldest',
    asc: 'oldest to newest',
    rand: 'randomly',
};

class ListingBlockEditForm extends preact.Component {
    // defineLimitPopup;
    // definePageTypePopup;
    // defineOtherFiltersPopup;
    // defineOrderPopup;
    // chooseRendererPopup;
    // pageTypeBundles;
    // selectedPageTypeBundle;
    // selectedPageTypeFriendlyName;
    // selectedPageTypeFriendlyNamePlural;
    // selectedPageTypeFriendlyNamePartitive;
    /**
     * @param {BlockEditFormProps} props
     */
    constructor(props) {
        super(props);
        this.defineLimitPopup = preact.createRef();
        this.definePageTypePopup = preact.createRef();
        this.defineOtherFiltersPopup = preact.createRef();
        this.defineOrderPopup = preact.createRef();
        this.chooseRendererPopup = preact.createRef();
    }
    /**
     * @param {RawBlockData} snapshot
     * @access public
     */
    overrideValues(snapshot) {
        this.setSelectedPageTypeBundle(snapshot.filterPageType);
        this.applyState(createState(snapshot));
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const r = api.getBlockRenderers();
        this.pageTypeBundles = api.getPageTypes()
            .map(pageType => ({pageType, renderers: r.filter(({associatedWith}) =>
                associatedWith === '*' || associatedWith === pageType.name)}))
            .filter(({renderers}) => renderers.length > 0);
        this.setSelectedPageTypeBundle(this.props.block.filterPageType);
        //
        this.setState(createState(this.props.block));
    }
    /**
     * @access protected
     */
    render(_, {filterPageType, howManyType, howManyAmount, howManyAmountNotCommitted,
               howManyAmountError, order, renderWith}) {
        if (!filterPageType) return;
        /*
               1      2          3                                    4                                    5
        --------------------------------------------------------------------------------------------------------------------------------
        Listaa Yksi   sivu       jonka slugi alkaa kirjaimilla 'foo-' -                                    tulostaen ne templaatilla foo
        Listaa Kaikki artikkelit -                                    järjestäen ne satunnaisesti          tulostaen ne templaatilla foo
        Listaa Kaikki sivut      kategoriasta bar                     -                                    tulostaen ne templaatilla foo
        Listaa 50     sivua                                           järjestäen ne vanhimmasta uusimpaan  tulostaen ne templaatilla foo
        */
        return <div><div class="mb-2">Ohjeet:</div>
        <div class="listing-instructions d-flex">
            <span>{ __('List') }</span>

            <div class="group-2 ml-1">
                <button
                    onClick={ () => this.openPartPopup('defineLimit') }
                    class="form-select"
                    type="button">{ howManyType !== 'custom' ? __(howManyType) : `${__('at most') } ${howManyAmount}` }
                </button>
                <Popup ref={ this.defineLimitPopup }>
                    <label class="form-radio">
                        <input
                            onClick={ this.handleHowManyTypeChanged.bind(this) }
                            type="radio"
                            name="gender"
                            value="all"
                            checked={ howManyType === 'all' }/><i class="form-icon"></i> { __('all') }
                    </label>
                    <label class="form-radio">
                        <input
                            onClick={ this.handleHowManyTypeChanged.bind(this) }
                            type="radio"
                            name="gender"
                            value="single"
                            checked={ howManyType === 'single' }/><i class="form-icon"></i> { __('single') }
                    </label>
                    <label class="form-radio">
                        <input
                            onClick={ this.handleHowManyTypeChanged.bind(this) }
                            type="radio"
                            name="gender"
                            value="custom"
                            checked={ howManyType === 'custom' }/><i class="form-icon"></i> { __('at most') } <input
                                onInput={ this.handleHowManyAmountChanged.bind(this) }
                                value={ howManyAmountNotCommitted }
                                placeholder={ __('Type amount') }
                                inputMode="numeric"
                                class={ `form-input py-0${!howManyAmountError ? '' : ' is-error'}` }
                                type="text"/>
                        <InputError errorMessage={ howManyAmountError }/>
                    </label>
                </Popup>
            </div>

            <div class="group-1 ml-1">
                <button
                    onClick={ () => this.openPartPopup('definePageType') }
                    class="form-select"
                    type="button">{
                    howManyType !== 'single'
                        ? howManyType !== 'custom'
                            ? this.selectedPageTypeFriendlyNamePlural
                            : this.selectedPageTypeFriendlyNamePartitive
                        : this.selectedPageTypeFriendlyName
                }</button>
                <Popup ref={ this.definePageTypePopup }>{
                    this.pageTypeBundles.length > 1 ? this.pageTypeBundles.map(({pageType}) =>
                        <label class="form-radio" key={ pageType.name }>
                            <input
                                onClick={ this.handlePageTypeChanged.bind(this) }
                                type="radio"
                                name="filterPageType"
                                value={ pageType.name }
                                checked={ filterPageType === pageType.name }/><i class="form-icon"></i> { __(howManyType !== 'single'
                                    ? `${pageType.friendlyNamePlural}${howManyType !== 'custom' ? '' : '#partitive'}`
                                    : pageType.friendlyName
                                ).toLowerCase() }
                        </label>
                    ) : <span>Sivustollasi on vain yksi sivutyyppi <br/>(joten voit valita vain { this.selectedPageTypeFriendlyNamePlural })</span>
                }</Popup>
            </div>

            <div class="group-2 perhaps ml-1">
                <button
                    onClick={ () => this.openPartPopup('defineOtherFilters') }
                    class="form-select"
                    type="button">{ howManyType !== 'single' ? 'joiden' : 'jonka' } ...
                </button>
                <Popup ref={ this.defineOtherFiltersPopup }>
                    <div>Todo, tässä voisi olla esim.</div>
                    <ul class="mt-0 mb-1 ml-1" style="line-height: 1.2rem;">
                        <li class="my-0">- kategoriasta Foo</li>
                        <li class="my-0">- joiden slug alkaa kirjaimilla &apos;yläsivu/&apos;</li>
                    </ul>
                </Popup>
            </div>

            { howManyType !== 'single' && (howManyAmount === 0 || howManyAmount > 1) ? [
            <span class="group-3 ml-1 px-2"> { __('ordered by') } </span>,
            <div class="group-3">
                <button
                    onClick={ () => this.openPartPopup('defineOrder') }
                    class="form-select"
                    type="button">{ __(orderToText[order]) }
                </button>
                <Popup ref={ this.defineOrderPopup }>{ Object.keys(orderToText).map(key =>
                    <label class="form-radio" key={ key }>
                        <input
                            onClick={ e => this.handleFilterPropMaybeChanged('filterOrder', 'order', e) }
                            type="radio"
                            name="order"
                            value={ key }
                            checked={ order === key }/><i class="form-icon"></i> { __(orderToText[key]) }
                    </label>
                ) }</Popup>
            </div>
            ] : null
            }

            { this.selectedPageTypeBundle.renderers.length > 1 ? [
            <span class="group-4 ml-1 px-2">{ __('rendering %s using template', __(howManyType !== 'single' ? 'them' : 'it')) }</span>,
            <div class="group-4">
                <button
                    onClick={ () => this.openPartPopup('chooseRenderer') }
                    class="form-select"
                    type="button">{ __(this.selectedPageTypeBundle.renderers.find(({fileId}) =>
                        fileId === renderWith
                    ).friendlyName || renderWith) }
                </button>
                <Popup ref={ this.chooseRendererPopup }>{ this.selectedPageTypeBundle.renderers.map(({fileId, friendlyName}) =>
                    <label class="form-radio" key={ fileId }>
                        <input
                            onClick={ e => this.handleFilterPropMaybeChanged('renderWith', 'renderWith', e) }
                            type="radio"
                            name="renderWith"
                            value={ fileId }
                            checked={ renderWith === fileId }/><i class="form-icon"></i> { friendlyName ? __(friendlyName) : fileId }
                    </label>
                ) }</Popup>
            </div>] : null
            }
        </div>
        <div class="pt-1">
            <hr/>
            <a
                onClick={ this.openAddPageView.bind(this) }
                class="d-inline-block mt-2">
                { __('Add new %s', ' ') }
                <span class="group-1">{ this.selectedPageTypeFriendlyName }</span>
            </a>
        </div>
        </div>;
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleHowManyTypeChanged(e) {
        const newValue = e.target.value;
        if (this.state.howManyType !== newValue) {
            const newState = {howManyType: newValue};
            const newLimit = newValue === 'single' ? 1 : 0;
            if (newValue !== 'custom') newState.howManyAmountNotCommitted = newLimit > 1 ? newLimit : null;
            this.props.onValueChanged(newLimit, 'filterLimit', false, 'debounce-none');
            this.setState(newState);
        }
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleHowManyAmountChanged(e) {
        const val = parseInt(e.target.value, 10);
        const newState = {howManyAmountNotCommitted: e.target.value,
                          howManyAmountError: !isNaN(val) ? '' : __('%s must be a number', __('This value'))};
        if (!newState.howManyAmountError && newState.howManyAmountNotCommitted > 10000) {
            newState.howManyAmountError = __('max').replace('{field}', __('This value')).replace('{arg0}', '10 000');
        }
        if (!newState.howManyAmountError) {
            newState.howManyAmount = val;
            this.props.onValueChanged(val, 'filterLimit', false, 'debounce-none');
        }
        this.setState(newState);
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleFilterPropMaybeChanged(propName, stateKey, e) {
        const newValue = e.target.value;
        if (this.state.order !== newValue) {
            this.props.onValueChanged(newValue, propName, false, 'debounce-none');
            this.applyState({[stateKey]: newValue});
        }
    }
    /**
     * @param {Event} e
     * @access private
     */
    handlePageTypeChanged(e) {
        const newSelectedPageTypeName = e.target.value;
        this.setSelectedPageTypeBundle(newSelectedPageTypeName);
        const partialState = {
            filterPageType: newSelectedPageTypeName,
            renderWith: this.pageTypeBundles.find(({pageType}) => pageType.name === newSelectedPageTypeName).renderers[0].fileId,
        };
        this.applyState(partialState);
        this.props.onManyValuesChanged(partialState, false, env.normalTypingDebounceMillis);
    }
    /**
     * @param {'defineLimit'|'definePageType'|'defineOtherFilters'|'defineOrder'|'chooseRenderer'} popupName
     * @access private
     */
    openPartPopup(popupName) {
        this[`${popupName}Popup`].current.open();
    }
    /**
     * @param {Event} e
     * @access private
     */
    openAddPageView(e) {
        e.preventDefault();
        const typeName = this.state.filterPageType;
        api.webPageIframe.openPlaceholderPage(typeName, this.selectedPageTypeBundle.pageType.defaultLayoutId);
    }
    /**
     * @param {String} selectedPageTypeName
     * @access private
     */
    setSelectedPageTypeBundle(selectedPageTypeName) {
        this.selectedPageTypeBundle = this.pageTypeBundles.find(({pageType}) => pageType.name === selectedPageTypeName);
        this.selectedPageTypeFriendlyName = __(this.selectedPageTypeBundle.pageType.friendlyName).toLowerCase();
        this.selectedPageTypeFriendlyNamePlural = __(this.selectedPageTypeBundle.pageType.friendlyNamePlural).toLowerCase();
        this.selectedPageTypeFriendlyNamePartitive = __(`${this.selectedPageTypeBundle.pageType.friendlyNamePlural}#partitive`).toLowerCase();
    }
    /**
     * @access private
     */
    applyState(newState) {
        if (newState.renderWith)
            // Note: mutates BlockTrees.currentWebPage.data.page
            this.props.block.renderer = newState.renderWith;
        this.setState(newState);
    }
}

/**
 * @param {Block|Snapshot} from
 * @returns {Object}
 */
function createState(from) {
    let howManyType = null;
    if (!from.filterLimit) howManyType = 'all';
    else if (from.filterLimit > 1) howManyType = 'custom';
    else howManyType = 'single';
    //
    return {
        filterPageType: from.filterPageType,
        howManyType,
        howManyAmount: from.filterLimit,
        howManyAmountNotCommitted: from.filterLimit > 1 ? from.filterLimit : null,
        howManyAmountError: '',
        renderWith: from.renderer || from.renderWith,
        order: from.filterOrder,
    };
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
       this.popperInstance.update();
    }
    /**
     * @access protected
     */
    render({children}, {isOpen}) {
        return <div ref={ this.createPopper.bind(this) } class={ `my-tooltip${!isOpen ? '' : ' visible'}` }>
            { children }
            <div class="popper-arrow" data-popper-arrow></div>
            <button onClick={ this.close.bind(this) } class="btn btn-link btn-sm p-1 p-absolute" title={ __('Close') } style="right:0;top:0" type="button">
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
    }
    /**
     * @access private
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
}

export default () => {
    const initialData = {
        filterPageType: 'Pages',
        filterLimit: 0,
        filterOrder: 'desc',
        filterAdditional: '[]',
        renderWith: 'sivujetti:block-listing-pages-default', // Only exists in frontend, mirrored to block.renderer
    };
    return {
        name: 'Listing',
        friendlyName: 'Listing',
        ownPropNames: Object.keys(initialData).filter(k => k !== 'renderWith'),
        initialData,
        defaultRenderer: initialData.renderWith,
        icon: 'layout-list',
        reRender(block, _) {
            return http.post('/api/blocks/render', {block: block.toRaw()}).then(resp => resp.result);
        },
        createSnapshot: from => ({
            filterPageType: from.filterPageType,
            filterLimit: from.filterLimit,
            filterOrder: from.filterOrder,
            filterAdditional: from.filterAdditional,
            renderWith: from.renderWith,
        }),
        editForm: ListingBlockEditForm,
    };
};

/**
 * @typedef Snapshot
 * @prop {String} filterPageType e.g. "Services"
 * @prop {Number} filterLimit e.g. 0, 20
 * @prop {'desc'|'asc'|'rand'} filterOrder
 * @prop {String} filterAdditional e.g. "[]"
 * @prop {String} renderWith e.g. "site:block-services-listing"
 */
