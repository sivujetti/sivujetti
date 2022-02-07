import {__, api} from '@sivujetti-commons-for-edit-app';
import createListingBlockType from '../../../../../frontend/edit-app/src/block-types/listing.js';

api.blockTypes.register('ServicesListing', () =>
    createListingBlockType({
        name: 'ServicesListing',
        friendlyName: 'Services list',
        defaultRenderer: 'site:block-services-listing',
        initialData: {
            listPageType: 'Services',
            listFilters: JSON.stringify([]),
        }
    })
);
