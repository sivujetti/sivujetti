import ColumnsEditForm from './ColumnsEditForm.jsx';

export default {
    name: 'Columns',
    friendlyName: 'Columns',
    icon: 'layout-columns',
    editForm: window.sivujettiUserFlags?.useInContextEditing ? ColumnsEditForm : null,
    stylesEditForm: 'default',
    createOwnProps(/*defProps*/) {
        return {
            numColumns: null,
            takeFullWidth: null,
            isRow: 0,
            config: {},
        };
    },
};
