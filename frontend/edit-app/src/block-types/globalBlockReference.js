import {http, __} from '@sivujetti-commons-for-edit-app';

const EMPTY_OVERRIDES = '{}';

class GlobalBlockReferenceBlockEditForm extends preact.Component {
    render() {
        return <p>dummy</p>;
    }
}

export default () => {
    const initialData = {
        globalBlockTreeId: '1',
        overrides: EMPTY_OVERRIDES,
        useOverrides: 0,
    };
    return {
        name: 'GlobalBlockReference',
        friendlyName: 'Global block reference',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        reRender(block, _renderChildren) {
            return http.post('/api/blocks/render', {block: block.toRaw()}).then(resp => resp.result);
        },
        createSnapshot: from => ({
            globalBlockTreeId: from.globalBlockTreeId,
            overrides: from.overrides,
            useOverrides: from.useOverrides,
        }),
        editForm: GlobalBlockReferenceBlockEditForm,
    };
};
export {EMPTY_OVERRIDES};
