import {__} from '../../../commons/main.js';

export default {
    name: 'Paragraph',
    friendlyName: 'Paragraph',
    initialData: {text: __('Text here')},
    defaultRenderer: 'kuura:block-auto',
    reRender(block) {
        return `<p>${block.text}</p>`;
    }
};
