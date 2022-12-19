import {__, env, api, InputError} from '@sivujetti-commons-for-edit-app';
import AdditionalFiltersBuilder, {Popup, removeIsInCatFilter} from './AdditionalFiltersBuilder.jsx';

const orderToText = {
    desc: 'newest to oldest',
    asc: 'oldest to newest',
    rand: 'randomly',
};

class ListingBlockEditForm extends preact.Component {
    // defineLimitPopup;
    // definePageTypePopup;
    // defineOrderPopup;
    // chooseRendererPopup;
    // showTechnicalHints;
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
        this.addAdditionalFilterPopup = preact.createRef();
        this.defineOrderPopup = preact.createRef();
        this.chooseRendererPopup = preact.createRef();
        this.showTechnicalHints = api.user.getRole() <= api.user.ROLE_ADMIN_EDITOR;
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
        const block = this.props.getBlockCopy();
        this.setSelectedPageTypeBundle(block.filterPageType);
        //
        this.setState({
            filterPageType: block.filterPageType,
            howManyAmount: block.filterLimit,
            howManyType: block.filterLimitType,
            howManyAmountNotCommitted: block.filterLimit > 1 ? block.filterLimit : null,
            howManyAmountError: '',
            additionalFiltersJson: block.filterAdditional,
            renderWith: block.renderer || block.renderWith,
            order: block.filterOrder,
        });
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
            }
            //
            if (this.state.additionalFiltersJson !== block.filterAdditional) {
                this.setState({additionalFiltersJson: block.filterAdditional});
            }
        });
    }
    /**
     * @access protected
     */
    render(_, {filterPageType, howManyType, howManyAmount, howManyAmountNotCommitted,
               howManyAmountError, additionalFiltersJson, order, renderWith}) {
        if (!filterPageType) return;
        /*
               1       2          3*                              4                             5
        --------------------------------------------------------------------------------------------------------------------
        List   single  page       which slug starts with '/foo-'  -                             rendering it using foo
        List   all     articles   -                               ordered by randomly           rendering them using foo
        List   all     pages      with category bar               -                             rendering them using foo
        List   50      pages                                      ordered by oldest to newest   rendering them using foo
        */
        return <div>
        <div class="listing-instructions d-flex pt-1">
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

            <AdditionalFiltersBuilder
                currentFiltersJson={ additionalFiltersJson }
                onFiltersChanged={ (updatedFiltersJson, _event) => {
                    this.props.emitValueChanged(updatedFiltersJson, 'filterAdditional', false, 0);
                } }
                getListPageTypeOwnProps={ () => this.selectedPageTypeBundle.pageType.ownFields }
                howManyType={ howManyType }/>

            { howManyType !== 'single' && (howManyAmount === 0 || howManyAmount > 1) ? [
            <span class="group-3 ml-1 px-2 no-round-right"> { __('ordered by') } </span>,
            <div class="group-3 no-round-left">
                <button
                    onClick={ () => this.openPartPopup('defineOrder') }
                    class="form-select poppable"
                    type="button">{ __(orderToText[order]) }
                </button>
                <Popup ref={ this.defineOrderPopup }>
                    { Object.keys(orderToText).map(key =>
                        <label class="form-radio" key={ key }>
                            <input
                                onClick={ e => this.handleFilterPropMaybeChanged('filterOrder', 'order', e) }
                                type="radio"
                                name="order"
                                value={ key }
                                checked={ order === key }/><i class="form-icon"></i> { __(orderToText[key]) }
                        </label>
                    ) }
                    { this.showTechnicalHints ? <div class="my-2 text-small">
                        <a href="https://sivujetti.github.io/dev-docs/fi/misc/misc.html#miten-mutatoin-sivua-renderöidessä" rel="noopener noreferrer" target="_blank">Custom?</a>
                    </div> : null }
                </Popup>
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
                href={ `#/pages/create/${this.state.filterPageType}/${this.selectedPageTypeBundle.pageType.defaultLayoutId}` }
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
        const newData = {filterLimitType: newValue,
            filterLimit: newValue === 'all' ? 0 : newValue === 'single' ? 1 : 3};
        this.props.emitManyValuesChanged(newData, false, 0, 'debounce-none');
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleHowManyAmountChanged(e) {
        const val = parseInt(e.target.value, 10);
        let err = !isNaN(val) ? '' : __('%s must be a number', __('This value'));
        if (!err && e.target.value > 10000) {
            err = __('max').replace('{field}', __('This value')).replace('{arg0}', '10 000');
        }
        if (!err) this.props.emitValueChanged(val, 'filterLimit', false, 0, 'debounce-none');
        else this.setState({howManyAmountNotCommitted: e.target.value, howManyAmountError: err});
    }
    /**
     * @param {'filterOrder'|'renderWith'} propName
     * @param {'order'|'renderWith'} stateKey
     * @param {Event} e
     * @access private
     */
    handleFilterPropMaybeChanged(propName, stateKey, e) {
        const newValue = e.target.value;
        if (propName === 'renderWith') propName = 'renderer';
        this.props.emitValueChanged(newValue, propName, false, 0, 'debounce-none');
    }
    /**
     * @param {Event} e
     * @access private
     */
    handlePageTypeChanged(e) {
        const newSelectedPageTypeName = e.target.value;
        this.setSelectedPageTypeBundle(newSelectedPageTypeName);
        const newData = {filterPageType: newSelectedPageTypeName,
            filterAdditional: removeIsInCatFilter(this.state.additionalFiltersJson), // clear in case the seleted page type does not have applied property
            renderer: this.pageTypeBundles.find(({pageType}) => pageType.name === newSelectedPageTypeName).renderers[0].fileId};
        this.props.emitManyValuesChanged(newData, false, env.normalTypingDebounceMillis);
    }
    /**
     * @param {'defineLimit'|'definePageType'|'addAdditionalFilter'|'defineOrder'|'chooseRenderer'} popupName
     * @access private
     */
    openPartPopup(popupName) {
        this[`${popupName}Popup`].current.open();
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
}

export default ListingBlockEditForm;
