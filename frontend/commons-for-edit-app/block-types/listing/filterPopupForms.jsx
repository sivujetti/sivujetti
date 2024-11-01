import {env} from '@sivujetti-commons-for-web-pages';
import CrudList from '../../CrudList.jsx';
import {__} from '../../edit-app-singletons.js';
import {InputError} from '../../Form.jsx';
import {Icon} from '../../Icon.jsx';
import {timingUtils} from '../../utils.js';
import {cloneFilters, deleteFilter, FilterKind} from './AddFilterPopup.jsx';
import RendererPartEditForm from './RendererPartEditForm.jsx';
/** @typedef {import('./AddFilterPopup.jsx').FilterInfo} FilterInfo */
/** @typedef {import('./AddFilterPopup.jsx').AdditionalFilters} AdditionalFilters */
/** @typedef {import('./RendererPartEditForm.jsx').RendererPart} RendererPart */
/** @typedef {import('./RendererPartEditForm.jsx').HeadingPartData} HeadingPartData */
/** @typedef {import('./RendererPartEditForm.jsx').ImagePartData} ImagePartData */
/** @typedef {import('./RendererPartEditForm.jsx').LinkPartData} LinkPartData */
/** @typedef {import('./RendererPartEditForm.jsx').ExcerptPartData} ExcerptPartData */

const orderToText = {
    desc: 'newest to oldest',
    asc: 'oldest to newest',
    rand: 'randomly',
};

class DefineLimitPopup extends preact.Component {
    /**
     * @param {{howManyType: howManyType; howManyAmountNotCommitted: number|null; howManyAmountError: string;}} props
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
        const newData = {
            filterLimitType: newValue,
            filterLimit: newValue === 'all' ? 0 : newValue === 'single' ? 1 : 3,
        };
        this.props.parent.props.emitManyValuesChanged(newData);
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleHowManyAmountChanged(e) {
        const val = parseInt(e.target.value, 10);
        let err = !isNaN(val) ? '' : __('%s must be a number', __('This value'));
        if (!err && e.target.value < 1) {
            err = __('min').replace('{field}', __('This value')).replace('{arg0}', '1');
        }
        if (!err && e.target.value > 10000) {
            err = __('max').replace('{field}', __('This value')).replace('{arg0}', '10 000');
        }
        if (!err) this.props.parent.props.emitValueChanged(val, 'filterLimit');
        else this.props.parent.setState({howManyAmountNotCommitted: e.target.value, howManyAmountError: err});
    }
}

////

class DefinePageTypePopup extends preact.Component {
    /**
     * @param {{filterPageType: string; howManyType: howManyType;}} props
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
        ) : <span>Sivustollasi on vain yksi sivutyyppi <br/>(joten voit valita vain { selectedPageTypeFriendlyNamePlural })</span>;
    }
    /**
     * @param {Event} e
     * @access private
     */
    handlePageTypeChanged(e) {
        const newSelectedPageTypeName = e.target.value;
        this.props.parent.setSelectedPageTypeBundle(newSelectedPageTypeName);
        const newData = {
            filterPageType: newSelectedPageTypeName,
            filterAdditional: deleteIsInCatFilters(this.props.parent.state.filtersCopy), // clear in case the seleted page type does not have applied property
            renderer: this.props.parent.pageTypeBundles.find(({pageType}) => pageType.name === newSelectedPageTypeName).renderers[0].fileId,
        };
        this.props.parent.props.emitManyValuesChanged(newData);
    }
}

/**
 * @returns {AdditionalFilters}
 */
function deleteIsInCatFilters(filters) {
    let deleteAts = getInCatFilterAts(filters);
    if (!deleteAts.length) return filters;

    let copy = cloneFilters(filters);
    while (deleteAts.length) {
        deleteFilter(deleteAts[0], copy); // mutates $copy
        deleteAts = getInCatFilterAts(copy);
    }
    return copy;
}

////

class DefineOrderPopup extends preact.Component {
    /**
     * @param {{order: 'desc'|'asc'|'rand';}} props
     * @access protected
     */
    render({order}) {
        return [...Object.keys(orderToText).map(key =>
            <label class="form-radio py-0 my-0" key={ key }>
                <input
                    onClick={ e => this.props.parent.handleFilterPropMaybeChanged('filterOrder', e) }
                    type="radio"
                    name="order"
                    value={ key }
                    checked={ order === key }/><i class="form-icon"></i> { __(orderToText[key]) }
            </label>
        ),
        this.props.parent.showTechnicalHints
            ? <div class="mt-1 text-small">
                <a href="https://sivujetti.github.io/dev-docs/fi/misc/misc.html#miten-mutatoin-sivua-renderöidessä" rel="noopener noreferrer" target="_blank">Custom?</a>
            </div>
            : null
        ];
    }
}

////

class ChooseRendererPopup extends preact.Component {
    /**
     * @param {{renderWith: string;}} props
     * @access protected
     */
    render({renderWith}) {
        return this.props.parent.selectedPageTypeBundle.renderers.map(({fileId, friendlyName}) =>
            <label class="form-radio py-0 my-0" key={ fileId }>
                <input
                    onClick={ e => this.props.parent.handleFilterPropMaybeChanged('renderWith', e) }
                    type="radio"
                    name="renderWith"
                    value={ fileId }
                    checked={ renderWith === fileId }/><i class="form-icon"></i> { friendlyName ? __(friendlyName) : fileId }
            </label>
        );
    }
}

