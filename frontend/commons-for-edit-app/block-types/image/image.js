import EditForm from './ImageBlockEditForm.jsx';
import StylesEditForm from './ImageBlockVisualStylesEditForm.jsx';

/**
 * @typedef ImageBlockProps
 * @prop {String} src
 * @prop {String} altText
 * @prop {String} caption
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
