import {blockTypesRegister} from './edit-app-singletons.js';
import buttonBlockType from './block-types/button/button.js';
import columns2BlockType from './block-types/columns2/columns2.js';
import imageBlockType from './block-types/image/image.js';
import menuBlockType from './block-types/menu/menu.js';
import textBlockType from './block-types/text/text.js';

blockTypesRegister.setup([
    ['Button',               buttonBlockType],
    ['Columns2',             columns2BlockType],
    ['GlobalBlockReference', {name: 'GlobalBlockReference', friendlyName: 'GlobalBlockReference'}],
    ['Image',                imageBlockType],
    ['Menu',                 menuBlockType],
    ['PageInfo',             {name: 'PageInfo', friendlyName: 'PageInfo'}],
    ['Section',              {name: 'Section', friendlyName: 'Section'}],
    ['Text',                 textBlockType],
]);
