import {__} from '@kuura-commons';

class HeadingBlockEditForm extends preact.Component {
    render() {
        return <div>todo</div>;
    }
}

const initialData = {text: __('Text here'), level: 2, cssClass: ''};

export default {
    name: 'Heading',
    friendlyName: 'Heading',
    ownPropNames: Object.keys(initialData),
    initialData,
    defaultRenderer: 'kuura:block-auto',
    reRender({level, text, cssClass}, renderChildren) {
        return `<h${level}${cssClass? ` class="${cssClass}"` : ''}>${text}${renderChildren()}</h${level}>`;
    },
    editForm: HeadingBlockEditForm,
};
