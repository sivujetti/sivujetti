import {__, http} from '../commons/main.js';
import webPageIframe from '../webPageIframe.js';

let internalSivujettiApi = null;

class ListingBlockEditForm extends preact.Component {
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    render({block}) {
        return <div>
            <p>{ __('A list of %s', block.listPageType) }.</p>
            <a href="" onClick={ this.openAddPageView.bind(this) }>{ __('Add new %s', block.listPageType) }</a>
        </div>;
    }
    /**
     * @param {Event} e
     * @access private
     */
    openAddPageView(e) {
        e.preventDefault();
        const typeName = this.props.block.listPageType;
        const pageType = internalSivujettiApi.getPageTypes().find(({name}) => name === typeName);
        webPageIframe.openPlaceholderPage(typeName, pageType.defaultLayoutId);
    }
}

function throwIfInvalidSettings(settings) {
    const errors = [];
    //
    if (typeof settings.name !== 'string')
        errors.push('settings.name is required');
    if (Object.prototype.hasOwnProperty.call(settings, 'friendlyName') &&
        typeof settings.friendlyName !== 'string')
        errors.push('settings.friednlyName must be string');
    if (typeof settings.defaultRenderer !== 'string')
        errors.push('settings.defaultRenderer is required');
    if (typeof settings.initialData !== 'object')
        errors.push('settings.initialData is required');
    else {
        if (Object.prototype.hasOwnProperty.call(settings.initialData, 'listPageType') &&
            typeof settings.initialData.listPageType !== 'string')
            errors.push('settings.initialData.listPageType must be string');
        try {
            JSON.parse(settings.initialData.listFilters);
        } catch (e) {
            errors.push('settings.initialData.listFilters must be valid json string');
        }
    }
    //
    if (errors.length) throw new Error(errors.join('\n'));
}

export default api => {
    internalSivujettiApi = api;
    /**
     * Usage:
     * This requires three pieces of code:
     *
     * 1. Custom block type (backend)
     * ```php
     * class Site implements UserSiteInterface {
     *     public function __construct(UserSiteAPI $api) {
     *         $api->registerBlockType("ArticlesListing", new Sivujetti\BlockType\ListingBlockType);
     *         ...
     * ```
     *
     * 2. Custom renderer
     * ```php
     * class Site implements UserSiteInterface {
     *     public function __construct(UserSiteAPI $api) {
     *         ...
     *         $api->registerBlockRenderer("block-articles-listing");
     * ```
     *
     * 3. Custom block type (frontend)
     * ```
     * window.sivujetti.blockTypes.register('ArticlesListing', createListingBlockType({
     *     name: 'ArticlesListing',
     *     friendlyName: 'Article list',
     *     defaultRenderer: 'site:block-articles-listing',
     *     initialData: {
     *         listPageType: 'Pages',
     *         listFilters: JSON.stringify([{'categories.slug': 'news'}]),
     *     }
     * }));
     * ```
     *
     * @param {{name: String; friendlyName?: String; initialData: {listPageType?: String; listFilters: String;}; defaultRenderer: String;}} settings
     */
    return settings => {
        throwIfInvalidSettings(settings);
        //
        return {
            name: settings.name,
            friendlyName: settings.friendlyName || settings.name,
            ownPropNames: Object.keys(settings.initialData),
            initialData: {
                listPageType: settings.initialData.listPageType || 'Pages',
                listFilters: settings.initialData.listFilters,
            },
            defaultRenderer: settings.defaultRenderer,
            icon: settings.icon || 'layout-list',
            reRender(block, _) {
                return http.post('/api/blocks/render', {block: block.toRaw()}).then(resp => resp.result);
            },
            editForm: ListingBlockEditForm,
        };
    };
};
