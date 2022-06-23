import {api} from '@sivujetti-commons-for-edit-app';
import {generatePushID} from '../commons/utils.js';
import blockTreeUtils from '../blockTreeUtils.js';

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

/**
 * @param {RawBlock2|String} blockOrBlockId
 * @param {Array<RawBlock2>} tree
 * @returns {Boolean}
 */
function isTreesOutermostBlock(blockOrBlockId, tree) {
    return (typeof blockOrBlockId === 'string' ? blockOrBlockId : blockOrBlockId.id) === tree[0].id;
}

/**
 * @param {RawBlock2} innerTreeBlock
 * @param {Array<RawBlock2>} tree
 * @returns {RawBlock2} {type: 'GlobalBlockReference'}
 */
function findRefBlockOf(innerTreeBlock, tree) {
    const trid = innerTreeBlock.isStoredToTreeId;
    return blockTreeUtils.findRecursively(tree, block =>
        block.type === 'GlobalBlockReference' && block.globalBlockTreeId === trid
    );
}

/**
 * @param {RawBlock2} block
 * @returns {{[key: String]: any;}}
 */
function temp(block) {
    const clone = JSON.parse(JSON.stringify(block));
    for (const key in clone) {
        if (key.startsWith('__'))// || key === 'propsData')
            delete clone[key];
    }
    return clone;
}

/**
 * @param {Array<RawBlock2>} tree
 * @returns {Array<{[key: String]: any;}>}
 */
function treeToTransferable(tree) {
    return blockTreeUtils.mapRecursivelyManual(tree, (b, _i, children) => {
        b.children = children;
        return temp(b);
    });
}

export {createBlockFromType, isTreesOutermostBlock, findRefBlockOf,
        treeToTransferable};
