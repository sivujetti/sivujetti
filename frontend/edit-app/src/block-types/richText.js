import {__} from '@sivujetti-commons';

class RichTextBlockEditForm extends preact.Component {
    render() {
        return <div>todo</div>;
    }
}

export default () => {
    const initialData = {html: `<p>${__('Formatted text')}</p>`};
    return {
        name: 'RichText',
        friendlyName: 'Rich text',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        reRender({html}, renderChildren) {
            return `${html}${renderChildren()}`;
        },
        editForm: RichTextBlockEditForm,
    };
};
