class EditAppAwareWebPage {
    /**
     */
    doLoad(editApp, currentPageBlocks) {
        if (editApp) editApp.current.handleWebpageLoaded(this, currentPageBlocks);
    }
    /**
     */
    getBlockRefs() {
        const comms = getAllComments(document.body);
        return comms.map(c => {
            if (c.nodeValue.startsWith(' block-end'))
                return null;
            const L1 = /* <!-- */ ' block-start '.length;
            const L2 = ' '.length /* --> */;
            const parsed = JSON.parse(c.nodeValue.substr(L1, c.nodeValue.length - L1 - L2));
            //
            let node = c.nextSibling;
            if (node.nodeType !== 1) // element
                node = node.parentElement;
            const rect = node.getBoundingClientRect();
            //
            return new Block({
                blockId: parsed.id,
                type: ['Heading', 'Paragraph', 'Formatted text'][parsed.type],
                position: rect,
                comment: c,
                node,
            });
        }).filter(v => v !== null);
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

class Block { // @todo Block, Comment ??
    constructor(input) {
        this.blockId = input.blockId; // public string
        this.type = input.type; // public
        this.position = input.position; // public
        this.startingCommentNode = input.comment; // private
        this.domNode = input.node; // private
    }
    reRenderWithText(text) {
        this.domNode.textContent = text;
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
    }
}

export default EditAppAwareWebPage;
