import Section2CombinedBlockAndStylesEditForm from './Section2CombinedBlockAndStylesEditForm.jsx';

export default {
    name: 'Section2',
    friendlyName: 'Section',
    icon: 'columns-3',
    editForm: Section2CombinedBlockAndStylesEditForm,
    editFormType: 'content+user-styles',
    createOwnProps(/*defProps*/) {
        return {
            columns: [
                [{align: null, width: '1fr', isVisible: true}], // *
                null,                                           // lg
                null,                                           // md
                null,                                           // sm
                null                                            // xs
            ],
            settings: {
                innerBg: null,
                outerBg: null,
            },
        };
    },
};
