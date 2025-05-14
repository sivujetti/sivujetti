export default {
    name: 'Wrapper',
    friendlyName: 'Wrapper',
    icon: 'box-model-2',
    editForm: 'default',
    stylesEditForm: 'default',
    createOwnProps(/*defProps*/) {
        return {
            isCell: 0,
        };
    }
};
