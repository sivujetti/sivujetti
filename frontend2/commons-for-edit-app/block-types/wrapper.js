class WrapperBlockEditForm extends preact.Component {
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    render() {
        return <p>Nothing to edit.</p>;
    }
}

export default {
    name: 'Wrapper',
    friendlyName: 'Wrapper',
    icon: 'rectangle',
    editForm: WrapperBlockEditForm,
    stylesEditForm: null,
    createOwnProps(/*defProps*/) {
        return {
            dummy: '',
        };
    }
};
