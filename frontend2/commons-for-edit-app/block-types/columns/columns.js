export default {
    name: 'Columns',
    friendlyName: 'Columns',
    icon: 'layout-columns',
    editForm: null,
    stylesEditForm: 'auto',
    createOwnProps(/*defProps*/) {
        return {
            numColumns: null,
            takeFullWidth: null,
        };
    },
};
