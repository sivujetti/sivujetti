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
     * @param {Array<Block>} parentBranch
     * @returns {BlockRefComment}
     * @access public
     */
    appendBlockToDom(block, parentBranch) {
        const after = parentBranch[parentBranch.length - 1];
        const afterComment = this.getBlockContents(after).pop();
        if (!afterComment) throw new Error(`Failed to ending comment for "${makeStartingComment(after)}"`);
        //
        const startingCommentNode = document.createComment(makeStartingComment(block));
        const temp = document.createElement('div');
        temp.innerHTML = block.toHtml();
        //
        if (afterComment.nextSibling) {
            afterComment.parentNode.insertBefore(startingCommentNode, afterComment.nextSibling);
            let b = startingCommentNode;
            temp.childNodes.forEach(el => {
                afterComment.parentNode.insertBefore(el, b);
                b = el;
            });
            afterComment.parentNode.insertBefore(document.createComment(makeEndingComment(block)), b);
        } else {
            afterComment.parentNode.appendChild(startingCommentNode);
            temp.childNodes.forEach(el => afterComment.parentNode.appendChild(el));
            afterComment.parentNode.appendChild(document.createComment(makeEndingComment(block)));
        }
        return {
            blockId: block.id,
            blockType: block.type,
            startingCommentNode,
        };
    }
    /**
     * @param {Block} block
     * @access public
     */
    deleteBlockFromDom(block) {
        const toRemove = this.getBlockContents(block);
        const parent = toRemove[0].parentElement;
        for (const el of toRemove) parent.removeChild(el);
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
