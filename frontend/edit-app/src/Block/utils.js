import {api} from '@sivujetti-commons-for-edit-app';
import {generatePushID, objectUtils} from '../commons/utils.js';
import blockTreeUtils from '../left-column/block/blockTreeUtils.js';

/**
 * @param {BlockType|String} blockType
 * @param {String} id = generatePushID()
 * @param {{[key: String]: any;}} initialOwnData = null
 * @returns {RawBlock}
 */
function createBlockFromType(blockType, id = generatePushID(), initialOwnData = null) {
    if (typeof blockType === 'string') blockType = api.blockTypes.get(blockType);
    return createBlock(blockType, id, initialOwnData || {}, {},
        blockType.initialChildren || null);
}

/**
 * @param {BlockBlueprint} blueprint
 * @returns {RawBlock}
 */
function createBlockFromBlueprint(blueprint) {
    const {initialOwnData, initialDefaultsData, initialChildren} = blueprint;
    return createBlock(api.blockTypes.get(blueprint.blockType), generatePushID(),
        initialOwnData, initialDefaultsData || {}, initialChildren || []);
}

/**
 * @param {BlockType} blockType
 * @param {String} id
 * @param {{[key: String]: any;}} initialOwnData
 * @param {{title: String; renderer: String; styleClasses: String}|{[key: String]: any;}} initialDefaultsData
 * @param {Array<BlockBlueprint>|null} initialChildren
 * @returns {RawBlock}
 */
function createBlock(blockType, id, initialOwnData, initialDefaultsData, initialChildren) {
    const typeSpecific = createOwnData(blockType, initialOwnData);
    return Object.assign({
        id,
        type: blockType.name,
        title: initialDefaultsData.title || '',
        renderer: initialDefaultsData.renderer || blockType.defaultRenderer,
        styleClasses: initialDefaultsData.styleClasses || '',
        children: !Array.isArray(initialChildren) ? [] : initialChildren.map(blueprint =>
            createBlockFromBlueprint(blueprint))
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
    if (typeof blockType.initialData !== 'function') {
        for (const key of blockType.ownPropNames) {
            setProp(key, blockType.initialData[key]);
        }
    } else {
        const data = blockType.initialData();
        for (const key in data) {
            if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
            setProp(key, data[key]);
        }
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
 * @param {RawBlock} block
 * @param {Boolean} includePrivates = false
 * @param {Boolean} recursive = true
 * @returns {{[key: String]: any;}}
 */
function toTransferable(block, includePrivates = false, recursive = true) {
    return recursive
        ? treeToTransferable([block], includePrivates)[0]
        : toTransferableSingle(block, includePrivates);
}

/**
 * @param {Array<RawBlock>} tree
 * @param {Boolean} includePrivates = false
 * @returns {Array<{[key: String]: any;}>}
 */
function treeToTransferable(tree, includePrivates = false) {
    return blockTreeUtils.mapRecursively(tree, block => toTransferableSingle(block, includePrivates));
}

/**
 * @param {RawBlock} block
 * @param {Boolean} includePrivates = false
 * @returns {{[key: String]: any;}}
 */
function toTransferableSingle(block, includePrivates = false) {
    const allKeys = Object.keys(block);
    const onlyTheseKeys = allKeys.filter(key => {
        if (key === 'children')
            return false;
        if (includePrivates === false && key.startsWith('__'))
            return false;
        return true;
    });
    return objectUtils.clonePartially(onlyTheseKeys, block);
}

/**
 * @param {RawGlobalBlockTree} gbt
 * @param {Array<RawBlock>} blocks = null
 * @returns {{globalBlockTreeId: String; __globalBlockTree: {id: String; name: String; blocks: Array<RawBlock>;};}}
 */
function createGbtRefBlockProps(gbt, blocks = null) {
    return {
        globalBlockTreeId: gbt.id,
        __globalBlockTree: {
            id: gbt.id,
            name: gbt.name,
            blocks: blocks || JSON.parse(JSON.stringify(gbt.blocks)),
        }
    };
}

export {createBlockFromType, createBlockFromBlueprint, isTreesOutermostBlock,
        toTransferable, treeToTransferable, cloneDeep, createGbtRefBlockProps};
