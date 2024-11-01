import {__, api} from '../../edit-app-singletons.js';
import {Icon} from '../../Icon.jsx';
import {objectUtils} from '../../utils.js';
import AddFilterPopup, {
    cloneFilters,
    createFilters,
    deleteFilter,
    FilterKind,
    IsInCategoryPart,
    UrlStartsWithPart,
} from './AddFilterPopup.jsx';
import {
    ChooseRendererPopup,
    ConfigureRendererPopup,
    DefineLimitPopup,
    DefineOrderPopup,
    DefinePageTypePopup,
    mapFilters,
    orderToText,
} from './filterPopupForms.jsx';
/** @typedef {import('./filterPopupForms.jsx').howManyType} howManyType */

class ListingBlockEditForm extends preact.Component {
    // showTechnicalHints;
    // pageTypeBundles;
    // selectedPageTypeBundle;
    // selectedPageTypeFriendlyName;
    // selectedPageTypeFriendlyNamePlural;
    // selectedPageTypeFriendlyNamePartitive;
    /**
     * @access protected
     */
    componentWillMount() {
        this.showTechnicalHints = api.user.getRole() <= api.user.ROLE_ADMIN_EDITOR;
        const renderers = api.getBlockRenderers();
        this.pageTypeBundles = api.getPageTypes()
            .map(pageType => ({pageType, renderers: renderers.filter(({associatedWith}) =>
                associatedWith === '*' || associatedWith === pageType.name)}))
            .filter(({renderers}) => renderers.length > 0);
        const {block} = this.props;
        this.setSelectedPageTypeBundle(block.filterPageType);
        //
        this.setState({
            filterPageType: block.filterPageType,
            howManyAmount: block.filterLimit,
            howManyType: block.filterLimitType,
            howManyAmountNotCommitted: block.filterLimit > 1 ? block.filterLimit : null,
            howManyAmountError: '',
            filtersCopy: cloneFilters(block.filterAdditional),
            renderWith: block.renderer || block.renderWith,
            order: block.filterOrder,
        });
    }
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        const {block} = props;
        if (block === this.props.block)
            return;
        const current = JSON.stringify(this.props.block.propsData) + this.props.block.renderer;
        const incoming = JSON.stringify(props.block.propsData) + block.renderer;
        if (current === incoming)
            return;

        const [state, PopupClsToRefresh] = this.createState(props);

        if (state)
            this.setState(state);

