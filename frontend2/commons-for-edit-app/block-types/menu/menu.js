import {__} from '../../edit-app-singletons.js';
import EditForm, {CountingLinkItemFactory} from './MenuBlockEditForm.jsx';
import StylesEditForm from './MenuBlockVisualStylesEditForm.jsx';

export default {
    name: 'Menu',
    friendlyName: 'Menu',
    icon: 'menu-2',
    editForm: EditForm,
    stylesEditForm: StylesEditForm,
    createOwnProps(/*defProps*/) {
        const linkCreator = new CountingLinkItemFactory;
        return {
            tree: [
                linkCreator.makeLinkItem({slug: '/', text: __('Home')}),
                linkCreator.makeLinkItem({slug: '/about', text: __('About')})
            ],
            wrapEl: 'nav',
            treeEl: 'ul',
            treeItemEl: 'li',
        };
    },
};
