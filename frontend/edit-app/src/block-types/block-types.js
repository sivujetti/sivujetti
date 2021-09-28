const storage = new Map;

const blockTypes = {
    /**
     * @param {String} name
     * @returns {BlockType|(...any) => BlockType|undefined}
     * @access public
     */
    get(name) {
        return storage.get(name);
    },
    /**
     * @param {String} name
     * @param {BlockType|(...any) => BlockType}
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

export default blockTypes;
