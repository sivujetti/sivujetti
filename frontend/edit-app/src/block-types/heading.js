import {__} from '../../../commons/main.js';

export default {
    name: 'Heading',
    friendlyName: 'Heading',
    initialData: {text: __('Text here'), level: 2},
    defaultRenderer: 'kuura:block-auto',
    reRender({level, text}) {
        return `<h${level}>${text}</h${level}>`;
    }
};
