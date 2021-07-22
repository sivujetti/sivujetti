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
    defaultRenderer: 'kuura:block-generic-wrapper',
    reRender({cssClass, children}) {
        return `<div class="${cssClass || 'columns'}"` +
            (children ? children.map(b => b.reRender(b)) : '') +
        '</div>';
    },
    editForm: ColumnsBlockEditForm,
};
