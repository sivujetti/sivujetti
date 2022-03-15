import {__, env, http, api, FormGroupInline, Icon} from '@sivujetti-commons-for-edit-app';

class ListingBlockEditForm extends preact.Component {
    // selectedPageTypeBundle;
    // selectedPageTypeFriendlyName;
    /**
     * @param {RawBlockData} snapshot
     * @access public
     */
    overrideValues(snapshot) {
        this.setSelectedPageTypeBundle(snapshot.listPageType);
        this.applyState({listPageType: snapshot.listPageType,
                         renderWith: snapshot.renderWith,
                         listOrder: snapshot.listOrder});
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const r = api.getBlockRenderers();
        this.pageTypeBundles = api.getPageTypes()
            .map(pageType => ({pageType, renderers: r.filter(({associatedWith}) => associatedWith === pageType.name)}))
            .filter(({renderers}) => renderers.length > 0);
        this.setSelectedPageTypeBundle(this.props.block.listPageType);
        //
        const block = this.props.block;
        this.setState({
            listPageType: block.listPageType,
            renderWith: block.rendered,
            listOrder: block.listOrder,
        });
    }
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    render(_, {listPageType, renderWith}) {
        if (!listPageType) return;
        const tooltipCss = "right: calc(75% - .2rem);margin-top: .34rem;background-color: #fff;";
        return <div class="form-horizontal pt-0">
            <span
                class="tooltip tooltip-right p-absolute"
                data-tooltip={ __('todo1') }
                style={ tooltipCss }>
                <Icon iconId="info-circle" className="size-xs"/>
            </span>
            <FormGroupInline>
                <label htmlFor="listPageType" class="form-label">{ __('List') }</label>
                <select value={ listPageType } onChange={ this.handlePageTypeChanged.bind(this) } class="form-input form-select">{
                    this.pageTypeBundles.map(({pageType}) =>
                        <option value={ pageType.name }>{ __(pageType.friendlyName) }</option>
                    )
                }</select>
            </FormGroupInline>
            <span
                class="tooltip tooltip-right p-absolute"
                data-tooltip={ __('todo2') }
                style={ tooltipCss }>
                <Icon iconId="info-circle" className="size-xs"/>
            </span>
            <FormGroupInline>
                <label htmlFor="renderWith" class="form-label">{ __('Renderer') }</label>
                <select value={ renderWith } onChange={ this.handleRendererChanged.bind(this) } class="form-input form-select">{
                    this.selectedPageTypeBundle.renderers.map(({fileId, friendlyName}) =>
                        <option value={ fileId }>{ friendlyName ? __(friendlyName) : fileId }</option>
                    )
                }</select>
            </FormGroupInline>
            <div class="pt-1">
                <hr/>
                <a onClick={ this.openAddPageView.bind(this) } class="d-inline-block mt-2">{ __('Add new %s', this.selectedPageTypeFriendlyName) }</a>
            </div>
        </div>;
    }
    /**
     * @param {Event} e
     * @access private
     */
    handlePageTypeChanged(e) {
        const newSelectedPageTypeName = e.target.value;
        this.setSelectedPageTypeBundle(newSelectedPageTypeName);
        //
        const partialState = {
            listPageType: newSelectedPageTypeName,
            renderWith: this.pageTypeBundles.find(({pageType}) => pageType.name === newSelectedPageTypeName).renderers[0].fileId};
        this.applyState(partialState);
        //
        this.props.onValueChanged(newSelectedPageTypeName, 'listPageType', false, env.normalTypingDebounceMillis);
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleRendererChanged(e) {
        const renderer = e.target.value;
        this.applyState({renderWith: renderer});
        this.props.onValueChanged(renderer, 'renderWith', false, env.normalTypingDebounceMillis);
    }
    /**
     * @param {Event} e
     * @access private
     */
    openAddPageView(e) {
        e.preventDefault();
        const typeName = this.state.listPageType;
        api.webPageIframe.openPlaceholderPage(typeName, this.selectedPageTypeBundle.pageType.defaultLayoutId);
    }
    /**
     * @param {String} selectedPageTypeName
     * @access private
     */
    setSelectedPageTypeBundle(selectedPageTypeName) {
        this.selectedPageTypeBundle = this.pageTypeBundles.find(({pageType}) => pageType.name === selectedPageTypeName);
        this.selectedPageTypeFriendlyName = __(this.selectedPageTypeBundle.pageType.friendlyName).toLowerCase();
    }
    /**
     * @access private
     */
    applyState(newState) {
        if (newState.renderWith)
            this.props.block.renderer = newState.renderWith;
        this.setState(newState);
    }
}

export default () => {
    const initialData = {
        listPageType: 'Pages',
        renderWith: 'sivujetti:block-listing-pages-default', // Mirrored to block.renderer
        listFilters: '[]'
    };
    return {
        name: 'Listing',
        friendlyName: 'Listing',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: initialData.renderWith,
        icon: 'layout-list',
        reRender(block, _) {
            return http.post('/api/blocks/render', {block: block.toRaw()}).then(resp => resp.result);
        },
        createSnapshot: from => ({
            listPageType: from.listPageType,
            renderWith: from.renderWith,
            listFilters: from.listFilters,
        }),
        editForm: ListingBlockEditForm,
    };
};
