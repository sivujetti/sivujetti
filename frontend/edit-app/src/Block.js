const paragraphReRender = block =>
    `<p>${block.text}</p>`
;

const reRenderers = {
    'Paragraph': paragraphReRender,
};

class Block {
    /**
     * @param {Object} data
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
     * @param {string} id
     * @returns {Block}
     * @access public
     */
    static fromType(blockType, id) {
        return Block.fromObject(Object.assign(
            {id, type: blockType.name, title: '', renderer: blockType.defaultRenderer,
                children: []},
            blockType.initialData
        ));
    }
    /**
     * @returns {string}
     * @access public
     */
    toHtml() {
        return reRenderers[this.type](this);
    }
}

export default Block;
