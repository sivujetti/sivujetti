let counter = 0;

class EditAppAwareWebPage {
    constructor() {
        this.id = null; // public
        this.layout = null; // public
        this.theme = null; // public
    }
    /**
     * @todo
     * @todo
     * @access public
     */
    doLoad(editApp, currentPage) {
        Object.assign(this, currentPage.page); // id, layout
        this.theme = currentPage.theme;
        this.theme.defaultPageLayout = this.theme.pageLayouts.find(pl => pl.isDefault === true);
        if (!editApp) throw new Error('!editApp');
        editApp.current.handleWebpageLoaded(this, currentPage.blocks, currentPage.isNewPage);
    }
    /**
     * @todo
     * @access public
     */
    setEventHandlers(handlers) {
        this._eventHandlers = handlers;
    }
    /**
     * @return todo
     * @access public
     */
    getBlockRefs() {
        const comms = getAllComments(document.body);
        const out = [];
        for (const c of comms) {
            if (!c.nodeValue.startsWith(' block-start '))
                continue;
            const L1 = /* <!-- */ ' block-start '.length;
            const L2 = ' '.length /* --> */;
            const pair = c.nodeValue.substr(L1, c.nodeValue.length - L1 - L2); // todo validate
            const [blockId, blockType] = pair.split(':');
            const blockIdAsInt = parseInt(blockId);
            if (isNaN(blockIdAsInt))
                continue;
            //
            out.push(new BlockRef({
                blockId: blockIdAsInt.toString(),
                startingCommentNode: c,
                blockType,
            }, this._eventHandlers));
        }
        return out;
    }
    /**
     * @todo
     * @todo
     * @todo
     * @return todo
     * @access public
     */
    addBlock(initialText, after, sectionName = 'main') {
        const p = document.createElement('p');
        p.textContent = initialText;
        return this._addBlock([p], sectionName, after);
    }
    /**
     * @todo
     * @todo
     * @todo
     * @return todo
     * @access public
     */
    addBlockT(blockType, initialData, after) {
        const refg = this.addBlock('wiped', after);
        refg.blockType = initialData.type; // ??
        blockType.reRender(initialData, refg, {});
        return refg;
    }
    /**
     * @todo
     * @todo
     * @todo
     * @return todo
     * @access public
     */
    moveBlock(blockRefToMove, targetSectionName, after) {
        // todo update comments (<!-- id:type) if type changes
        const out = this._addBlock(blockRefToMove.getContents(),
            targetSectionName, after, blockRefToMove.blockId);
        //
        blockRefToMove.destroy();
        //
        return out;
    }
    /**
     * @todo
     * @access public
     */
    updateTitle(title) {
        const els = document.querySelectorAll('[data-prop="title"]');
        for (let i = 0; i < els.length; ++i)
            els[i].textContent = title;
    }
    /**
     * @todo
     * @todo
     * @todo
     * @todo
     * @return todo
     * @access private
     */
    _addBlock(initialContent, sectionName, after, blockId = `new-${++counter}`, blockType = 'paragraph' /* todo */) {

        const startingCommentNode = document.createComment(` block-start ${blockId}:${blockType} `);

        const parent = after ? after.parentElement : document.querySelector(`[data-section="${sectionName}"]`); // todo handle if section not found
        parent.appendChild(startingCommentNode);
        initialContent.forEach(el => parent.appendChild(el));
        parent.appendChild(document.createComment(` block-end ${blockId}:${blockType} `));

        return new BlockRef({
            blockId,
            startingCommentNode,
            blockType,
        }, this._eventHandlers);
    }
}

function filterNone() {
    return NodeFilter.FILTER_ACCEPT;
}

/**
 * https://stackoverflow.com/a/13364065
 */
function getAllComments(rootElem) {
    const comments = [];
    const iterator = document.createNodeIterator(rootElem, NodeFilter.SHOW_COMMENT, filterNone, false);
    let curNode;
    while (curNode = iterator.nextNode()) // eslint-disable-line
        comments.push(curNode);
    return comments;
}

let globalClickHandlerAdded = false;
let blockRefCurrentlyBeingHovered = null;
let blockRefCurrentlyBeingEdited = null;

