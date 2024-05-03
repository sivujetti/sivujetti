import BlockDefaultStylesEditForm, {createPaddingVarDefs} from '../BlockVisualStylesEditForm.jsx';

class WrapperBlockEditForm extends preact.Component {
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    render() {
        return <p>Nothing to edit.</p>;
    }
}

/** @type {Array<VisualStylesFormVarDefinition>} */
const cssVarDefs = [
    ...createPaddingVarDefs('wrapper'),
];

class WrapperBlockVisualStylesEditForm extends BlockDefaultStylesEditForm {
    /**
     * @inheritdoc
     */
    createCssVarDefinitions() {
        return cssVarDefs;
    }
}

export default {
    name: 'Wrapper',
    friendlyName: 'Wrapper',
    icon: 'rectangle',
    editForm: WrapperBlockEditForm,
    stylesEditForm: WrapperBlockVisualStylesEditForm,
    createOwnProps(/*defProps*/) {
        return {
            dummy: '',
        };
    }
};
