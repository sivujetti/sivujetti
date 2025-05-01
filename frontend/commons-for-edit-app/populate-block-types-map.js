import {blockTypesRegister} from './edit-app-singletons.js';
import buttonBlockType from './block-types/button/button.js';
import codeBlockType from './block-types/code/code.js';
import columnsBlockType from './block-types/columns/columns.js';
import placeholderBlockType from './block-types/placeholder/placeholder.js';
import imageBlockType from './block-types/image/image.js';
import listingBlockType from './block-types/listing/listing.js';
import menuBlockType from './block-types/menu/menu.js';
import pageInfoBlockType from './block-types/page-info/pageInfo.js';
import rootSectionBlockType from './block-types/root-section/root-section.js';
import sectionBlockType from './block-types/section/section.js';
import textBlockType from './block-types/text/text.js';
import wrapperBlockType from './block-types/wrapper.js';

blockTypesRegister.setup([
    [buttonBlockType.name,      buttonBlockType],
    [codeBlockType.name,        codeBlockType],
    [columnsBlockType.name,     columnsBlockType],
    [placeholderBlockType.name, placeholderBlockType],
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
    [imageBlockType.name,       imageBlockType],
    [listingBlockType.name,     listingBlockType],
    [menuBlockType.name,        menuBlockType],
    [pageInfoBlockType.name,    pageInfoBlockType],
    [rootSectionBlockType.name, rootSectionBlockType],
    [sectionBlockType.name,     sectionBlockType],
    [textBlockType.name,        textBlockType],
    [wrapperBlockType.name,     wrapperBlockType],
]);
