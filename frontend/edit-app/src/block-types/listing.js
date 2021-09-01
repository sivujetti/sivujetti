import {__, http} from '@sivujetti-commons';
import webPageIframe from '../webPageIframe.js';

class ListingBlockEditForm extends preact.Component {
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    render({block}) {
        return <div><a href="" onClick={ e => (e.preventDefault(), webPageIframe.openPlaceholderPage(block.listPageType)) }>{ __('Add new %s', block.listPageType) }</a></div>;
    }
}

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
export default settings => {
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
        reRender(block, _) {
            return http.post('/api/blocks/render', {block: block.toRaw()}).then(resp => resp.result);
        },
        editForm: ListingBlockEditForm,
    };
};

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
