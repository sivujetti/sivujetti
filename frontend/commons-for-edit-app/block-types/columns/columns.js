export default {
    name: 'Columns',
    friendlyName: 'Columns',
    icon: 'layout-columns',
    editForm: null,
    stylesEditForm: 'default',
    createOwnProps(/*defProps*/) {
        return {
            numColumns: null,
            takeFullWidth: null,
        };
    },
};
