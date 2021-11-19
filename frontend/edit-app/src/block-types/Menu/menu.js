import {http, __} from '@sivujetti-commons';
import MenuBlockEditForm, {makeLinkItem} from './EditForm.jsx';
import {markInternalLinksAsInternal} from '../../../../shared.js';

export default () => {
    const initialData = {
        tree: JSON.stringify([makeLinkItem({slug: '/', text: __('Home')}),
                              makeLinkItem({slug: '/about', text: __('About')})]),
        wrapStart: '',   // "<nav class=\"menu\">"
        wrapEnd: '',     // "</nav>"
        treeStart: '',   // "<ul>"
        treeEnd: '',     // "</ul>"
        itemAttrs: '[]', // "[]"
        itemEnd: '',     // "</li>"
    };
    return {
        name: 'Menu',
        friendlyName: 'Menu',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-menu',
        reRender(block, _renderChildren) {
            return http.post('/api/blocks/render', {block}).then(resp => {
                const el = document.createElement('div');
                el.innerHTML = resp.result;
                markInternalLinksAsInternal(el);
                return el.innerHTML;
            });
        },
        editForm: MenuBlockEditForm,
    };
};
