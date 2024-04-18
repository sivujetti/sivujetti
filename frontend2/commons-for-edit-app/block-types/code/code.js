import {__} from '../../edit-app-singletons.js';
import EditForm from './CodeBlockEditForm.jsx';
import StylesEditForm from './CodeBlockVisualStylesEditForm.jsx';

export default {
    name: 'Code',
    friendlyName: 'Code',
    icon: 'code',
    editForm: EditForm,
    stylesEditForm: StylesEditForm,
    createOwnProps(/*defProps*/) {
        return {
            code: ''
        };
    }
};
