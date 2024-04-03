import {__} from '../../edit-app-singletons.js';
import TextBlockEditForm from './TextBlockEditForm.jsx';
import TextBlockVisualStylesEditForm from './TextBlockVisualStylesEditForm.jsx';

export default {
    name: 'Text',
    friendlyName: 'Text',
    icon: 'blockquote',
    editForm: TextBlockEditForm,
    stylesEditForm: TextBlockVisualStylesEditForm,
    createOwnProps(/*defProps*/) {
        return {
            html: `<p>${__('Text content')}.</p>`,
        };
    }
};
