/** @extends {preact.Component<BlockEditFormProps<any>, any>} */
class RootSectionEditForm extends preact.Component {
    render() {
        return <div>todo</div>;
    }
}

export default {
    name: 'RootSection',
    friendlyName: 'Section',
    icon: 'rectangle',
    editForm: RootSectionEditForm,
    stylesEditForm: 'default',
    createOwnProps(/*defProps*/) {
        return {
            config: {},
        };
    }
};
