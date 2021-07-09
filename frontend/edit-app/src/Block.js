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
     * @returns {string}
     * @access public
     */
    toHtml() {
        return reRenderers[this.type](this);
    }
}

export default Block;
