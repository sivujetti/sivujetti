import EditForm from './ColumnsBlockEditForm.jsx';
import StylesEditForm from './ColumnsBlockVisualStylesEditForm.jsx';

export default {
    name: 'Columns',
    friendlyName: 'Columns',
    icon: 'layout-columns',
    editForm: EditForm,
    editFormType: 'content+user-styles',
    stylesEditForm: StylesEditForm,
    createOwnProps(/*defProps*/) {
        return {
            numColumns: null,
            takeFullWidth: null,
        };
    },
};
