import {
    api,
    blockTreeUtils,
    generatePushID,
    objectUtils,
    writeBlockProps,
} from '@sivujetti-commons-for-edit-app';

/**
 * @param {Block} block
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
 * @param {Array<Block>} tree
 * @param {Boolean} includePrivates = false
 * @returns {Array<{[key: String]: any;}>}
 */
function treeToTransferable(tree, includePrivates = false) {
    return blockTreeUtils.mapRecursively(tree, block => toTransferableSingle(block, includePrivates));
}

/**
 * @param {Block} block
 * @returns {Boolean}
 */
function isMetaBlock({type}) {
    return type === 'PageInfo';
}

/**
 * @param {String} blockId
 * @param {'mainTree'|Array<Block>} from
 * @returns {String|null}
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
 * @param {{type: String; renderer: String; id?: String; title?: String;}} defProps
 * @param {{[key: String]: any;}} ownProps
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
            styleGroup: '',
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
 * @param {String|BlockTypeDefinition} blockType
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
 * @param {{[key: String]: any;}} additions
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

export {
    createBlock,
    createBlockFromBlueprint,
    createBlockFromType,
    getIsStoredToTreeIdFrom,
    isMetaBlock,
    treeToTransferable,
};
