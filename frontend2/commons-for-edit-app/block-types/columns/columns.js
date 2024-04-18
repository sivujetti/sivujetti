import EditForm from './ColumnsBlockEditForm.jsx';
import StylesEditForm from './ColumnsBlockVisualStylesEditForm.jsx';

export default {
    name: 'Columns',
    friendlyName: 'Columns',
    icon: 'layout-columns',
    editForm: EditForm,
    stylesEditForm: StylesEditForm,
    createOwnProps(/*defProps*/) {
        return {
            numColumns: 2,
            takeFullWidth: 1,
        };
    },
};
