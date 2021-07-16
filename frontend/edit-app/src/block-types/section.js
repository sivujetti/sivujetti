import {urlUtils} from '../../../commons/utils.js';

export default {
    name: 'Section',
    friendlyName: 'Section',
    initialData: {cssClass: '', bgImage: ''},
    defaultRenderer: 'kuura:block-generic-wrapper',
    reRender({cssClass, bgImage, children}) {
        return `<section class="${cssClass}"` +
            (bgImage ? ` style="background-image:url('${urlUtils.makeAssetUrl(bgImage)}')"` : '') +
            '>' +
            (children ? children.map(b => b.reRender(b)) : '') +
        '</section>';
    }
};
