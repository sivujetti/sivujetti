import {api} from '@sivujetti-commons-for-edit-app';
import {generatePushID} from '../commons/utils.js';

/**
 * @param {BlockType|String} blockType
 * @param {String} trid = 'main'
 * @param {String} id = generatePushID()
 * @returns {RawBlock2}
 */
function createBlockFromType(blockType, trid = 'main', id = generatePushID()) {
    blockType = typeof blockType !== 'string' ? blockType : api.blockTypes.get(blockType);
    const typeSpecific = createOwnData(blockType);
    return Object.assign({
        id,
        type: blockType.name,
        title: '',
        renderer: blockType.defaultRenderer,
        isStoredTo: trid === 'main' ? 'page' : 'globalBlockTree',
        isStoredToTreeId: trid,
        children: []
    }, typeSpecific);
}

/**
 * @param {BlockType} blockType
 * @returns {{[key: String]: any;}}
 */
function createOwnData(blockType) {
    const flat = {};
    const asMetaArr = [];
    for (const key of blockType.ownPropNames) {
        flat[key] = blockType.initialData[key];
        asMetaArr.push({key, value: flat[key]});
    }
    return Object.assign(flat, {propsData: asMetaArr});
}

export {createBlockFromType};
