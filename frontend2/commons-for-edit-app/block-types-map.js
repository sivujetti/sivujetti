import columns2BlockType from './block-types/columns2/columns2.js';
import menuBlockType from './block-types/menu/menu.js';

const editAppBlockTypes = new Map;

editAppBlockTypes.set('Columns2', columns2BlockType);
editAppBlockTypes.set('Menu', menuBlockType);

/**
 * @param {BlockType|String} blockType
 * @param {String} fallback = 'box'
 * @returns {String} Icon for $blockTypeName, or $fallBack
 */
function blockTypeGetIconId(blockType, fallback = 'box') {
    return (typeof blockType === 'string' ? editAppBlockTypes.get(blockType) : blockType).icon || fallback;
}

export default editAppBlockTypes;
export {blockTypeGetIconId};
