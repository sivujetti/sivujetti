import EditForm from './SectionBlockEditForm.jsx';
import StylesEditForm from './SectionBlockVisualStylesEditForm.jsx';

export default {
    name: 'Section',
    friendlyName: 'Section',
    icon: 'layout-rows',
    editForm: EditForm,
    editFormType: 'content+user-styles',
    stylesEditForm: StylesEditForm,
    createOwnProps(/*defProps*/) {
        return {
            bgImage: null,
        };
    },
};
