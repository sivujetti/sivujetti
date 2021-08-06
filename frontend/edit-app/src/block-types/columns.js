import {__} from '@sivujetti-commons';

class ColumnsBlockEditForm extends preact.Component {
    render() {
        return <div>todo</div>;
    }
}

const initialData = {cssClass: 'columns'};

export default {
    name: 'Columns',
    friendlyName: 'Columns',
    ownPropNames: Object.keys(initialData),
    initialData,
    defaultRenderer: 'sivujetti:block-generic-wrapper',
    reRender({cssClass}, renderChildren) {
        return `<div class="${cssClass || 'columns'}">${renderChildren()}</div>`;
    },
    editForm: ColumnsBlockEditForm,
};
