import ColumnsBlockEditForm from './ColumnsBlockEditForm.jsx';

export default {
    name: 'Columns',
    friendlyName: 'Columns',
    icon: 'layout-columns',
    editForm: ColumnsBlockEditForm,
    stylesEditForm: null,
    createOwnProps(/*defProps*/) {
        return {
            numColumns: 2,
            takeFullWidth: 1,
        };
    },
};
