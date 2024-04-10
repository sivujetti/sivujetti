import {__} from '../../edit-app-singletons.js';
import EditForm from './TextBlockEditForm.jsx';
import StylesEditForm from './TextBlockVisualStylesEditForm.jsx';

export default {
    name: 'Text',
    friendlyName: 'Text',
    icon: 'blockquote',
    editForm: EditForm,
    stylesEditForm: StylesEditForm,
    createOwnProps(/*defProps*/) {
        return {
            html: `<p>${__('Text content')}.</p>`,
        };
    }
};
