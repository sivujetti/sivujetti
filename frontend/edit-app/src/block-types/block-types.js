const storage = new Map;

const blockTypes = {
    /**
     * @param {String} name
     * @returns {BlockType|undefined}
     * @access public
     */
    get(name) {
        return storage.get(name);
    },
    /**
     * @param {String} name
     * @param {BlockType}
     * @access public
     */
    register(name, blockType) {
        blockType.ownPropNames = blockType.ownPropNames.filter(key => key !== 'children');
        storage.set(name, blockType);
    },
    /**
     * @returns {IterableIterator<String, BlockType>}
     * @access public
     */
    entries() {
        return storage.entries();
    }
};

export default blockTypes;
