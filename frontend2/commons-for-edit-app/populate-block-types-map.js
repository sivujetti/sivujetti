import {blockTypesRegister} from './edit-app-singletons.js';
import columns2BlockType from './block-types/columns2/columns2.js';
import menuBlockType from './block-types/menu/menu.js';
blockTypesRegister.setup([
    ['Columns2',             columns2BlockType],
    ['GlobalBlockReference', {name: 'GlobalBlockReference', friendlyName: 'GlobalBlockReference'}],
    ['Menu',                 menuBlockType],
    ['PageInfo',             {name: 'PageInfo', friendlyName: 'PageInfo'}],
    ['Section',              {name: 'Section', friendlyName: 'Section'}],
]);
