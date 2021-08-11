import {generatePushID} from '../../commons/utils.js';
import blockTypes from './block-types/block-types.js';

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
     * @param {BlockType|String} blockType
     * @param {Object} data = {}
     * @param {String} id = generatePushID()
     * @returns {Block}
     * @access public
     */
    static fromType(blockType, data = {}, id = generatePushID()) {
        blockType = typeof blockType !== 'string' ? blockType : blockTypes.get(blockType);
        const completeOwnProps = Block.makeOwnData(blockType, data);
        return Block.fromObject(Object.assign({
            id,
            type: blockType.name,
            title: '',
            renderer: blockType.defaultRenderer,
            children: []
        }, completeOwnProps));
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
     * @param {{[key: String]: any;}} newPropsData
     * @access public
     */
    overwritePropsData(newPropsData) {
        const completeOwnProps = Block.makeOwnData(blockTypes.get(this.type), newPropsData);
        Object.assign(this, completeOwnProps);
    }
    /**
     * @returns {RawBlock}
     * @access public
     */
    toRaw() {
        const out = Object.assign({}, this);
        out.children = [];
        delete out._cref;
        return out;
    }
    /**
     * @param {String|null} children = null
     * @returns {String}
     * @access public
     */
    toHtml(children = null) {
        return blockTypes.get(this.type).reRender(this,
            () => children || (this.children ? this.children.map(b => b.toHtml()).join('') : ''));
    }
    /**
     * @returns {HTMLElement}
     * @access public
     */
    getRootDomNode() {
        // <!-- block-start ... --><section> <- this element
        const firstEl = this._cref.startingCommentNode.nextElementSibling;
        return firstEl.querySelector('[data-block-root]') || firstEl;
    }
    /**
     * @param {BlockType} blockType
     * @param {Object} customData
     * @returns {{propsData: Array<{key: String; value: any;}>; [key: String]: any;}}
     * @access private
     */
    static makeOwnData(blockType, customData) {
        const partialBlock = {};
        const defaultOwnData = blockType.initialData;
        const propsMeta = [];
        for (const key of blockType.ownPropNames) {
            partialBlock[key] = Object.prototype.hasOwnProperty.call(customData, key)
                ? customData[key]
                : defaultOwnData[key];
            propsMeta.push({key, value: partialBlock[key]});
        }
        partialBlock.propsData = propsMeta;
        return partialBlock;
    }
}

export default Block;