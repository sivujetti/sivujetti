import {__} from '../../edit-app-singletons.js';
import EditForm from './TextBlockEditForm.jsx';

export default {
    name: 'Text',
    friendlyName: 'Text',
    icon: 'blockquote',
    editForm: EditForm,
    stylesEditForm: 'default',
    createOwnProps(/*defProps*/) {
        return {
            html: `<p>${__('Text content')}.</p>`,
        };
    }
};
