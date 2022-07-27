import {__, env, api, Icon, InputError} from '@sivujetti-commons-for-edit-app';
import {validationConstraints} from '../../constants.js';

const orderToText = {
    desc: 'newest to oldest',
    asc: 'oldest to newest',
    rand: 'randomly',
};

class ListingBlockEditForm extends preact.Component {
    // defineLimitPopup;
    // definePageTypePopup;
    // defineUrlStartsWithPopup;
    // defineOrderPopup;
    // chooseRendererPopup;
    // pageTypeBundles;
    // selectedPageTypeBundle;
    // selectedPageTypeFriendlyName;
    // selectedPageTypeFriendlyNamePlural;
    // selectedPageTypeFriendlyNamePartitive;
    /**
     * @param {BlockEditFormProps|BlockEditFormProps2} props
     */
    constructor(props) {
        super(props);
        this.defineLimitPopup = preact.createRef();
        this.definePageTypePopup = preact.createRef();
        this.defineUrlStartsWithPopup = preact.createRef();
        this.addAdditionalFilterPopup = preact.createRef();
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
        const block = !window.useReduxBlockTree // @featureFlagConditionUseReduxBlockTree
            ? this.props.block
            : this.props.getBlockCopy();
        this.setSelectedPageTypeBundle(block.filterPageType);
        //
        this.setState(createState(block));
        if (window.useReduxBlockTree) { // @featureFlagConditionUseReduxBlockTree
        this.props.grabChanges((block, _origin, _isUndo) => {
            //
            if (this.state.filterPageType !== block.filterPageType) {
                this.setSelectedPageTypeBundle(block.filterPageType);
                this.setState({filterPageType: block.filterPageType});
            //
            } else if (this.state.howManyType !== block.filterLimitType ||
                       this.state.howManyAmount !== block.filterLimit) {
                this.setState({howManyType: block.filterLimitType,
                               howManyAmount: block.filterLimit,
                               howManyAmountNotCommitted: block.filterLimitType !== 'atMost' ? null : block.filterLimit,
                               howManyAmountError: ''});
            //
            } else if (this.state.order !== block.filterOrder) {
                this.setState({order: block.filterOrder});
            //
            } else if (this.state.renderWith !== block.renderer) {
                this.setState({renderWith: block.renderer});
            //
            } else {
                const [urlStartsWith] = getFilterParts(block.filterAdditional);
                if (this.state.urlStartsWith !== urlStartsWith)
                    this.setState({urlStartsWith,
                                   urlStartsWithNotCommitted: urlStartsWith,
                                   urlStartsWithError: ''});
            }
        });
        }
    }
    /**
     * @access protected
     */
    render(_, {filterPageType, howManyType, howManyAmount, howManyAmountNotCommitted,
               howManyAmountError, urlStartsWith, urlStartsWithNotCommitted, urlStartsWithError,
               order, renderWith}) {
        if (!filterPageType) return;
        /*
               1       2          3*                              4                             5
        --------------------------------------------------------------------------------------------------------------------
        List   single  page       which slug starts with '/foo-'  -                             rendering it using foo
        List   all     articles   -                               ordered by randomly           rendering them using foo
        List   all     pages      with category bar               -                             rendering them using foo
        List   50      pages                                      ordered by oldest to newest   rendering them using foo
        */
        return <div><div class="mb-2">Ohjeet:</div>
        <div class="listing-instructions d-flex">
            <span>{ __('List') }</span>

            <div class="group-2 ml-1">
                <button
                    onClick={ () => this.openPartPopup('defineLimit') }
                    class="form-select poppable"
                    type="button">{ howManyType !== 'atMost' ? __(howManyType) : `${__('at most') } ${howManyAmount}` }
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
                            value="atMost"
                            checked={ howManyType === 'atMost' }/><i class="form-icon"></i> { __('at most') } <input
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
                    class="form-select poppable"
                    type="button">{
                    howManyType !== 'single'
                        ? howManyType !== 'atMost'
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
                                    ? `${pageType.friendlyNamePlural}${howManyType !== 'atMost' ? '' : '#partitive'}`
                                    : pageType.friendlyName
                                ).toLowerCase() }
                        </label>
                    ) : <span>Sivustollasi on vain yksi sivutyyppi <br/>(joten voit valita vain { this.selectedPageTypeFriendlyNamePlural })</span>
                }</Popup>
            </div>

            { urlStartsWith !== null ? [
            <span class="group-2 ml-1 pl-2 pr-1 no-round-right"> { __('%s %s starts with', __(howManyType !== 'single' ? 'whose' : 'which'), __('Url (slug)').toLowerCase()) } </span>,
            <div class="group-2 no-round-left pl-0" data-filter-part-kind="urlStartsWith">
                <div>
                <button
                    onClick={ () => this.openPartPopup('defineUrlStartsWith') }
                    class="form-select poppable pl-1"
                    type="button">&quot;{ urlStartsWith }&quot;
                </button>
                <Popup ref={ this.defineUrlStartsWithPopup }>
                    <input
                        onInput={ this.handleStartsWithFilterValueChanged.bind(this) }
                        value={ urlStartsWithNotCommitted }
                        placeholder={ `/${__('blog')}/` }
                        class={ `form-input tight mt-1${!urlStartsWithError ? '' : ' is-error'}` }
                        type="text"
                        style="width: auto;"/>
                    <InputError errorMessage={ urlStartsWithError }/>
                </Popup>
                </div>
                <button
                    onClick={ () => this.handleStartsWithFilterAddedOrRemoved(null) }
                    class="btn btn-sm btn-link btn-icon flex-centered pl-0"
                    type="button"
                    style="background: 0 0;"><Icon iconId="x" className="size-xs color-dimmed"/></button>
            </div>
            ] : null }

            { urlStartsWith === null ? [
            <div class="group-2 perhaps ml-1">
                <button
                    onClick={ () => this.openPartPopup('addAdditionalFilter') }
                    class="poppable"
                    type="button">{ urlStartsWith === null ? '' : `${__('and')} ` }{ __(howManyType !== 'single' ? 'whose' : 'which') } ... <Icon iconId="plus" className="size-xs float-right ml-1"/>
                </button>
                <Popup ref={ this.addAdditionalFilterPopup }>
                    <div>Lisää suodatin:</div>
                    <div class="py-1">
                    <button
                        onClick={ () => { this.handleStartsWithFilterAddedOrRemoved(); this.addAdditionalFilterPopup.current.close(); } }
                        class="group-2 poppable mb-1"
                        type="button">
                            { __('%s %s starts with', __('which'), __('Url (slug)').toLowerCase()) }
                        </button>
                    </div>
                </Popup>
            </div>
            ] : null }

            { howManyType !== 'single' && (howManyAmount === 0 || howManyAmount > 1) ? [
            <span class="group-3 ml-1 px-2 no-round-right"> { __('ordered by') } </span>,
            <div class="group-3 no-round-left">
                <button
                    onClick={ () => this.openPartPopup('defineOrder') }
                    class="form-select poppable"
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
            <span class="group-4 ml-1 px-2 no-round-right">{ __('rendering %s using template', __(howManyType !== 'single' ? 'them' : 'it')) }</span>,
            <div class="group-4 no-round-left">
                <button
                    onClick={ () => this.openPartPopup('chooseRenderer') }
                    class="form-select poppable"
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
        if (!window.useReduxBlockTree) { // @featureFlagConditionUseReduxBlockTree
        if (this.state.howManyType !== newValue) {
            const newState = {howManyType: newValue};
            const newLimit = newValue === 'single' ? 1 : 0;
            if (newValue !== 'atMost') newState.howManyAmountNotCommitted = newLimit > 1 ? newLimit : null;
            this.props.onValueChanged(newLimit, 'filterLimit', false, 0, 'debounce-none');
            this.setState(newState);
        }
        } else {
        const newData = {filterLimitType: newValue,
            filterLimit: newValue === 'all' ? 0 : newValue === 'single' ? 1 : 3};
        this.props.emitManyValuesChanged(newData, false, 0, 'debounce-none');
        }
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleHowManyAmountChanged(e) {
        const val = parseInt(e.target.value, 10);
        if (!window.useReduxBlockTree) { // @featureFlagConditionUseReduxBlockTree
        const newState = {howManyAmountNotCommitted: e.target.value,
                          howManyAmountError: !isNaN(val) ? '' : __('%s must be a number', __('This value'))};
        if (!newState.howManyAmountError && newState.howManyAmountNotCommitted > 10000) {
            newState.howManyAmountError = __('max').replace('{field}', __('This value')).replace('{arg0}', '10 000');
        }
        if (!newState.howManyAmountError) {
            newState.howManyAmount = val;
            this.props.onValueChanged(val, 'filterLimit', false, 0, 'debounce-none');
        }
        this.setState(newState);
        } else {
        let err = !isNaN(val) ? '' : __('%s must be a number', __('This value'));
        if (!err && e.target.value > 10000) {
            err = __('max').replace('{field}', __('This value')).replace('{arg0}', '10 000');
        }
        if (!err) this.props.emitValueChanged(val, 'filterLimit', false, 0, 'debounce-none');
        else this.setState({howManyAmountNotCommitted: e.target.value, howManyAmountError: err});
        }
    }
    /**
     * @param {'filterOrder'|'renderWith'} propName
     * @param {'order'|'renderWith'} stateKey
     * @param {Event} e
     * @access private
     */
    handleFilterPropMaybeChanged(propName, stateKey, e) {
        const newValue = e.target.value;
        if (!window.useReduxBlockTree) { // @featureFlagConditionUseReduxBlockTree
        if (this.state[stateKey] !== newValue) {
            this.applyState({[stateKey]: newValue});
            this.props.onValueChanged(newValue, propName, false, 0, 'debounce-none');
        }
        } else {
        if (propName === 'renderWith') propName = 'renderer';
        this.props.emitValueChanged(newValue, propName, false, 0, 'debounce-none');
        }
    }
    /**
     * @param {Event} e
     * @access private
     */
    handlePageTypeChanged(e) {
        if (!window.useReduxBlockTree) { // @featureFlagConditionUseReduxBlockTree
        const newSelectedPageTypeName = e.target.value;
        this.setSelectedPageTypeBundle(newSelectedPageTypeName);
        const partialState = {
            filterPageType: newSelectedPageTypeName,
            renderWith: this.pageTypeBundles.find(({pageType}) => pageType.name === newSelectedPageTypeName).renderers[0].fileId,
        };
        this.applyState(partialState);
        this.props.onManyValuesChanged(partialState, false, env.normalTypingDebounceMillis);
        } else {
        const newSelectedPageTypeName = e.target.value;
        this.setSelectedPageTypeBundle(newSelectedPageTypeName);
        const newData = {filterPageType: newSelectedPageTypeName,
            renderer: this.pageTypeBundles.find(({pageType}) => pageType.name === newSelectedPageTypeName).renderers[0].fileId};
        this.props.emitManyValuesChanged(newData, false, env.normalTypingDebounceMillis);
        }
    }
    /**
     * @param {String} v = ''
     * @access private
     */
    handleStartsWithFilterAddedOrRemoved(v = '') {
        if (!window.useReduxBlockTree) { // @featureFlagConditionUseReduxBlockTree
        const newState = {urlStartsWith: v,
                          urlStartsWithNotCommitted: v,
                          urlStartsWithError: ''};
        const updated = mergeToFilterAdditional('urlStartsWith', newState.urlStartsWith, this.props.block.filterAdditional);
        this.props.onValueChanged(updated, 'filterAdditional', false, 0);
        this.setState(newState);
        } else {
        const updated = mergeToFilterAdditional('urlStartsWith', v, this.props.getBlockCopy().filterAdditional);
        this.props.emitValueChanged(updated, 'filterAdditional', false, 0);
        }
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleStartsWithFilterValueChanged(e) {
        const val = e.target.value.trim();
        const isValid = str => str.length <= 92;
        if (!window.useReduxBlockTree) { // @featureFlagConditionUseReduxBlockTree
        const newState = {urlStartsWithNotCommitted: e.target.value,
                          urlStartsWithError: isValid(val) ? '' : __('maxLength').replace('{field}', __('This value')).replace('{arg0}', '92')};
        if (!newState.urlStartsWithError && !(new RegExp(validationConstraints.SLUG_REGEXP)).test(val)) {
            newState.urlStartsWithError = __('regexp').replace('{field}', __('This value'));
        }
        if (!newState.urlStartsWithError) {
            newState.urlStartsWith = val;
            const updated = mergeToFilterAdditional('urlStartsWith', val, this.props.block.filterAdditional);
            this.props.onValueChanged(updated, 'filterAdditional', false, env.normalTypingDebounceMillis, 'debounce-re-render-and-commit-to-queue');
        }
        this.setState(newState);
        } else {
        let err = isValid(val) ? '' : __('maxLength').replace('{field}', __('This value')).replace('{arg0}', '92');
        if (!err && !(new RegExp(validationConstraints.SLUG_REGEXP)).test(val)) {
            err = __('regexp').replace('{field}', __('This value'));
        }
        if (!err) {
            const updated = mergeToFilterAdditional('urlStartsWith', val, this.props.getBlockCopy().filterAdditional);
            this.props.emitValueChanged(updated, 'filterAdditional', false, env.normalTypingDebounceMillis, 'debounce-re-render-and-commit-to-queue');
        } else {
            this.setState({urlStartsWithNotCommitted: e.target.value, urlStartsWithError: err});
        }
        }
    }
    /**
     * @param {'defineLimit'|'definePageType'|'defineUrlStartsWith'|'addAdditionalFilter'|'defineOrder'|'chooseRenderer'} popupName
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
    if (!window.useReduxBlockTree) { // @featureFlagConditionUseReduxBlockTree
    return temp1(from);
    } else {
    return temp2(from);
    }
}

/**
 * @param {Block|Snapshot} from
 * @returns {Object}
 */
function temp1(from) {
    let howManyType = null;
    if (!from.filterLimit) howManyType = 'all';
    else if (from.filterLimit > 1) howManyType = 'atMost';
    else howManyType = 'single';
    //
    const out = {
        filterPageType: from.filterPageType,
        howManyType,
        howManyAmount: from.filterLimit,
        howManyAmountNotCommitted: from.filterLimit > 1 ? from.filterLimit : null,
        howManyAmountError: '',
        urlStartsWith: null,
        urlStartsWithNotCommitted: null,
        urlStartsWithError: '',
        renderWith: from.renderer || from.renderWith,
        order: from.filterOrder,
    };
    //
    if (from.filterAdditional && !from.urlStartsWith) { // Block
        const parsed = JSON.parse(from.filterAdditional);
        const urlStartsWith = (parsed['p.slug'] || {}).$startsWith;
        if (urlStartsWith) {
            out.urlStartsWith = urlStartsWith;
            out.urlStartsWithNotCommitted = urlStartsWith;
        }
    } else { // Snapshot
        out.urlStartsWith = from.urlStartsWith;
        out.urlStartsWithNotCommitted = from.urlStartsWithNotCommitted;
    }
    //
    return out;
}

/**
 * @param {RawBlock2} from
 * @returns {Object}
 */
function temp2(from) {
    //
    const out = {
        filterPageType: from.filterPageType,
        howManyAmount: from.filterLimit,
        howManyType: from.filterLimitType,
        howManyAmountNotCommitted: from.filterLimit > 1 ? from.filterLimit : null,
        howManyAmountError: '',
        urlStartsWith: null,
        urlStartsWithNotCommitted: null,
        urlStartsWithError: '',
        renderWith: from.renderer || from.renderWith,
        order: from.filterOrder,
    };
    //
    const [urlStartsWith] = getFilterParts(from.filterAdditional);
    if (urlStartsWith) {
        out.urlStartsWith = urlStartsWith;
        out.urlStartsWithNotCommitted = urlStartsWith;
    }
    //
    return out;
}

/**
 * @param {String} filterAdditional
 * @returns {[String|null]} [urlStartsWith or null]
 */
function getFilterParts(filterAdditional) {
    const parsed = JSON.parse(filterAdditional);
    return [(parsed['p.slug'] || {$startsWith: null}).$startsWith];
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
}

/**
 * @param {'urlStartsWith'} kind
 * @param {String|null} val
 * @param {String} current
 * @returns {String} Updated $current
 */
function mergeToFilterAdditional(kind, val, current) {
    const parsed = JSON.parse(current);
    if (kind === 'urlStartsWith') {
        if (val !== null)
            parsed['p.slug'] = {$startsWith: val.charAt(0) === '/' ? val : `/${val}`};
        else
            delete parsed['p.slug'];
    } else
        throw new Error(`Unkown additional filter \`${kind}\``);
    return JSON.stringify(parsed);
}

export default ListingBlockEditForm;
export {Popup};
