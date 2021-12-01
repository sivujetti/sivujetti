import {__} from '../commons/main.js';

class ColumnsBlockEditForm extends preact.Component {
    render() {
        return <div>todo</div>;
    }
}

export default () => {
    const initialData = {cssClass: 'columns'};
        return {
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
};
