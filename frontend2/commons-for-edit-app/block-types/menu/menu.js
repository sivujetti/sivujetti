import {__} from '../../edit-app-singletons.js';
import MenuBlockEditForm, {CountingLinkItemFactory} from './MenuBlockEditForm.jsx';
import MenuBlockDefaultStylesEditForm from './MenuStylesEditForm.jsx';

export default {
    name: 'Menu',
    friendlyName: 'Menu',
    icon: 'menu-2',
    editForm: MenuBlockEditForm,
    stylesEditForm: MenuBlockDefaultStylesEditForm,
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
