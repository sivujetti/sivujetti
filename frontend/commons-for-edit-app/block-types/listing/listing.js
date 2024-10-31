import {__} from '../../edit-app-singletons.js';
import EditForm from './ListingBlockEditForm.jsx';
import StylesEditForm from './ListingBlockVisualStylesEditForm.jsx';
/** @typedef {import('./ListingBlockEditForm.jsx').RendererSettings} RendererSettings */

/**
 * @typedef ListingBlockProps
 * @prop {string} filterPageType
 * @prop {number} filterLimit
 * @prop {'all'|'single'|'atMost'} filterLimitType
 * @prop {'desc'|'asc'|'rand'} filterOrder
 * @prop {Object} filterAdditional
 * @prop {RendererSettings|null} rendererSettings
 */

export default {
    name: 'Listing',
    friendlyName: 'Listing',
    icon: 'layout-list',
    editForm: EditForm,
    stylesEditForm: 'default',
    createOwnProps(/*defProps*/) {
        return {
            filterPageType: 'Pages',
            filterLimit: 0,
            filterLimitType: 'all',
            filterOrder: 'desc',
            filterAdditional: {
                tokens: [],
                paramMap: {},
            },
            rendererSettings: {parts: [
                {kind: 'heading', data: {level: 2}},
                {kind: 'link', data: {text: 'Read more'}},
            ]},
        };
    },
    defaultRenderer: 'sivujetti:block-listing-pages-default',
};
