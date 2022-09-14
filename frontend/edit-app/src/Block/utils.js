import {api} from '@sivujetti-commons-for-edit-app';
import {generatePushID, objectUtils} from '../commons/utils.js';
import blockTreeUtils from '../blockTreeUtils.js';

/**
 * @param {BlockType|String} blockType
 * @param {String} trid = 'main'
 * @param {String} id = generatePushID()
 * @param {{[key: String]: any;}} initialOwnData = null
 * @returns {RawBlock}
 */
function createBlockFromType(blockType, trid = 'main', id = generatePushID(), initialOwnData = null) {
    if (typeof blockType === 'string') blockType = api.blockTypes.get(blockType);
    return createBlock(blockType, trid, id, initialOwnData || {}, {},
        blockType.initialChildren || null);
}

/**
 * @param {BlockBlueprint} blueprint
 * @param {String} trid = 'main'
 * @returns {RawBlock}
 */
function createBlockFromBlueprint(blueprint, trid = 'main') {
    const {initialOwnData, initialDefaultsData, initialChildren} = blueprint;
    return createBlock(api.blockTypes.get(blueprint.blockType), trid, generatePushID(),
        initialOwnData, initialDefaultsData || {}, initialChildren || []);
}

/**
 * @param {BlockType} blockType
 * @param {String} trid
 * @param {String} id
 * @param {{[key: String]: any;}} initialOwnData
 * @param {{title: String; renderer: String; styleClasses: String}|{[key: String]: any;}} initialDefaultsData
 * @param {Array<BlockBlueprint>|null} initialChildren
 * @returns {RawBlock}
 */
function createBlock(blockType, trid, id, initialOwnData, initialDefaultsData, initialChildren) {
    const typeSpecific = createOwnData(blockType, initialOwnData);
    return Object.assign({
        id,
        type: blockType.name,
        title: initialDefaultsData.title || '',
        renderer: initialDefaultsData.renderer || blockType.defaultRenderer,
        styleClasses: initialDefaultsData.styleClasses || '',
        isStoredTo: trid !== 'don\'t-know-yet' ? trid === 'main' ? 'page' : 'globalBlockTree' : trid,
        isStoredToTreeId: trid,
        children: !Array.isArray(initialChildren) ? [] : initialChildren.map(blueprint =>
            createBlockFromBlueprint(blueprint, trid))
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

export {createBlockFromType, createBlockFromBlueprint, isTreesOutermostBlock,
        findRefBlockOf, toTransferable, treeToTransferable, cloneDeep, setTrids};
