import SectionBlockEditForm from './SectionBlockEditForm.jsx';

export default {
    name: 'Section',
    friendlyName: 'Section',
    icon: 'layout-rows',
    editForm: SectionBlockEditForm,
    stylesEditForm: null,
    createOwnProps(/*defProps*/) {
        return {
            bgImage: '',
        };
    },
};