class BlockRef {
    constructor(input, eventHandlers) {
        this.blockId = input.blockId; // public string
        this.blockType = input.blockType; // public string
        this.startingCommentNode = input.startingCommentNode; // public
        this.startingDomNode = this.startingCommentNode.nextElementSibling; // private
        this._eventHandlers = eventHandlers;
        if (!globalClickHandlerAdded) {
        const clearStuff = () => {
            blockRefCurrentlyBeingEdited = null;
            blockRefCurrentlyBeingHovered = null;
        };
        document.body.addEventListener('click', e => {
            if (blockRefCurrentlyBeingHovered && !blockRefCurrentlyBeingEdited) {
                blockRefCurrentlyBeingEdited = blockRefCurrentlyBeingHovered;
                blockRefCurrentlyBeingHovered = null;
                const clickedBlockWasInlineEditable = this._eventHandlers.onBlockClickedDuringHover(blockRefCurrentlyBeingEdited);
                this._eventHandlers.onBlockHoverEnded(blockRefCurrentlyBeingEdited, e);
                if (!clickedBlockWasInlineEditable)
                    clearStuff();
                else
                    blockRefCurrentlyBeingEdited._openInlineEditor();
            } else if (blockRefCurrentlyBeingEdited && !e.target.closest('.ql-container') && !e.target.closest('.ql-toolbar')) {
                this._eventHandlers.onBlur(blockRefCurrentlyBeingEdited);
                clearStuff();
            }
        });
        globalClickHandlerAdded = true;
        }
        this._hookBlockHoverListeners();
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
    getContents() {
        let el = this.startingCommentNode.nextSibling;
        if (!el) throw new Error('?');
        const expectedEndComment = ` block-end ${this.blockId}:${this.blockType} `;
        const out = [];
        while (el) {
            if (el.nodeType === Node.COMMENT_NODE &&
                el.nodeValue === expectedEndComment) break;
            out.push(el);
            el = el.nextSibling;
        }
        return out;
    }
    _openInlineEditor() {
        let html = [`<div id="editor-${this.blockId}">`];
        this.getContents().forEach(el => { html.push(el.outerHTML); });
        html.push('</div>');
        this.tryToReRenderWithHtml(html.join(''), false);
        //
        const quill = new window.Quill(`#editor-${this.blockId}`, {
            modules: {toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                ['clean']
            ]},
            theme: 'snow'
        });
        quill.on('text-change', (_delta, _oldDelta, _source) => {
            if (quill.container.firstChild)
                this._eventHandlers.onHtmlInput(this, quill.container.firstChild.innerHTML);
        });
        quill.focus();

    }
    tryToReRenderWithHtml(html, rewire = true) {
        // todo use this.getContents
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
        const expectedEndComment = ` block-end ${this.blockId}:${this.blockType} `;
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
        this.startingDomNode = this.startingCommentNode.nextElementSibling;
        if (rewire)
            this._hookBlockHoverListeners();
    }
    destroy(removeCommentBoundariesAsWell = true) {
        // todo use this.getContents
        let el = this.startingCommentNode.nextSibling;
        if (!el) throw new Error('?');
        // 1. Collect all elements between the comments
        const expectedEndComment = ` block-end ${this.blockId}:${this.blockType} `;
        const toRemove = !removeCommentBoundariesAsWell ? [] : [this.startingCommentNode];
        while (el) {
            if (el.nodeType === Node.COMMENT_NODE &&
                el.nodeValue === expectedEndComment) {
                if (removeCommentBoundariesAsWell) toRemove.push(el);
                break;
            }
            toRemove.push(el);
            el = el.nextSibling;
        }
        // 2. Remove
        const parent = toRemove[0].parentElement;
        for (const el of toRemove)
            parent.removeChild(el);
    }
    _hookBlockHoverListeners() {
        this.startingDomNode.addEventListener('mouseover', e => {
            if (blockRefCurrentlyBeingEdited) return;
            blockRefCurrentlyBeingHovered = this;
            this._eventHandlers.onBlockHoverStarted(this, e);
            e.stopPropagation();
        });
        this.startingDomNode.addEventListener('mouseout', e => {
            if (blockRefCurrentlyBeingEdited) return;
            blockRefCurrentlyBeingHovered = null;
            this._eventHandlers.onBlockHoverEnded(this, e);
            e.stopPropagation();
        });
    }
}

export default EditAppAwareWebPage;
