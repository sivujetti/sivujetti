import {api} from '@sivujetti-commons-for-edit-app';
import {generatePushID} from '../commons/utils.js';
import blockTreeUtils from '../blockTreeUtils.js';

/**
 * @param {BlockType|String} blockType
 * @param {String} trid = 'main'
 * @param {String} id = generatePushID()
 * @param {{[key: String]: any;}} props = null
 * @returns {RawBlock2}
 */
function createBlockFromType(blockType, trid = 'main', id = generatePushID(), props = null) {
    blockType = typeof blockType !== 'string' ? blockType : api.blockTypes.get(blockType);
    const typeSpecific = createOwnData(blockType, props);
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
 * @param {RawBlock2} block
 * @returns {RawBlock2}
 */
function cloneDeep(block) {
    const cloned = JSON.parse(JSON.stringify(block));
    blockTreeUtils.traverseRecursively([cloned], block => {
        block.id = generatePushID();
    });
    return cloned;
}

/**
 * @param {BlockType} blockType
 * @param {{[key: String]: any;}} props = null
 * @returns {{[key: String]: any; propsData: Array<{key: String; value: any;}>;}}
 */
function createOwnData(blockType, props = null) {
    const flat = {};
    const asMetaArr = [];
    const setProp = (key, value) => {
        flat[key] = value;
        asMetaArr.push({key, value: flat[key]});
    };
    for (const key of blockType.ownPropNames) {
        setProp(key, blockType.initialData[key]);
    }
    if (props) for (const key in props) {
        if (!Object.prototype.hasOwnProperty.call(props, key)) continue;
        setProp(key, props[key]);
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
 * @param {RawBlock2|String} innerTreeBlockOrTrid
 * @param {Array<RawBlock2>} tree
 * @returns {RawBlock2} {type: 'GlobalBlockReference'}
 */
function findRefBlockOf(innerTreeBlockOrTrid, tree) {
    const trid = typeof innerTreeBlockOrTrid !== 'string' ? innerTreeBlockOrTrid.isStoredToTreeId : innerTreeBlockOrTrid;
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
        treeToTransferable, cloneDeep};
