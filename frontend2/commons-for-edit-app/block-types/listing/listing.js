import {__} from '../../edit-app-singletons.js';
import ListingBlockEditForm from './ListingBlockEditForm.jsx';
import ListingBlockDefaultStylesEditForm from './ListingStylesEditForm.jsx';

/**
 * @typedef ListingBlockProps
 * @prop {String} filterPageType
 * @prop {Number} filterLimit
 * @prop {'all'|'single'|'atMost'} filterLimitType
 * @prop {'desc'|'asc'|'rand'} filterOrder
 * @prop {Object} filterAdditional
 */

export default {
    name: 'Listing',
    friendlyName: 'Listing',
    icon: 'layout-list',
    editForm: ListingBlockEditForm,
    stylesEditForm: ListingBlockDefaultStylesEditForm,
    createOwnProps(/*defProps*/) {
        return {
            filterPageType: 'Pages',
            filterLimit: 0,
            filterLimitType: 'all',
            filterOrder: 'desc',
            filterAdditional: {},
        };
    },
    defaultRenderer: 'sivujetti:block-listing-pages-default',
};
