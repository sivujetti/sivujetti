import {generatePushID} from '../../commons/utils.js';
import blockTypes from './block-types/all.js';

class Block {
    /**
     * @param {RawBlock} data
     * @returns {Block}
     * @access public
     */
    static fromObject(data) {
        const out = new Block;
        Object.assign(out, data);
        return out;
    }
    /**
     * @param {BlockType} blockType
     * @returns {Block}
     * @access public
     */
    static fromType(blockType) {
        const propsShortcuts = blockType.initialData;
        const propsData = [];
        for (const key in propsShortcuts) propsData.push({key, value: propsShortcuts[key]});
        //
        return Block.fromObject(Object.assign(
            {id: generatePushID(), type: blockType.name, title: '', renderer: blockType.defaultRenderer,
                propsData, children: []},
            propsShortcuts
        ));
    }
    /**
     * @param {RawBlock} from
     * @returns {Block}
     * @access public
     */
    static clone(from) {
        const data = Object.assign(JSON.parse(JSON.stringify(from)),
            {_cref: from._cref, children: from.children});
        return Block.fromObject(data);
    }
    /**
     * @returns {String}
     * @access public
     */
    toHtml() {
        return blockTypes.get(this.type).reRender(this);
    }
}

export default Block;
