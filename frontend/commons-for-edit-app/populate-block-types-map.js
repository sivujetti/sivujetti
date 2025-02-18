import {blockTypesRegister} from './edit-app-singletons.js';
import buttonBlockType from './block-types/button/button.js';
import codeBlockType from './block-types/code/code.js';
import columnsBlockType from './block-types/columns/columns.js';
import imageBlockType from './block-types/image/image.js';
import listingBlockType from './block-types/listing/listing.js';
import menuBlockType from './block-types/menu/menu.js';
import pageInfoBlockType from './block-types/page-info/pageInfo.js';
import sectionBlockType from './block-types/section/section.js';
import textBlockType from './block-types/text/text.js';
import wrapperBlockType from './block-types/wrapper.js';

blockTypesRegister.setup([
    [buttonBlockType.name,   buttonBlockType],
    [codeBlockType.name,     codeBlockType],
    [columnsBlockType.name,  columnsBlockType],
    ['GlobalBlockReference', {
        name: 'GlobalBlockReference',
        friendlyName: 'GlobalBlockReference',
        createOwnProps(_defProps) {
            return {
                globalBlockTreeId: '',
                overrides: '{}',
                useOverrides: 0,
            };
        }
    }],
    [imageBlockType.name,    imageBlockType],
    [listingBlockType.name,  listingBlockType],
    [menuBlockType.name,     menuBlockType],
    [pageInfoBlockType.name, pageInfoBlockType],
    [sectionBlockType.name,  sectionBlockType],
    ['Section2', {
        name: 'Section2',
        friendlyName: 'Section2',
        icon: 'columns-3',
        editForm: class extends preact.Component {
            render() { return 'Section2 is deprecated'; }
        },
        stylesEditForm: 'default',
        createOwnProps(/*defProps*/) {
            return {dum: 'my',};
        },
    }],
    [textBlockType.name,     textBlockType],
    [wrapperBlockType.name,  wrapperBlockType],
]);
