import EditForm from './SectionBlockEditForm.jsx';
import StylesEditForm from './SectionBlockVisualStylesEditForm.jsx';

export default {
    name: 'Section',
    friendlyName: 'Section',
    icon: 'layout-rows',
    editForm: EditForm,
    stylesEditForm: StylesEditForm,
    createOwnProps(/*defProps*/) {
        return {
            bgImage: '',
        };
    },
};
