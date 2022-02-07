const storage = new Map;
let created = false;

/**
 * See also ../../main.js.
 */
class BlockTypes {
    /**
     * @param {any} internalSivujettiApi
     */
    constructor(internalSivujettiApi) {
        if (created) throw new Error('There can be only one..');
        this.internalSivujettiApi = internalSivujettiApi;
        created = true;
    }
    /**
     * @param {String} name
     * @returns {BlockType|(...any) => BlockType}
     * @access public
     */
    get(name) {
        const out = storage.get(name);
        if (!out)
            throw new Error(`Block type \`${name}\` not registered.`);
        return out;
    }
    /**
     * @param {String} name
     * @param {() => BlockType} blockTypeFactory
     * @access public
     */
    register(name, blockTypeFactory) {
        const baked = blockTypeFactory();
        baked.ownPropNames = baked.ownPropNames.filter(key => key !== 'children');
        storage.set(name, baked);
    }
    /**
     * @returns {IterableIterator<String, BlockType|(...any) => BlockType>}
     * @access public
     */
    entries() {
        return storage.entries();
    }
}

/**
 * @param {String} blockTypeName
 * @returns {String} Icon for $blockTypeName or $fallBack
 */
function getIcon(blockTypeName, fallback = 'box') {
    return storage.get(blockTypeName).icon || fallback;
}

export default BlockTypes;
export {getIcon};
