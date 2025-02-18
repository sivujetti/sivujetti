import {__} from '../../edit-app-singletons.js';
import EditForm from './CodeBlockEditForm.jsx';

export default {
    name: 'Code',
    friendlyName: 'Code',
    icon: 'code',
    editForm: EditForm,
    stylesEditForm: 'default',
    createOwnProps(/*defProps*/) {
        return {
            code: ''
        };
    }
};
