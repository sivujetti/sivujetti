import {http, __} from '@sivujetti-commons';

class GlobalBlockReferenceBlockEditForm extends preact.Component {
    render({block}) {
        return <p>todo</p>;
    }
}

export default () => {
    const initialData = {globalBlockTreeId: '1'};
    return {
        name: 'GlobalBlockReference',
        friendlyName: 'Global block reference',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        reRender(block, _renderChildren) {
            return http.post('/api/blocks/render', {block: block.toRaw()}).then(resp => resp.result);
        },
        editForm: GlobalBlockReferenceBlockEditForm,
    };
};
