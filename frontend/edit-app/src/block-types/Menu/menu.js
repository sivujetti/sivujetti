import {http, __} from '../../commons/main.js';
import MenuBlockEditForm, {makeLinkItem} from './EditForm.jsx';

export default () => {
    const initialData = {
        tree: JSON.stringify([makeLinkItem({slug: '/', text: __('Home')}),
                              makeLinkItem({slug: '/about', text: __('About')})]),
        wrapStart: '<nav class="menu"><div>',
        wrapEnd:   '</div></nav>',
        treeStart: '<ul class="level-{depth}">',
        treeEnd:   '</ul>',
        // Example. '<li class="level-0" data-current>'
        itemStart: '<li class="level-{depth}"{current}>',
        itemAttrs: '[]',
        itemEnd:   '</li>'
    };
    return {
        name: 'Menu',
        friendlyName: 'Menu',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-menu',
        icon: 'menu-2',
        reRender(block, _renderChildren) {
            return http.post('/api/blocks/render', {block}).then(resp => {
                const el = document.createElement('div');
                el.innerHTML = resp.result;
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
        editForm: MenuBlockEditForm,
    };
};
