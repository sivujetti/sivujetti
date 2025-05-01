export default {
    name: 'ContentOrRowPlaceholder',
    friendlyName: 'Content or row placeholder',
    icon: 'box',
    editForm: null,
    stylesEditForm: 'default',
    createOwnProps(/*defProps*/) {
        return {
            outerBlockType: 'RootSection',
        };
    }
};
