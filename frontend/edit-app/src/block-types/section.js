import {__, urlUtils} from '@sivujetti-commons';

class SectionBlockEditForm extends preact.Component {
    render() {
        return <div>todo</div>;
    }
}

const initialData = {cssClass: '', bgImage: ''};

export default {
    name: 'Section',
    friendlyName: 'Section',
    ownPropNames: Object.keys(initialData),
    initialData,
    defaultRenderer: 'sivujetti:block-generic-wrapper',
    reRender({cssClass, bgImage}, renderChildren) {
        return `<section${cssClass? ` class="${cssClass}"` : ''}` +
            (bgImage ? ` style="background-image:url('${urlUtils.makeAssetUrl(bgImage)}')"` : '') +
            '>' +
            renderChildren() +
        '</section>';
    },
    editForm: SectionBlockEditForm,
};
