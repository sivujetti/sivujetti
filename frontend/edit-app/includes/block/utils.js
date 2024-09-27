import {
    api,
    blockTreeUtils,
    generatePushID,
    objectUtils,
    writeBlockProps,
} from '@sivujetti-commons-for-edit-app';

/**
 * @param {Block} block
 * @param {boolean} includePrivates = false
 * @returns {{[key: string]: any;}}
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
 * @param {Array<Block>} tree
 * @param {boolean} includePrivates = false
 * @returns {Array<{[key: string]: any;}>}
 */
function treeToTransferable(tree, includePrivates = false) {
    return blockTreeUtils.mapRecursively(tree, block => toTransferableSingle(block, includePrivates));
}

/**
 * @param {Block} block
 * @returns {boolean}
 */
function isMetaBlock({type}) {
    return type === 'PageInfo';
}

/**
 * @param {string} blockId
 * @param {'mainTree'|Array<Block>} from
 * @returns {string|null}
 */
function getIsStoredToTreeIdFrom(blockId, from) {
    return blockTreeUtils.getIsStoredToTreeId(
        blockId,
        from === 'mainTree'
            ? api.saveButton.getInstance().getChannelState('theBlockTree')
            : from
    );
}

/**
 * @param {{type: string; renderer: string; id?: string; title?: string;}} defProps
 * @param {{[key: string]: any;}} ownProps
 * @returns {Block}
 */
function createBlock(defProps, ownProps) {
    const out = {
        ...{
            id: defProps.id || generatePushID(true),
            type: defProps.type,
            title: defProps.title || '',
            children: [],
            renderer: defProps.renderer,
            propsData: [],
            styleClasses: '',
        },
        ...(Object.keys(defProps).reduce((cleaned, key) => {
            if (key === 'propsData' || key === 'children')
                throw new Error(`defProps can't contain key ${key}`);
            if (key !== 'id' && key !== 'type') cleaned[key] = defProps[key];
            return cleaned;
        }, {}))
    };
    writeBlockProps(out, ownProps); // block.foo + block.propsData.*
    return out;
}

/**
 * @param {string|BlockTypeDefinition} blockType
 * @param {{[key: keyof]: any;}} ownProps
 * @returns {Block}
 */
function createBlockFromType(blockType, defPropAdditions = {}) {
    const type = typeof blockType === 'string' ? api.blockTypes.get(blockType) : blockType;
    const defs = createDefProps(type, defPropAdditions);
    const own = type.createOwnProps(defs);
    return createBlock(
        defs, // block.*
        own   // block.propsData[*] & block.*
    );
}

/**
 * @param {BlockBlueprint} blueprint
 * @param {(item: BlockBlueprint, block: Block) => BlockBlueprint} onEach
 * @returns {Block}
 */
function createBlockFromBlueprint(blueprint, onEach) {
    const {blockType, initialOwnData, initialDefaultsData, initialChildren} = blueprint;
    const type = api.blockTypes.get(blockType);
    const defs = createDefProps(type, initialDefaultsData);
    const own = {...type.createOwnProps(defs), ...initialOwnData};
    const block = {
        ...createBlock(
            defs, // block.*
            own
        ),
        ...{
            children: !Array.isArray(initialChildren) ? [] : initialChildren.map(blueprint =>
            createBlockFromBlueprint(blueprint, onEach))
        }
    };
    onEach(blueprint, block);
    return block;
}

/**
 * @param {BlockTypeDefinition} type
 * @param {{[key: string]: any;}} additions
 * @returns {Block}
 */
function createDefProps(type, additions) {
    return {
        ...{
            type: type.name,
            renderer: type.defaultRenderer || 'jsx'
        },
        ...additions
    };
}

/**
 * Example in/out 'uowHFoKTteV__uowHMRffw9f' -> 'uowHFoKTteV'.
 *
 * @param {string} compositeId blockId + '__' + gbRefBlockId (see appenfidyGbtRefBlockIds() @../../../webpage-renderer-app/main.js)
 * @returns {string}
 */
function unAppenfidyGbtRefBlockId(compositeId) {
    return compositeId.split('__')[0];
}

export {
    createBlock,
    createBlockFromBlueprint,
    createBlockFromType,
    getIsStoredToTreeIdFrom,
    isMetaBlock,
    treeToTransferable,
    unAppenfidyGbtRefBlockId,
};
