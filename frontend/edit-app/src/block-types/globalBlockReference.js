import {http, __} from '../commons/main.js';

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
        editForm: GlobalBlockReferenceBlockEditForm,
    };
};
export {EMPTY_OVERRIDES};
