import {__, env, api, InputError, Popup, Icon} from '@sivujetti-commons-for-edit-app';
import AddFilterPopup, {buildWorkableFilters, FilterKind, mergeToFilterAdditional,
        removeIsInCatFilter, IsInCategoryPart, UrlStartsWithPart} from './AddFilterPopup.jsx';

const orderToText = {
    desc: 'newest to oldest',
    asc: 'oldest to newest',
    rand: 'randomly',
};

class ListingBlockEditForm extends preact.Component {
    // showTechnicalHints;
    // curPopup;
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
        this.curPopup = preact.createRef();
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
            filtersParsed: buildWorkableFilters(block.filterAdditional),
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
                this.setState({additionalFiltersJson: block.filterAdditional,
                    filtersParsed: buildWorkableFilters(block.filterAdditional)});
            }
        });
    }
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    render(_, {filterPageType, howManyType, howManyAmount,
               additionalFiltersJson, filtersParsed, order, renderWith,
               curPopupRenderer, curPopupButton}) {
        if (!filterPageType) return;
        const curPopupProps = curPopupRenderer ? this.getCurrentPopupProps(curPopupRenderer) : null;
        const a1 = __('and');
        const a2 = `${__(howManyType !== 'single' ? 'which#nominative' : 'which') }/${ __(howManyType !== 'single' ? 'whose' : 'which#genitive')}`;
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
                    howManyType !== 'single'
                        ? howManyType !== 'atMost'
                            ? this.selectedPageTypeFriendlyNamePlural
                            : this.selectedPageTypeFriendlyNamePartitive
                        : this.selectedPageTypeFriendlyName
                }</button>
            </div>

            { [
                ...filtersParsed.map((filter, i) => {
                    const Cls = filter.kind === FilterKind.URL_STARTS_WITH ? UrlStartsWithPart : IsInCategoryPart;
                    return [
                        <span class="group-2 ml-1 pl-2 pr-1 no-round-right">{ // todo trigger next element when clicked
                            (i ? `${__('and')} ` : '') + Cls.getLabel(howManyType)
                        }</span>,
                        <div class="group-2 no-round-left flex-centered pl-0" data-filter-part-kind={ filter.kind }>
                            <Cls
                                workableFilter={ filter }
                                getListPageTypeOwnProps={ () => this.selectedPageTypeBundle.pageType.ownFields }
                                currentFiltersJson={ additionalFiltersJson }
                                parent={ this }/>
                            <button
                                onClick={ () => this.onFiltersChanged(mergeToFilterAdditional(filter.kind, null, additionalFiltersJson), 'removed') }
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
                        { (filtersParsed.length ? `${a1} ` : '') + a2 } ... <Icon iconId="plus" className="size-xs ml-1"/>
                    </button>
                </div>
            ] }

            { howManyType !== 'single' && (howManyAmount === 0 || howManyAmount > 1) ? [
            <span class="group-3 ml-1 px-2 no-round-right"> { __('ordered by') } </span>,
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
            <span class="group-4 ml-1 px-2 no-round-right">{ __('rendering %s using template', __(howManyType !== 'single' ? 'them' : 'it')) }</span>,
            <div class="group-4 no-round-left">
                <button
                    onClick={ e => this.openPartPopup(ChooseRendererPopup, e) }
                    class="form-select poppable pl-1"
                    type="button">{ __(this.selectedPageTypeBundle.renderers.find(({fileId}) =>
                        fileId === renderWith
                    ).friendlyName || renderWith) }
                </button>
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
        { curPopupRenderer
            ? <Popup
                Renderer={ curPopupRenderer }
                rendererProps={ curPopupProps }
                btn={ curPopupButton }
                close={ this.closeCurrentPopup.bind(this) }
                ref={ this.curPopup }/>
            : null
        }
        </div>;
    }
    /**
     * @param {preact.Component} PopupRendererCls
     * @returns {{[key: String]: any;}}
     * @access private
     */
    getCurrentPopupProps(PopupRendererCls) {
        if (PopupRendererCls === DefineLimitPopup)
            return {howManyType: this.state.howManyType, howManyAmountNotCommitted: this.state.howManyAmountNotCommitted, howManyAmountError: this.state.howManyAmountError, parent: this};
        if (PopupRendererCls === DefinePageTypePopup)
            return {howManyType: this.state.howManyType, filterPageType: this.state.filterPageType, parent: this};
        if (PopupRendererCls === AddFilterPopup)
            return {filtersParsed: this.state.filtersParsed, howManyType: this.state.howManyType,
                    currentFiltersJson: this.state.additionalFiltersJson, parent: this};
        if (PopupRendererCls === DefineOrderPopup)
            return {order: this.state.order, parent: this};
        if (PopupRendererCls === ChooseRendererPopup)
            return {renderWith: this.state.renderWith, parent: this};
    }
    /**
     * @access private
     */
    closeCurrentPopup() {
        this.setState({curPopupRenderer: null});
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
     * @param {preact.Component} RendererCls
     * @param {Event} e
     * @access private
     */
    openPartPopup(RendererCls, e) {
        this.setState({
            curPopupRenderer: RendererCls,
            curPopupButton: getTargetButton(e.target)
        });
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
     * @param {String} updatedFiltersJson
     * @param {'added'|'updated'|'removed'} event = null
     * @param {Popup} popup = null
     * @access private
     */
    onFiltersChanged(updatedFiltersJson, event = null , popup = null) {
        this.props.emitValueChanged(updatedFiltersJson, 'filterAdditional', false, 0);
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

class DefineLimitPopup extends preact.Component {
    /**
     * @param {{howManyType: howManyType; howManyAmountNotCommitted: Number|null; howManyAmountError: String;}} props
     * @access protected
     */
    render({howManyType, howManyAmountNotCommitted, howManyAmountError}) {
        return [
            <label class="form-radio py-0 my-0">
                <input
                    onClick={ this.handleHowManyTypeChanged.bind(this) }
                    type="radio"
                    name="gender"
                    value="all"
                    checked={ howManyType === 'all' }/><i class="form-icon"></i> { __('all') }
            </label>,
            <label class="form-radio py-0 my-0">
                <input
                    onClick={ this.handleHowManyTypeChanged.bind(this) }
                    type="radio"
                    name="gender"
                    value="single"
                    checked={ howManyType === 'single' }/><i class="form-icon"></i> { __('single') }
            </label>,
            <label class="form-radio py-0 my-0">
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
        ];
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleHowManyTypeChanged(e) {
        const newValue = e.target.value;
        const newData = {filterLimitType: newValue,
            filterLimit: newValue === 'all' ? 0 : newValue === 'single' ? 1 : 3};
        this.props.parent.props.emitManyValuesChanged(newData, false, 0, 'debounce-none');
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
        if (!err) this.props.parent.props.emitValueChanged(val, 'filterLimit', false, 0, 'debounce-none');
        else this.props.parent.setState({howManyAmountNotCommitted: e.target.value, howManyAmountError: err});
    }
}

class DefinePageTypePopup extends preact.Component {
    /**
     * @param {{filterPageType: String; howManyType: howManyType;}} props
     * @access protected
     */
    render({filterPageType, howManyType}) {
        const {pageTypeBundles, selectedPageTypeFriendlyNamePlural} = this.props.parent;
        return pageTypeBundles.length > 1 ? pageTypeBundles.map(({pageType}) =>
            <label class="form-radio py-0 my-0" key={ pageType.name }>
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
        ) : <span>Sivustollasi on vain yksi sivutyyppi <br/>(joten voit valita vain { selectedPageTypeFriendlyNamePlural })</span>
    }
    /**
     * @param {Event} e
     * @access private
     */
    handlePageTypeChanged(e) {
        const newSelectedPageTypeName = e.target.value;
        this.props.parent.setSelectedPageTypeBundle(newSelectedPageTypeName);
        const newData = {filterPageType: newSelectedPageTypeName,
            filterAdditional: removeIsInCatFilter(this.props.parent.state.additionalFiltersJson), // clear in case the seleted page type does not have applied property
            renderer: this.props.parent.pageTypeBundles.find(({pageType}) => pageType.name === newSelectedPageTypeName).renderers[0].fileId};
        this.props.parent.props.emitManyValuesChanged(newData, false, env.normalTypingDebounceMillis);
    }
}

class DefineOrderPopup extends preact.Component {
    /**
     * @param {{order: 'desc'|'asc'|'rand';}} props
     * @access protected
     */
    render({order}) {
        return [...Object.keys(orderToText).map(key =>
            <label class="form-radio py-0 my-0" key={ key }>
                <input
                    onClick={ e => this.props.parent.handleFilterPropMaybeChanged('filterOrder', 'order', e) }
                    type="radio"
                    name="order"
                    value={ key }
                    checked={ order === key }/><i class="form-icon"></i> { __(orderToText[key]) }
            </label>
        ),
        this.props.parent.showTechnicalHints ? <div class="my-2 text-small">
            <a href="https://sivujetti.github.io/dev-docs/fi/misc/misc.html#miten-mutatoin-sivua-renderöidessä" rel="noopener noreferrer" target="_blank">Custom?</a>
                    </div> : null
        ];
    }
}

class ChooseRendererPopup extends preact.Component {
    /**
     * @param {{renderWith: String;}} props
     * @access protected
     */
    render({renderWith}) {
        return this.props.parent.selectedPageTypeBundle.renderers.map(({fileId, friendlyName}) =>
            <label class="form-radio py-0 my-0" key={ fileId }>
                <input
                    onClick={ e => this.props.parent.handleFilterPropMaybeChanged('renderWith', 'renderWith', e) }
                    type="radio"
                    name="renderWith"
                    value={ fileId }
                    checked={ renderWith === fileId }/><i class="form-icon"></i> { friendlyName ? __(friendlyName) : fileId }
            </label>
        );
    }
}

/**
 * @typedef {'all'|'single'|'atMost'} howManyType
 */

export default ListingBlockEditForm;
