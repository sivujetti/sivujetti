import {env} from '@sivujetti-commons-for-web-pages';

/** @type {Map<string, BlockTypeDefinition>} */
const storage = new Map;

class BlockTypesRegister {
    /**
     * @param {Array<[string, BlockTypeDefinition]>} defaultBlockTypes
     * @see also ./populate-block-types-map.js
     * @access public
     */
    setup(defaultBlockTypes) {
        if (storage.size > 0) throw new Error('Already setup\'d');
        defaultBlockTypes.forEach(([key, val]) => {
            storage.set(key, val);
        });
    }
    /**
     * @param {string} name
     * @param {() => BlockTypeDefinition} blockTypeFactory
     * @access public
     */
    register(name, blockTypeFactory) {
        const baked = blockTypeFactory();
        const errors = validateBlockType(baked);
        if (errors.length) {
            env.window.console.error('Block type ', baked, ' was invalid', errors);
            storage.set(name, {
                name: 'BrokenBlockType',
                friendlyName: 'Broken block type',
                icon: 'question-mark',
                editForm: class extends preact.Component {
                    render () { return <div>Broken block type</div>; }
                },
                stylesEditForm: 'default',
                createOwnProps(/*defProps*/) {
                    return {};
                }
            });
            return;
        }
        storage.set(name, baked);
    }
    /**
     * @param {string} name
     * @returns {BlockTypeDefinition}
     * @access public
     */
    get(name) {
        const out = storage.get(name);
        if (!out)
            throw new Error(`Block type \`${name}\` not registered.`);
        return out;
    }
    /**
     * @param {BlockTypeDefinition|string} blockType
     * @returns {string} Icon for $blockTypeName or $fallBack
     * @access public
     */
    getIconId(blockType, fallback = 'box') {
        const type = typeof blockType === 'string' ? this.get(blockType) : blockType;
        return type.icon || fallback;
    }
    /**
     * @returns {IterableIterator<string, BlockTypeDefinition>}
     * @access public
     */
    entries() {
        return storage.entries();
    }
}

/**
 * @returns {Array<string>}
 */
function validateBlockType(candidate) {
    if (!candidate || typeof candidate !== 'object')
        return ['blockType must be an object'];
    const out = [];
    if (typeof candidate.editForm !== 'function')
        out.push('blockType.editForm must be (MyEditForm extends preact.Component { ... } || function MyEditForm() { ... })');
    if (candidate.stylesEditForm && (candidate.stylesEditForm !== 'default' && !(candidate.stylesEditForm instanceof preact.Component)))
        out.push('blockType.stylesEditForm must be (instanceof preact.Component || \'default\')');
    if (candidate.icon && typeof candidate.icon !== 'string')
        out.push('blockType.icon must be string');
    return out;
}

export default BlockTypesRegister;
