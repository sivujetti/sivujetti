import {__, http} from '@sivujetti-commons-for-edit-app';
import ListingBlockEditForm from './EditForm.jsx';
import {toTransferable} from '../../Block/utils.js';

export default () => {
    const initialData = {
        filterPageType: 'Pages',
        filterLimit: 0,
        filterLimitType: 'all',
        filterOrder: 'desc',
        filterAdditional: '{}',
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
            return http.post('/api/blocks/render', {block: toTransferable(block)}).then(resp => resp.result);
        },
        createSnapshot: from => ({
            filterPageType: from.filterPageType,
            filterLimit: from.filterLimit,
            filterLimitType: from.filterLimitType,
            filterOrder: from.filterOrder,
            filterAdditional: from.filterAdditional,
            renderWith: from.renderer,
        }),
        editForm: ListingBlockEditForm,
    };
};

/**
 * @typedef Snapshot
 * @prop {String} filterPageType e.g. "Services"
 * @prop {Number} filterLimit e.g. 0, 20
 * @prop {'all'|'single'|'atMost'} filterLimitType
 * @prop {'desc'|'asc'|'rand'} filterOrder
 * @prop {String} filterAdditional e.g. "{"p.slug":{"$startsWith":"/blog/"}}"
 * @prop {String} renderWith e.g. "site:block-services-listing"
 */
