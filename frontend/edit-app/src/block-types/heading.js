import {__} from '../../../commons/main.js';

class HeadingBlockEditForm extends preact.Component {
    render() {
        return <div>todo</div>;
    }
}

const initialData = {text: __('Text here'), level: 2};

export default {
    name: 'Heading',
    friendlyName: 'Heading',
    ownPropNames: Object.keys(initialData),
    initialData,
    defaultRenderer: 'kuura:block-auto',
    reRender({level, text}) {
        return `<h${level}>${text}</h${level}>`;
    },
    EditForm: HeadingBlockEditForm,
};
