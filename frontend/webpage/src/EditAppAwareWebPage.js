class EditAppAwareWebPage {
    // data;
    /**
     * @param {CurrentPageData} dataFromAdminBackend
     */
    constructor(dataFromAdminBackend) {
        this.data = dataFromAdminBackend;
    }
    /**
     * @returns {Array<BlockRefComment>}
     * @access public
     */
    scanBlockRefComments() {
        return this.data.page.blocks.length
            ? getBlockRefCommentsFromCurrentPage()
            : [];
    }
    /**
     * @param {Block} block
     * @param {Block|{parentNode: HTMLElement|null; nextSibling: HTMLElement|null;}} after
     * @returns {BlockRefComment}
     * @access public
     */
    appendBlockToDom(block, after) {
        let commentOrPseudoComment;
        if (after._cref) { // Block
            commentOrPseudoComment = this.getBlockContents(after).pop();
            if (!commentOrPseudoComment) throw new Error(`Failed to ending comment for "${makeStartingComment(after)}"`);
        } else { // Pseudo comment / marker
            commentOrPseudoComment = after;
        }
        const startingCommentNode = this.renderBlockInto(block,
            commentOrPseudoComment.parentNode,
            commentOrPseudoComment.nextSibling,
            true);
        return makeBlockRefComment(block.id, startingCommentNode);
    }
    /**
     * @param {Block} block
     * @param {Block} replacement
     * @returns {BlockRefComment}
     * @access public
     */
    replaceBlockFromDomWith(currentBlock, replacement) {
        // 1. Remove contents of currentBlock
        const contents = this.deleteBlockFromDom(currentBlock, true);
        // 2. Add contents of replacement
        this.renderBlockInto(replacement, contents[0].parentNode,
            contents[contents.length - 1]);
        if (currentBlock.type !== replacement.type)
           contents[0].textContent = makeStartingComment(replacement);
        return makeBlockRefComment(replacement, contents[0]);
    }
    /**
     * @param {Block} block
     * @param {Boolean} doKeepBoundaryComments = false
     * @returns {Array<HTMLElement>}
     * @access public
     */
    deleteBlockFromDom(block, doKeepBoundaryComments = false) {
        const toRemove = this.getBlockContents(block);
        const parent = toRemove[0].parentElement;
        //
        const oneOff = !doKeepBoundaryComments ? 0 : 1;
        for (let i = oneOff; i < toRemove.length - oneOff; ++i)
            parent.removeChild(toRemove[i]);
        return toRemove;
    }
    /**
     * @param {Block} block
     * @access public
     */
    renderBlockInPlace(block) {
        // 1. Remove old contents
        this.deleteBlockFromDom(block, true);
        // 2. Replace with current contents
        const com = block._cref.startingCommentNode;
        this.renderBlockInto(block, com.parentNode, com.nextSibling);
    }
    /**
     * @param {Block} block
     * @returns {Commment|undefined}
     * @access public
     */
    findEndingComment(block) {
        return this.getBlockContents(block, true).pop();
    }
    /**
     * @param {String} text
     * @access public
     */
    updateTitle(text) {
        const els = document.querySelectorAll('[data-prop="title"]');
        for (let i = 0; i < els.length; ++i)
            els[i].textContent = text;
    }
    /**
     * @param {Block} block
     * @param {HTMLElement} parent
     * @param {HTMLElement=} before = null
     * @param {boolean} doInsertCommentBoundaryComments = false
     * @returns {Comment|null}
     * @access private
     */
    renderBlockInto(block, parent, before = null, doInsertCommentBoundaryComments = false) {
        const startingComment = !doInsertCommentBoundaryComments ? null : makeStartingComment(block);
        const temp = document.createElement('template');
        temp.innerHTML = !startingComment
            ? block.toHtml()
            : `<!--${startingComment}-->${block.toHtml()}<!--${makeEndingComment(block)}-->`;
        //
        if (before) parent.insertBefore(temp.content, before);
        else parent.appendChild(temp.content);
        //
        return !startingComment
            ? null
            : getAllComments(parent).find(c => c.nodeValue === startingComment);
    }
    /**
     * @param {Block} block
     * @param {boolean} doIncludeBoundaryComments = true
     * @returns {Array<HTMLElement>}
     * @access private
     */
    getBlockContents(block, doIncludeBoundaryComments = true) {
        const startingComment = block._cref.startingCommentNode;
        let el = startingComment.nextSibling;
        if (!el) throw new Error('?');
        const expectedEndComment = makeEndingComment(block);
        const out = doIncludeBoundaryComments ? [startingComment] : [];
        while (el) {
            if (el.nodeType === Node.COMMENT_NODE &&
                el.nodeValue === expectedEndComment) {
                    if (doIncludeBoundaryComments) out.push(el);
                    break;
                }
            out.push(el);
            el = el.nextSibling;
        }
        return out;
    }
}

/**
 * @param {Block} block
 * @param {Comment} startingCommentNode
 * @returns {BlockRefComment}
 */
function makeBlockRefComment(block, startingCommentNode) {
    return {
        blockId: block.id,
        blockType: block.type,
        startingCommentNode,
    };
}

/**
 * @param {Block} block
 * @returns {string}
 */
function makeStartingComment(block) {
    return ` block-start ${block.id}:${block.type} `;
}

/**
 * @param {Block} block
 * @returns {string}
 */
function makeEndingComment(block) {
    return ` block-end ${block.id} `;
}

/**
 * @returns {Array<BlockRefComment>}
 */
function getBlockRefCommentsFromCurrentPage() {
    const L1 = /* <!-- */ ' block-start '.length;
    const L2 = ' '.length /* --> */;
    const out = [];
    for (const c of getAllComments(document.body)) {
        if (!c.nodeValue.startsWith(' block-start '))
            continue;
        const pair = c.nodeValue.substr(L1, c.nodeValue.length - L1 - L2);
        const [blockId, blockType] = pair.split(':');
        const PUSH_ID_LENGTH = 20;
        if (!(blockId.length === PUSH_ID_LENGTH || !isNaN(parseInt(blockId))))
            continue;
        //
        out.push({
            blockId,
            blockType,
            startingCommentNode: c,
        });
    }
    return out;
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

export default EditAppAwareWebPage;