////

class ConfigureRendererPopup extends preact.Component {
    // crudListRef;
    // partKindsTranslated;
    // emitPropChangeThrottled;
    /**
     * @access protected
     */
    componentWillMount() {
        this.crudListRef = preact.createRef();
        this.partKindsTranslated = {
            heading: __('Heading'),
            link: __('Link'),
            image: __('Image'),
            excerpt: __('Excerpt'),
        };
        this.emitPropChangeThrottled = timingUtils.debounce(
            this.emitPropChange.bind(this),
            env.normalTypingDebounceMillis
        );
    }
    /**
     * @param {{rendererSettings: RendererSettings|null;}} props
     * @access protected
     */
    render({rendererSettings}, {hideInstructionsText}) {
        return <div class="pt-2 mt-2" style="min-width: 10rem;max-width: 16rem;">
            { !hideInstructionsText ? <p class="info-box my-1 with-icon" style="padding: .8rem .6rem; border-left: 2px solid rgb(139 146 169); background-color: rgba(139, 146, 169, 0.07);"><span><Icon iconId="info-circle" className="size-xs color-dimmed"/></span>{ __('Here you can define the elements displayed in the page listing and their order.') }</p> : null }
            <CrudList
                items={ rendererSettings.parts }
                itemTitleKey="kind"
                getTitle={ item => this.partKindsTranslated[item.kind] || item.kind }
                onCreateCtxMenuCtrl={ this.createCtxMenuCtrl.bind(this) }
                onListMutated={
                /**
                 * @param {Array<RendererPart>} newParsedItems
                 * @param {keyof RendererPart} _prop
                 * @param {keyof HeadingPartData | keyof ImagePartData | keyof LinkPartData | keyof ExcerptPartData} prop2
                 */
                (newParsedItems, _prop, prop2) => {
                    if (prop2 === 'text' || prop2 === 'fallbackImageSrc')
                        this.emitPropChangeThrottled(newParsedItems);
                    else
                        this.emitPropChange(newParsedItems);
                } }
                renderAddItemButton={ () => <span class="btn btn-dropdown p-relative d-inline-flex btn-primary btn-sm mt-1">
                    <label htmlFor="addPartDropdown">{ __('Add %s', __('part')) }</label>
                    <select onChange={ e => this.crudListRef.current.addNewItem(e.target.value) } value="" id="addPartDropdown">
                        <option disabled selected value>{ __('Select %s', __('part')) }</option>
                        { Object.keys(this.partKindsTranslated).map(kind =>
                            <option value={ kind }>{ this.partKindsTranslated[kind] }</option>
                        ) }
                    </select>
                </span>}
                createNewItem={ kind => ({kind, data: RendererPartEditForm.createPartData(kind)}) }
                editForm={ RendererPartEditForm }
                editFormProps={ {partKindsTranslated: this.partKindsTranslated} }
                contextMenuPos="left"
                ref={ this.crudListRef }/>
        </div>;
    }
    /**
     * @param {ContextMenuController} ctrl
     * @returns {ContextMenuController}
     * @access private
     */
    createCtxMenuCtrl(ctrl) {
        const origOnClicked = ctrl.onItemClicked;
        return {
            ...ctrl,
            onItemClicked: link => {
                if (link.id === 'edit-option')
                    this.setState({hideInstructionsText: true});
                origOnClicked.call(ctrl, link);
            },
        };
    }
    /**
     * @param {Array<RendererPart>} newParsedItems
     * @access private
     */
    emitPropChange(newParsedItems) {
        this.props.parent.handleFilterPropMaybeChanged('rendererSettings', {target: {value: {parts: newParsedItems}}});
    }
}

////

/**
 * @param {AdditionalFilters} filters
 * @param {(finfo: FilterInfo, tokenpos: number, i: number) => any} fn
 * @returns {Array<any>}
 */
function mapFilters({tokens, paramMap}, fn) {
    const out = [];
    for (let at = 0, i = 0; at < tokens.length; ) {
        const propPath = tokens[at++];
        ++at; // skip operator
        const paramKey = tokens[at++];
        const value = paramMap[paramKey];
        const kind = propPath === 'p.slug' ? FilterKind.URL_STARTS_WITH : FilterKind.IS_IN_CAT;

        const ret = fn({kind, value, propPath, paramKey}, at - 3, i++);
        if (ret) out.push(ret);

        if (['AND', 'OR'].indexOf(tokens[at]) > -1) ++at;
    }
    return out;
}

/**
 * @param {AdditionalFilters} from
 * @returns {Array<number>}
 */
function getInCatFilterAts(from) {
    return mapFilters(from, (filter, at/*, i*/) => {
        if (filter.kind === FilterKind.IS_IN_CAT) return at;
    });
}

/**
 * @typedef {'all'|'single'|'atMost'} howManyType
 *
 * @typedef {{parts: Array<RendererPart>;}} RendererSettings
 */

export {
    ChooseRendererPopup,
    ConfigureRendererPopup,
    DefineLimitPopup,
    DefineOrderPopup,
    DefinePageTypePopup,
    mapFilters,
    orderToText,
};
