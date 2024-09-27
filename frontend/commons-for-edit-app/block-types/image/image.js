import EditForm from './ImageBlockEditForm.jsx';
import StylesEditForm from './ImageBlockVisualStylesEditForm.jsx';

/**
 * @typedef ImageBlockProps
 * @prop {string} src
 * @prop {string} altText
 * @prop {string} caption
 */

export default {
    name: 'Image',
    friendlyName: 'Image',
    icon: 'photo',
    editForm: EditForm,
    stylesEditForm: 'default',
    createOwnProps(/*defProps*/) {
        return {
            src: null,
            altText: '',
            caption: '',
        };
    }
};
