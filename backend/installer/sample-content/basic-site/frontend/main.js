import {__} from '@sivujetti-commons-for-edit-app';
import createListingBlockTypeCreator from '../../../../../frontend/edit-app/src/block-types/listing.js';

window.sivujetti.blockTypes.register('ServicesListing', createListingBlockTypeCreator({
    name: 'ServicesListing',
    friendlyName: 'Services list',
    defaultRenderer: 'site:block-services-listing',
    initialData: {
        listPageType: 'Services',
        listFilters: JSON.stringify([]),
    }
}));
