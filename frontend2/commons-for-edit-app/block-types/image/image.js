import ImageBlockEditForm from './ImageBlockEditForm.jsx';
import ImageBlockDefaultStylesEditForm from './ImageStylesEditForm.jsx';

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
    editForm: ImageBlockEditForm,
    stylesEditForm: ImageBlockDefaultStylesEditForm,
    createOwnProps(/*defProps*/) {
        return {
            src: null,
            altText: '',
            caption: '',
        };
    }
};



