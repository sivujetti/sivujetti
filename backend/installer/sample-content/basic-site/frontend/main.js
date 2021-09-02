import {__} from '@sivujetti-commons';
import createListingBlockType from '../../../../../frontend/edit-app/src/block-types/listing.js';

window.sivujetti.blockTypes.register('ServicesListing', createListingBlockType({
    name: 'ServicesListing',
    friendlyName: 'Services list',
    defaultRenderer: 'site:block-services-listing',
    initialData: {
        listPageType: 'Services',
        listFilters: JSON.stringify([]),
    }
}));