        if (PopupClsToRefresh === api.mainPopper.getCurrentRendererCls())
            api.mainPopper.refresh(this.createCurrentPopupProps(PopupClsToRefresh, props, state));
    }
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    render(_, {filterPageType, howManyType, howManyAmount, filtersCopy, order, renderWith}) {
        if (!filterPageType) return;
        const a1 = __('and');
        const a2 = `${__(howManyType !== 'single' ? 'which#nominative' : 'which') }/${ __(howManyType !== 'single' ? 'whose' : 'which#genitive')}`;
        const howManyTypeAdjusted = createAdjustedHowManyType(howManyType, howManyAmount);
        const rendererIsConfigurable = renderWith === 'sivujetti:block-listing-pages-default';
        /*
               1       2          3*                              4                             5
        --------------------------------------------------------------------------------------------------------------------
        List   single  page       which slug starts with '/foo-'  -                             rendering it using foo
        List   all     articles   -                               ordered by randomly           rendering them using foo
        List   all     pages      with category bar               -                             rendering them using foo
        List   50      pages                                      ordered by oldest to newest   rendering them using foo
        */
        return <div>
        <div class="instructions-list d-flex pt-1">
            <span>{ __('List') }</span>

            <div class="group-2 ml-1">
                <button
                    onClick={ e => this.openPartPopup(DefineLimitPopup, e) }
                    class="form-select poppable pl-1"
                    type="button">{ howManyType !== 'atMost' ? __(howManyType) : `${__('at most') } ${howManyAmount}` }
                </button>
            </div>

            <div class="group-1 ml-1">
                <button
                    onClick={ e => this.openPartPopup(DefinePageTypePopup, e) }
                    class="form-select poppable pl-1"
                    type="button">{
                    howManyTypeAdjusted !== 'single'
                        ? howManyTypeAdjusted !== 'atMost'
                            ? this.selectedPageTypeFriendlyNamePlural
                            : this.selectedPageTypeFriendlyNamePartitive
                        : this.selectedPageTypeFriendlyName
                }</button>
            </div>

            { [
                ...mapFilters(filtersCopy, (filterInfo, at, i) => {
                    const {kind} = filterInfo;
                    const Cls = kind === FilterKind.URL_STARTS_WITH ? UrlStartsWithPart : IsInCategoryPart;
                    return [
                        <span class="group-2 ml-1 pl-2 pr-1 no-round-right c-hand" onClick={ e => e.target.nextElementSibling.querySelector('.form-select').click() } >{
                            (i ? `${__('and')} ` : '') + Cls.getLabel(howManyTypeAdjusted)
                        }</span>,
                        <div class="group-2 no-round-left flex-centered pl-0" data-filter-part-kind={ kind }>
                            <Cls
                                filterInfo={ filterInfo }
                                getListPageTypeOwnProps={ () => this.selectedPageTypeBundle.pageType.ownFields }
                                onFilterValueChanged={ (newVal, openPopup) => {
                                    const filtersNew = cloneFilters(filtersCopy);
                                    filtersNew.paramMap[filterInfo.paramKey] = newVal;
                                    this.onFiltersChanged(filtersNew, 'updated', openPopup);
                                } }
                                parent={ this }/>
                            <button
                                onClick={ () => this.onFiltersChanged(createFilters(filtersCopy, mut => deleteFilter(at, mut)), 'removed') }
                                class="btn btn-sm btn-link btn-icon flex-centered pl-1"
                                type="button"
                                title={ __('Delete filter') }
                                style="background: 0 0;"><Icon iconId="x" className="size-xs color-dimmed"/></button>
                        </div>
                    ];
                }),
                <div class="group-2 perhaps ml-1">
                    <button
                        class="poppable d-flex px-1"
                        onClick={ e => this.openPartPopup(AddFilterPopup, e) }
                        type="button"
                        title={ __('Add filter') }>
                        { (filtersCopy.length ? `${a1} ` : '') + a2 } ... <Icon iconId="plus" className="size-xs ml-1"/>
                    </button>
                </div>
            ] }

            { howManyType === 'all' || (howManyType !== 'single' && howManyAmount > 0) ? [
            <span class="group-3 ml-1 px-2 no-round-right"> { __(`ordered by${howManyAmount > 1 ? '' : '#singular'}`) } </span>,
            <div class="group-3 no-round-left">
                <button
                    onClick={ e => this.openPartPopup(DefineOrderPopup, e) }
                    class="form-select poppable pl-1"
                    type="button">{ __(orderToText[order]) }
                </button>
            </div>
            ] : null
            }

            { this.selectedPageTypeBundle.renderers.length > 1 ? [
                <span class="group-4 ml-1 pl-2 pr-0 no-round-right">{ __('rendering %s using template', __(howManyTypeAdjusted !== 'single' ? 'them' : 'it')) }</span>,
                <div class="group-4 no-round-left">
                    <button
                        onClick={ e => this.openPartPopup(ChooseRendererPopup, e) }
                        class="form-select poppable pl-1"
                        type="button">{ __(this.selectedPageTypeBundle.renderers.find(({fileId}) =>
                            fileId === renderWith
                        ).friendlyName || renderWith).toLowerCase() }
                    </button>
                </div>,
                ...(rendererIsConfigurable ? [
                    <div class="group-4 ml-1 pl-2 pr-0 no-round-left">
                        <button onClick={ e => this.openPartPopup(ConfigureRendererPopup, e) } class="d-flex poppable pr-1 pl-0" type="button" title="">
                        { __('using settings') } <Icon iconId="settings" className="size-xs color-dimmed mx-1"/>
                        </button>
                    </div>] : [])
            ] : null }
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
     * @param {BlockEditFormProps} props
     * @returns {[Object|undefined, preact.Component|null]}
     * @access private
     */
    createState({block}) {
        let [state, PopupClsToRefresh] = [undefined, null];

        if (this.state.filterPageType !== block.filterPageType) {
            this.setSelectedPageTypeBundle(block.filterPageType);
            state = {filterPageType: block.filterPageType};
            PopupClsToRefresh = DefinePageTypePopup;
        } else if (this.state.howManyType !== block.filterLimitType ||
                this.state.howManyAmount !== block.filterLimit) {
            state = {
                howManyType: block.filterLimitType,
                howManyAmount: block.filterLimit,
                howManyAmountNotCommitted: block.filterLimitType !== 'atMost' ? null : block.filterLimit,
                howManyAmountError: ''
            };
            PopupClsToRefresh = DefineLimitPopup;
        } else if (this.state.order !== block.filterOrder) {
            state = {order: block.filterOrder};
            PopupClsToRefresh = DefineOrderPopup;
        } else if (JSON.stringify(this.state.rendererSettings) !== JSON.stringify(block.rendererSettings) &&
                    api.mainPopper.getCurrentRendererCls() === ConfigureRendererPopup) {
            PopupClsToRefresh = ConfigureRendererPopup;
        }

        if (JSON.stringify(this.state.filtersCopy) !== JSON.stringify(block.filterAdditional)) {
            state = {...(state || {}), filtersCopy: cloneFilters(block.filterAdditional)};
            PopupClsToRefresh = AddFilterPopup;
        }
        if (this.state.renderWith !== block.renderer) {
            state = {...(state || {}), renderWith: block.renderer};
            PopupClsToRefresh = ChooseRendererPopup;
        }

        return [state, PopupClsToRefresh];
    }
    /**
     * @param {preact.Component} PopupRendererCls
     * @param {BlockEditFormProps} props = this.props
     * @param {Object} state = this.state
     * @returns {{[key: string]: any;}}
     * @access private
     */
    createCurrentPopupProps(PopupRendererCls, props = this.props, state = this.state) {
        if (PopupRendererCls === DefineLimitPopup)
            return {howManyType: state.howManyType, howManyAmountNotCommitted: state.howManyAmountNotCommitted, howManyAmountError: state.howManyAmountError, parent: this};
        if (PopupRendererCls === DefinePageTypePopup)
            return {howManyType: state.howManyType, filterPageType: state.filterPageType, parent: this};
        if (PopupRendererCls === AddFilterPopup) {
            const hasCategoryOwnField = this.selectedPageTypeBundle.pageType.ownFields.some(f => typeof f.dataType.rel === 'string');
            return {filtersCopy: state.filtersCopy,
                    howManyTypeAdjusted: createAdjustedHowManyType(state.howManyType, state.howManyAmount),
                    showAddCategoryFilterButton: hasCategoryOwnField,
                    parent: this};
        }
        if (PopupRendererCls === DefineOrderPopup)
            return {order: state.order, parent: this};
        if (PopupRendererCls === ChooseRendererPopup)
            return {renderWith: state.renderWith, parent: this};
        if (PopupRendererCls === ConfigureRendererPopup)
            return {rendererSettings: props.block.rendererSettings ? objectUtils.cloneDeep(props.block.rendererSettings) : null, parent: this};
    }
    /**
     * @access private
     */
    closeCurrentPopup() {
        api.mainPopper.close();
    }
    /**
     * @param {'filterOrder'|'renderWith'} propName
     * @param {Event} e
     * @access private
     */
    handleFilterPropMaybeChanged(propName, e) {
        const newValue = e.target.value;
        if (propName === 'renderWith') propName = 'renderer';
        this.props.emitValueChanged(newValue, propName);
    }
    /**
     * @param {preact.Component} RendererCls
     * @param {Event} e
     * @access private
     */
    openPartPopup(RendererCls, e) {
        api.mainPopper.open(
            RendererCls,
            getTargetButton(e.target),
            this.createCurrentPopupProps(RendererCls),
        );
    }
    /**
     * @param {string} selectedPageTypeName
     * @access private
     */
    setSelectedPageTypeBundle(selectedPageTypeName) {
        this.selectedPageTypeBundle = this.pageTypeBundles.find(({pageType}) => pageType.name === selectedPageTypeName);
        this.selectedPageTypeFriendlyName = __(this.selectedPageTypeBundle.pageType.friendlyName).toLowerCase();
        this.selectedPageTypeFriendlyNamePlural = __(this.selectedPageTypeBundle.pageType.friendlyNamePlural).toLowerCase();
        this.selectedPageTypeFriendlyNamePartitive = __(`${this.selectedPageTypeBundle.pageType.friendlyNamePlural}#partitive`).toLowerCase();
    }
    /**
     * @param {Object} updatedFilters
     * @param {'added'|'updated'|'removed'} event = null
     * @param {PopupPrerendered} popup = null
     * @access private
     */
    onFiltersChanged(updatedFilters, event = null, popup = null) {
        this.props.emitValueChanged(updatedFilters, 'filterAdditional', false, 0);
        if (event === 'updated' && popup) setTimeout(() => popup.popperInstance.update(), 20);
    }
}

/**
 * @param {EventTarget} target
 * @returns {HTMLButtonElement|null}
 */
function getTargetButton(target, kill = 0) {
    if (kill > 6) return null;
    if (target.nodeName === 'BUTTON') return target;
    const node = target.nodeName !== '#text' ? target : target.parentElement;
    return getTargetButton(node.closest('button'), kill + 1);
}

/**
 * @param {howManyType} howManyType
 * @param {number?} howManyAmount
 * @returns {howManyType}
 */
function createAdjustedHowManyType(howManyType, howManyAmount) {
    return (howManyType === 'single' || howManyAmount === 1) ? 'single' : howManyType;
}

export default ListingBlockEditForm;
