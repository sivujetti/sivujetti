export default {
    name: 'Columns',
    friendlyName: 'Columns',
    initialData: {cssClass: 'columns'},
    defaultRenderer: 'kuura:block-generic-wrapper',
    reRender({cssClass, children}) {
        return `<div class="${cssClass || 'columns'}"` +
            (children ? children.map(b => b.reRender(b)) : '') +
        '</div>';
    }
};
