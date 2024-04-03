import {blockTypesRegister} from './edit-app-singletons.js';
import buttonBlockType from './block-types/button/button.js';
import columnsBlockType from './block-types/columns/columns.js';
import imageBlockType from './block-types/image/image.js';
import listingBlockType from './block-types/listing/listing.js';
import menuBlockType from './block-types/menu/menu.js';
import pageInfoBlockType from './block-types/page-info/pageInfo.js';
import sectionBlockType from './block-types/section/section.js';
import section2BlockType from './block-types/section2/section2.js';
import textBlockType from './block-types/text/text.js';
import wrapperBlockType from './block-types/wrapper.js';

blockTypesRegister.setup([
    ['GlobalBlockReference', {name: 'GlobalBlockReference', friendlyName: 'GlobalBlockReference'}],
    [buttonBlockType.name,   buttonBlockType],
    [columnsBlockType.name,  columnsBlockType],
    [imageBlockType.name,    imageBlockType],
    [listingBlockType.name,  listingBlockType],
    [menuBlockType.name,     menuBlockType],
    [pageInfoBlockType.name, pageInfoBlockType],
    [sectionBlockType.name,  sectionBlockType],
    [section2BlockType.name, section2BlockType],
    [textBlockType.name,     textBlockType],
    [wrapperBlockType.name,  wrapperBlockType],
]);
