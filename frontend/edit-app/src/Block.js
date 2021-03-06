import {api} from '@sivujetti-commons-for-edit-app';
import blockTreeUtils from './blockTreeUtils.js';
import {generatePushID} from './commons/utils.js';

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
     * @param {String|null} globalBlockTreeId = null
     * @returns {Block}
     * @access public
     */
    static fromType(blockType,
                    data = {},
                    id = generatePushID(),
                    globalBlockTreeId = null) {
        blockType = typeof blockType !== 'string' ? blockType : api.blockTypes.get(blockType);
        const completeOwnProps = Block.makeOwnData(blockType, data);
        return Block.fromObject(Object.assign({
            id,
            type: blockType.name,
            title: '',
            renderer: blockType.defaultRenderer,
            isStoredTo: !globalBlockTreeId ? 'page' : 'globalBlockTree',
            globalBlockTreeId,
            children: []
        }, completeOwnProps));
    }
    /**
     * @param {Block} from
     * @returns {Block}
     * @access public
     */
    static cloneDeep(from) {
        const branch = blockTreeUtils.mapRecursively([from], block =>
            Block.fromObject(Object.assign({
                id: generatePushID(),
                title: block.title,
                type: block.type,
                renderer: block.renderer,
                isStoredTo: block.isStoredTo,
                globalBlockTreeId: block.globalBlockTreeId,
            }, this.makeOwnData(api.blockTypes.get(block.type), block, 1)))
        );
        return branch[0];
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
        const completeOwnProps = Block.makeOwnData(api.blockTypes.get(this.type), newPropsData);
        Object.assign(this, completeOwnProps);
    }
    /**
     * @param {Boolean} includeInternals = false
     * @returns {RawBlock}
     * @access public
     */
    toRaw(includeInternals = false) {
        const out = Object.assign({}, this);
        out.children = [];
        delete out._cref;
        if (!includeInternals) {
            for (const key in out) {
                if (Object.prototype.hasOwnProperty.call(out, key) && key.startsWith('__'))
                    delete out[key];
            }
        }
        return out;
    }
    /**
     * @param {String|null} children = null
     * @returns {String}
     * @access public
     */
    toHtml(children = null) {
        return api.blockTypes.get(this.type).reRender(this,
            () => children || (this.children ? this.children.map(b => b.toHtml()).join('') : ''));
    }
    /**
     * @returns {HTMLElement}
     * @access public
     */
    getRootDomNode() {
        /*
        <!-- block-start ... -->
        <section> <- this element
          ...
        */
        const firstEl = this._cref.startingCommentNode.nextElementSibling;
        /*
        <section>
          <div data-block-root>           <- this element
            foo
            <button><span data-block-root <- but not this
            ...
        */
        return firstEl.querySelector(':scope > [data-block-root]') ||
               firstEl;
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
        //
        for (const key in customData) {
            if (key.startsWith('__'))
                partialBlock[key] = customData[key];
        }
        //
        return partialBlock;
    }
}

export default Block;
