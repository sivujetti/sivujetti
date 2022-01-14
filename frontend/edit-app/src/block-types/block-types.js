const storage = new Map;

/**
 * See also ../../main.js.
 */
const blockTypes = {
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
    },
    /**
     * @param {String} name
     * @param {BlockType|(...any) => BlockType} blockTypeOrFactory
     * @access public
     */
    register(name, blockTypeOrFactory) {
        if (typeof blockTypeOrFactory !== 'function')
            blockTypeOrFactory.ownPropNames = blockTypeOrFactory.ownPropNames.filter(key => key !== 'children');
        storage.set(name, blockTypeOrFactory);
    },
    /**
     * @returns {IterableIterator<String, BlockType|(...any) => BlockType>}
     * @access public
     */
    entries() {
        return storage.entries();
    }
};

/**
 * @param {String} blockTypeName
 * @returns {String} Icon for $blockTypeName or $fallBack
 */
function getIcon(blockTypeName, fallback = 'box') {
    return blockTypes.get(blockTypeName).icon || fallback;
}

export default blockTypes;
export {getIcon};
