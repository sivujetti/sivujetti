import columns2BlockType from './block-types/columns2.js';

const editAppBlockTypes = new Map;

editAppBlockTypes.set('Columns2', columns2BlockType);

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
