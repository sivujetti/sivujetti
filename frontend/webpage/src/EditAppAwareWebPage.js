let counter = 0;

class EditAppAwareWebPage {
    /**
     * @todo
     * @todo
     * @access public
     */
    doLoad(editApp, currentPageBlocks) {
        if (editApp) editApp.current.handleWebpageLoaded(this, currentPageBlocks);
    }
    /**
     * @return todo
     * @access public
     */
    getBlockRefs() {
        const comms = getAllComments(document.body);
        return comms.map(c => {
            if (c.nodeValue.startsWith(' block-end'))
                return null;
            const L1 = /* <!-- */ ' block-start '.length;
            const L2 = ' '.length /* --> */;
            //
            return new Block({
                blockId: parseInt(c.nodeValue.substr(L1, c.nodeValue.length - L1 - L2)).toString(),
                startingCommentNode: c,
            }, true);
        }).filter(v => v !== null);
    }
    /**
     * @todo
     * @todo
     * @return todo
     * @access public
     */
    addBlock(after, initialText) {

        const blockId = `new-${++counter}`;
        const startingCommentNode = document.createComment(` block-start ${blockId} `);
        const startingDomNode = document.createElement('p');
        startingDomNode.textContent = initialText;

        const parent = after.parentElement;
        parent.appendChild(startingCommentNode);
        parent.appendChild(startingDomNode);
        parent.appendChild(document.createComment(` block-end ${blockId} `));

        return new Block({
            blockId,
            startingCommentNode
        });
    }
}

function filterNone() {
    return NodeFilter.FILTER_ACCEPT;
}

function getAllComments(rootElem) {
    var comments = [];
    var iterator = document.createNodeIterator(rootElem, NodeFilter.SHOW_COMMENT, filterNone, false);
    var curNode;
    while (curNode = iterator.nextNode()) // eslint-disable-line
        comments.push(curNode);
    return comments;
}

class Block { // @todo Block, Comment, BlockRef ??
    constructor(input) {
        this.blockId = input.blockId; // public string
        this.startingCommentNode = input.startingCommentNode; // public
        this.startingDomNode = this.startingCommentNode.nextElementSibling; // private
    }
    get position() {
        return this.startingDomNode.getBoundingClientRect();
    }
    get parentElement() {
        return this.startingDomNode.parentElement;
    }
    reRenderWithText(text) {
        this.startingDomNode.textContent = text;
    }
    tryToReRenderWithHtml(html) {
        let el = this.startingCommentNode.nextSibling;
        if (!el) throw new Error('?');
        // 1. Validate input html
        const newContents = document.createElement('div');
        try {
            newContents.innerHTML = html;
            if (!newContents.childNodes.length) return; // Incomplete html
        } catch (e) { // SyntaxError
            return;
        }
        // 2. Collect all DOM node between the comments
        const toRemove = [];
        const expectedEndComment = ` block-end ${this.blockId} `;
        while (el) {
            if (el.nodeType === Node.COMMENT_NODE &&
                el.nodeValue === expectedEndComment) break;
            toRemove.push(el);
            el = el.nextSibling;
        }
        // 3. Remove found DOM nodes except the last one
        const parent = toRemove[0].parentNode;
        for (let i = 0; i < toRemove.length - 1; ++i)
            parent.removeChild(toRemove[i]);
        // 4. Replace the last DOM node with the html
        toRemove[toRemove.length - 1].replaceWith(...Array.from(newContents.childNodes));
        //
        this.startingDomNode = this.startingCommentNode.nextElementSibling; // private
    }
    destroy() {
        // todo dry
        let el = this.startingCommentNode.nextSibling;
        if (!el) throw new Error('?');
        //
        const expectedEndComment = ` block-end ${this.blockId} `;
        const parent = el.parentElement;
        while (el) {
            const p = el;
            el = el.nextSibling;
            parent.removeChild(p);
            if (p.nodeType === Node.COMMENT_NODE &&
                p.nodeValue === expectedEndComment) break;
        }
    }
}

export default EditAppAwareWebPage;
