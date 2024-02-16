import {__} from '../../internal-wrapper.js';
import TextBlockEditForm from './TextBlockEditForm.jsx';
import TextBlockDefaultStylesEditForm from './TextStylesEditForm.jsx';

export default {
    name: 'Text',
    friendlyName: 'Text',
    icon: 'blockquote',
    editForm: TextBlockEditForm,
    stylesEditForm: TextBlockDefaultStylesEditForm,
    createOwnProps(/*defProps*/) {
        return {
            html: [{el: 'p', attrs: [], 'children': [`${__('Text content')}.`]}],
        };
    }
};
