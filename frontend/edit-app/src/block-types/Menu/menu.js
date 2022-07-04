import {http, __} from '@sivujetti-commons-for-edit-app';
import MenuBlockEditForm, {MenuBlockEditForm2, CountingLinkItemFactory} from './EditForm.jsx';

export default () => {
    const linkCreator = new CountingLinkItemFactory;
    const name = 'Menu';
    const initialData = {
        tree: JSON.stringify([linkCreator.makeLinkItem({slug: '/', text: __('Home')}),
                              linkCreator.makeLinkItem({slug: '/about', text: __('About')})]),
        wrapStart: '<nav class="nav"{defaultAttrs}><div data-block-root>',
        wrapEnd:   '</div></nav>',
        treeStart: '<ul class="level-{depth}">',
        treeEnd:   '</ul>',
        // Example. '<li class="level-0" data-current>'
        itemStart: '<li class="level-{depth}"{current}>',
        itemAttrs: '[]',
        itemEnd:   '</li>'
    };
    return {
        name,
        friendlyName: 'Menu',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-menu',
        icon: 'menu-2',
        reRender(block, _renderChildren) {
            return http.post('/api/blocks/render', {block}).then(resp => {
                const el = document.createElement('div');
                el.innerHTML = resp.result;
                const root = el.firstElementChild;
                if (!root.getAttribute('data-block-type'))
                    root.setAttribute('data-block-type', name);
                if (!root.getAttribute('data-block'))
                    root.setAttribute('data-block', block.id);
                return el.innerHTML;
            });
        },
        createSnapshot: from => ({
            tree: from.tree,
            wrapStart: from.wrapStart,
            wrapEnd: from.wrapEnd,
            treeStart: from.treeStart,
            treeEnd: from.treeEnd,
            itemStart: from.itemStart,
            itemAttrs: from.itemAttrs,
            itemEnd: from.itemEnd,
        }),
        // @featureFlagConditionUseReduxBlockTree
        editForm: !window.useReduxBlockTree ? MenuBlockEditForm : MenuBlockEditForm2,
    };
};
