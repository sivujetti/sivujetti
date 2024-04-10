import {__} from '../../edit-app-singletons.js';
import EditForm from './ButtonBlockEditForm.jsx';
import StylesEditForm from './ButtonBlockVisualStylesEditForm.jsx';

export default {
    name: 'Button',
    friendlyName: 'Button',
    icon: 'hand-finger',
    editForm: EditForm,
    stylesEditForm: StylesEditForm,
    createOwnProps(/*defProps*/) {
        return {
            html: __('Button text'),
            linkTo: '/',
            tagType: 'link',
        };
    }
};
