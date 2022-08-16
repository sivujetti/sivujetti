import {api} from '@sivujetti-commons-for-edit-app';
import {generatePushID, objectUtils} from '../commons/utils.js';
import blockTreeUtils from '../blockTreeUtils.js';

/**
 * @param {BlockType|String} blockType
 * @param {String} trid = 'main'
 * @param {String} id = generatePushID()
 * @param {{[key: String]: any;}} props = null
 * @returns {RawBlock}
 */
function createBlockFromType(blockType, trid = 'main', id = generatePushID(), props = null) {
    if (typeof blockType === 'string') blockType = api.blockTypes.get(blockType);
    const typeSpecific = createOwnData(blockType, props);
    return Object.assign({
        id,
        type: blockType.name,
        title: '',
        renderer: blockType.defaultRenderer,
        styleClasses: '',
        isStoredTo: trid !== 'don\'t-know-yet' ? trid === 'main' ? 'page' : 'globalBlockTree' : trid,
        isStoredToTreeId: trid,
        children: !Array.isArray(blockType.initialChildren) ? [] : blockType.initialChildren.map(blueprint =>
            createBlockFromType(blueprint.blockType, trid, undefined, blueprint.props))
    }, typeSpecific);
}

/**
 * @param {RawBlock} block
 * @returns {RawBlock}
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
 * @param {RawBlock|String} blockOrBlockId
 * @param {Array<RawBlock>} tree
 * @returns {Boolean}
 */
function isTreesOutermostBlock(blockOrBlockId, tree) {
    return (typeof blockOrBlockId === 'string' ? blockOrBlockId : blockOrBlockId.id) === tree[0].id;
}

/**
 * @param {RawBlock|String} innerTreeBlockOrTrid
 * @param {Array<RawBlock>} tree
 * @returns {RawBlock} {type: 'GlobalBlockReference'}
 */
function findRefBlockOf(innerTreeBlockOrTrid, tree) {
    const trid = typeof innerTreeBlockOrTrid !== 'string' ? innerTreeBlockOrTrid.isStoredToTreeId : innerTreeBlockOrTrid;
    return blockTreeUtils.findRecursively(tree, block =>
        block.type === 'GlobalBlockReference' && block.globalBlockTreeId === trid
    );
}

/**
 * @param {RawBlock} block
 * @returns {{[key: String]: any;}}
 */
function toTransferable(block) {
    return treeToTransferable([block])[0];
}

/**
 * @param {Array<RawBlock>} tree
 * @returns {Array<{[key: String]: any;}>}
 */
function treeToTransferable(tree) {
    return blockTreeUtils.mapRecursively(tree, block => {
        const onlyTheseKeys = Object.keys(block).filter(key =>
            ['children', 'isStoredTo', 'isStoredToTreeId'].indexOf(key) < 0
        );
        return objectUtils.clonePartially(onlyTheseKeys, block);
    });
}

/**
 * @param {Array<RawBlock>} branch
 * @param {String} trid
 */
function setTrids(branch, trid) {
    const isStoredTo = trid === 'main' ? 'page' : 'globalBlockTree';
    blockTreeUtils.traverseRecursively(branch, b => {
        b.isStoredToTreeId = trid;
        b.isStoredTo = isStoredTo;
    });
}

export {createBlockFromType, isTreesOutermostBlock, findRefBlockOf,
        toTransferable, treeToTransferable, cloneDeep, setTrids};
