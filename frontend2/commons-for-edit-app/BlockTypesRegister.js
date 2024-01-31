/** @type {Map<String, BlockTypeDefinition>} */
const storage = new Map;

class BlockTypesRegister {
    /**
     * @param {Array<[String, BlockTypeDefinition]>} defaultBlockTypes
     * @see also ./internal-wrapper.js
     * @access public
     */
    setup(defaultBlockTypes) {
        if (storage.size > 0) throw new Error('Already setup\'d');
        defaultBlockTypes.forEach(([key, val]) => {
            storage.set(key, val);
        });
    }
    /**
     * @param {String} name
     * @param {() => BlockTypeDefinition} blockTypeFactory
     * @access public
     */
    register(name, blockTypeFactory) {
        const baked = blockTypeFactory();
        if (baked.ownPropNames)
            baked.ownPropNames = baked.ownPropNames.filter(key => key !== 'children');
        storage.set(name, baked);
    }
    /**
     * @param {String} name
     * @returns {BlockTypeDefinition|(...any) => BlockTypeDefinition}
     * @access public
     */
    get(name) {
        const out = storage.get(name);
        if (!out)
            throw new Error(`Block type \`${name}\` not registered.`);
        return out;
    }
    /**
     * @param {BlockTypeDefinition|String} blockType
     * @returns {String} Icon for $blockTypeName or $fallBack
     * @access public
     */
    getIconId(blockType, fallback = 'box') {
        const type = typeof blockType === 'string' ? this.get(blockType) : blockType;
        return type.icon || fallback;
    }
    /**
     * @returns {IterableIterator<String, BlockTypeDefinition|(...any) => BlockTypeDefinition>}
     * @access public
     */
    entries() {
        return storage.entries();
    }
}

export default BlockTypesRegister;
