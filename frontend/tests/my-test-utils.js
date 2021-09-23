const utils = {
    /**
     * @param {preact.AnyComponent} reactCmp
     * @param {Object} props
     */
    renderIntoDocument(reactCmp, props) {
        preact.render(preact.createElement(reactCmp, props),
                      document.getElementById('render-container-el'));
    },
    /**
     * @param {any} value
     * @param {Element} inputEl
     */
    fillInput(value, inputEl) {
        inputEl.value = value;
        const event = document.createEvent('HTMLEvents');
        event.initEvent('input', false, true);
        inputEl.dispatchEvent(event);
    },
    /**
     * @param {String} value Allow raw input
     * @param {String} wysiwygInputName Allow raw input
     */
    fillWysiwygInput(value, wysiwygInputName) {
        const contenteditable = document.querySelector(`#editor-${wysiwygInputName} .ql-editor`);
        contenteditable.innerHTML = value;
    },
};

const blockUtils = {
    /**
     * @param {HTMLElement} blockRootEl
     * @returns {{blockId: String; blockType: String;}}
     * @throws {Error}
     */
    getBlockRefId(blockRootEl) {
        const expectedCommentNode = blockRootEl.previousSibling;
        if (expectedCommentNode.nodeType !== Node.COMMENT_NODE)
            throw new Error('expected blockRootEl.previousSibling to be a comment');
        const matches = expectedCommentNode.nodeValue.match(/^ block-start (.+):(.+) $/);
        if (!matches[1] || !matches[2])
            throw new Error(`${expectedCommentNode.nodeValue} is not a block ref`);
        return {blockId: matches[0], blockType: matches[1]};
    },
    /**
     * @param {BlockRaw} block
     * @param {String} html
     * @returns {String}
     */
    decorateWithRef(block, html) {
        return `<!-- block-start ${block.id}:${block.type} -->` +
            html + // e.g. '<section id="initial-section">...</section>'
        `<!-- block-end ${block.id} -->`;
    }
};

export default utils;
export {blockUtils};
