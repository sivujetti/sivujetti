class EditAppAwareWebPage {
    // data;
    // currentlyHoveredBlockFirstChildEl;
    // currentlyHoveredBlockRef;
    // isGlobalClickHandlerSet;
    /**
     * @param {CurrentPageData} dataFromAdminBackend
     */
    constructor(dataFromAdminBackend) {
        this.data = dataFromAdminBackend;
        this.currentlyHoveredBlockFirstChildEl = undefined;
        this.currentlyHoveredBlockRef = undefined;
        this.isGlobalClickHandlerSet = undefined;
    }
    /**
     * @param {{onBlockHoverStarted: (el: HTMLElement) => void; onBlockHoverEnded: () => void; onBlockClicked: (blockRef: BlockRefComment) => void;}} handlers
     * @access public
     */
    setEventHandlers(handlers) {
        this.handlers = handlers;
    }
    /**
     * @param {Boolean} doRegisterEventListeners = false
     * @returns {Array<BlockRefComment>}
     * @access public
     */
    scanBlockRefComments(doRegisterEventListeners = false) {
        const out = this.data.page.blocks.length
            ? getBlockRefCommentsFromCurrentPage()
            : [];
        if (doRegisterEventListeners) {
            const hoverables = !this.data.page.isPlaceholderPage
                ? out
                : out.filter(({blockId}) => this.data.layoutBlocks.some(block => block.id === blockId) === false);
            hoverables.map(this.registerBlockMouseListeners.bind(this));
            if (!this.isGlobalClickHandlerSet) {
                document.body.addEventListener('click', () => {
                    if (this.currentlyHoveredBlockFirstChildEl)
                        this.handlers.onBlockClicked(this.currentlyHoveredBlockRef);
                });
                this.isGlobalClickHandlerSet = true;
            }
        }
        return out;
    }
    /**
     * @param {Block} block
     * @param {Block|{parentNode: HTMLElement|null; nextSibling: HTMLElement|null;}} after
     * @returns {Promise<BlockRefComment>}
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
        return this.renderBlockInto(
            block,
            () => ({parent: commentOrPseudoComment.parentNode,
                    before: commentOrPseudoComment.nextSibling}),
            true
        ).then(startingCommentNode => {
            const cref = makeBlockRefComment(block.id, startingCommentNode);
            this.registerBlockMouseListeners(cref);
            return cref;
        });
    }
    /**
     * @param {Block} block
     * @param {Block} replacement
     * @returns {Promise<BlockRefComment>}
     * @access public
     */
    replaceBlockFromDomWith(currentBlock, replacement) {
        // 1. Remove contents of currentBlock
        const contents = this.deleteBlockFromDom(currentBlock, true)[0];
        // 2. Add contents of replacement
        return this.renderBlockInto(
            replacement,
            () => ({parent: contents[0].parentNode,
                    before: contents[contents.length - 1]})
        ).then(() => {
            if (currentBlock.type !== replacement.type)
               contents[0].textContent = makeStartingComment(replacement);
            const cref = makeBlockRefComment(replacement, contents[0]);
            this.registerBlockMouseListeners(cref);
            return cref;
        });
    }
    /**
     * @param {Block} block
     * @param {Boolean} doKeepBoundaryComments = false
     * @returns {[Array<HTMLElement>, Array<HTMLElement>]}
     * @access public
     */
    deleteBlockFromDom(block, doKeepBoundaryComments = false) {
        const toRemove = this.getBlockContents(block);
        const parent = toRemove[0].parentElement;
        const keptChildNodes = block.children.length ? this.getChildBlockContents(block) : [];
        //
        const oneOff = !doKeepBoundaryComments ? 0 : 1;
        for (let i = oneOff; i < toRemove.length - oneOff; ++i)
            parent.removeChild(toRemove[i]);
        return [toRemove, keptChildNodes];
    }
    /**
     * @param {Block} block
     * @returns {Promise<null>}
     * @access public
     */
    reRenderBlockInPlace(block) {
        return this.renderBlockInto(block, () => {
            const keptChildren = this.deleteBlockFromDom(block, true)[1];
            const com = block._cref.startingCommentNode;
            return {parent: com.parentNode,
                    before: com.nextSibling,
                    prevChildNodes: keptChildren};
        });
    }
    /**
     * @param {Block} blockToMove
     * @param {Block} blockToMoveTo
     * @param {'before'|'after'} position
     * @access public
     */
    reOrderBlocksInDom(blockToMove, blockToMoveTo, position) {
        const p = blockToMoveTo._cref.startingCommentNode.parentElement;
        const ps = blockToMoveTo._cref.startingCommentNode;
        //
        if (position === 'before') {
            this.getBlockContents(blockToMove).forEach(n => p.insertBefore(n, ps));
        } else if (position === 'after') {
            const targetBlockContents = this.getBlockContents(blockToMoveTo);
            const endingComment = targetBlockContents[targetBlockContents.length - 1];
            //
            const marker = document.createElement('span');
            if (endingComment.nextSibling) p.insertBefore(marker, endingComment.nextSibling);
            else p.appendChild(marker);
            //
            this.getBlockContents(blockToMove).forEach(n => p.insertBefore(n, marker));
            p.removeChild(marker);
        } else {
            throw new Error(`Invalid drop position ${position}`);
        }
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
     * @param {() => {parent: HTMLElement; before: HTMLElement|null; prevChildNodes?: Array<HTMLElement>;}} getSettings
     * @param {boolean} doInsertCommentBoundaryComments = false
     * @returns {Promise<Comment|null>}
     * @access private
     */
    renderBlockInto(block, getSettings, doInsertCommentBoundaryComments = false) {
        const startingComment = !doInsertCommentBoundaryComments ? null : makeStartingComment(block);
        const temp = document.createElement('template');
        const markerHtml = !block.children.length ? null : '<span id="temp-marker"></span>';
        const newh = block.toHtml(markerHtml);
        return (typeof newh === 'string' ? Promise.resolve(newh) : newh).then(html => {
            const {parent, before, prevChildNodes} = getSettings();
            //
            temp.innerHTML = !doInsertCommentBoundaryComments
                ? html
                : `<!--${startingComment}-->${html}<!--${makeEndingComment(block)}-->`;
            //
            if (before) parent.insertBefore(temp.content, before);
            else parent.appendChild(temp.content);
            //
            if (markerHtml) {
                const markerEl = document.getElementById('temp-marker');
                prevChildNodes.forEach(el => { markerEl.parentNode.insertBefore(el, markerEl); });
                markerEl.parentNode.removeChild(markerEl);
                // re-set _crefs ??
            }
            //
            return !doInsertCommentBoundaryComments
                ? null
                : getAllComments(parent).find(c => c.nodeValue === startingComment);
        });
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
    /**
     * @param {Block} blockWithChildren
     * @returns {Array<HTMLElement>}
     * @access private
     */
    getChildBlockContents(blockWithChildren) {
        const collectAfter = blockWithChildren.children[0]._cref.startingCommentNode;
        const collectUntil = makeEndingComment(blockWithChildren.children[blockWithChildren.children.length - 1]);
        for (const c of getAllComments(blockWithChildren._cref.startingCommentNode.parentElement)) {
            if (c === collectAfter) {
                const out = [c];
                let el = c.nextSibling;
                while (el) {
                    if (el.nodeType === Node.COMMENT_NODE &&
                        el.nodeValue === collectUntil)
                            return out.concat(el);
                    out.push(el);
                    el = el.nextSibling;
                }
            }
        }
        return [];
    }
    /**
     * @param {BlockRefComment} blockRef
     * @access private
     */
    registerBlockMouseListeners(blockRef) {
        const comment = blockRef.startingCommentNode;
        const nextEl = comment.nextElementSibling || comment.nextSibling;
        nextEl.addEventListener('mouseover', e => {
            if (e.target !== nextEl) {
                return;
            }
            if (this.currentlyHoveredBlockFirstChildEl !== e.target) {
                this.currentlyHoveredBlockRef = blockRef;
                this.handlers.onBlockHoverStarted(e.target, this.currentlyHoveredBlockRef);
                this.currentlyHoveredBlockFirstChildEl = e.target;
                e.stopPropagation();
            }
        });
        nextEl.addEventListener('mouseleave', e => {
            if (this.currentlyHoveredBlockFirstChildEl === e.target) {
                this.handlers.onBlockHoverEnded(this.currentlyHoveredBlockFirstChildEl, this.currentlyHoveredBlockRef);
                this.currentlyHoveredBlockFirstChildEl = null;
                this.currentlyHoveredBlockRef = null;
                e.stopPropagation();
            }
        });
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
