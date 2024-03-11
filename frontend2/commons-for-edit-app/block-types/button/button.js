import {__} from '../../internal-wrapper.js';
import ButtonBlockEditForm from './ButtonBlockEditForm.jsx';
import ButtonBlockDefaultStylesEditForm from './ButtonStylesEditForm.jsx';

export default {
    name: 'Button',
    friendlyName: 'Button',
    icon: 'hand-finger',
    editForm: ButtonBlockEditForm,
    stylesEditForm: ButtonBlockDefaultStylesEditForm,
    createOwnProps(/*defProps*/) {
        return {
            html: __('Button text'),
            linkTo: '/',
            tagType: 'link',
        };
    }
};
