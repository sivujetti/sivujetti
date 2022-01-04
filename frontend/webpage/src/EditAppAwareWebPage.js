class EditAppAwareWebPage {
    // data;
    // currentlyHoveredEl;
    // currentlyHoveredRootEl;
    // currentlyHoveredBlockRef;
    // allowClick:
    // isLocalLink:
    /**
     * @param {CurrentPageData} dataFromAdminBackend
     */
    constructor(dataFromAdminBackend) {
        this.data = dataFromAdminBackend;
        this.currentlyHoveredEl = null;
        this.currentlyHoveredRootEl = null;
        this.currentlyHoveredBlockRef = null;
        this.allowClick = false;
        this.isLocalLink = createIsLocalLinkCheckFn();
    }
    /**
     * @returns {Array<BlockRefComment>}
     * @access public
     */
    scanBlockRefComments() {
        return this.data.page.blocks.length
            ? scanAndCreateBlockRefCommentsFrom(document.body)
            : [];
    }
    /**
     * @param {EditAwareWebPageEventHandlers} handlers
     * @param {Array<BlockRefComment>} blockRefComments
     * @access public
     */
    registerEventHandlers(handlers, blockRefComments) {
        if (this.handlers)
            return;
        this.handlers = handlers;
        document.body.addEventListener('click', e => {
            if (!this.currentlyHoveredEl) return;
            if (e.target.nodeName === 'A' && !this.allowClick)
                return;
            this.handlers.onClicked(this.currentlyHoveredBlockRef);
        });
        blockRefComments.forEach(blockRef => {
            if (blockRef.blockType === 'GlobalBlockReference')
                return;
            if (blockRef.blockType !== 'PageInfo') {
                this.registerBlockMouseListeners(blockRef);
            } else {
                getTitleEls().forEach(el => {
                    this.registerBlockMouseListeners(blockRef, el);
                });
            }
        });
        this.registerLocalLinkEventHandlers();
    }
    /**
     * @param {Array<RawBlock>} pageBlocks
     * @param {Array<BlockRefComment>} blockRefComments
     * @param {blockTreeUtils} blockTreeUtils
     * @returns {Array<RawBlock>}
     * @access public
     */
    getCombinedAndOrderedBlockTree(pageBlocks, blockRefComments, blockTreeUtils) {
        const out = [];
        for (const _cref of blockRefComments) {
            const block = pageBlocks.find(({id}) => id === _cref.blockId);
            if (block) {
                blockTreeUtils.traverseRecursively([block], b => {
                    b.isStoredTo = 'page';
                });
                out.push(block);
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
            const cref = makeBlockRefComment(block, startingCommentNode);
            this.registerBlockMouseListeners(cref);
            return cref;
        });
    }
    /**
     * @param {Block} clonedBlock
     * @param {Block} clonedFromBlock
     * @param {blockTreeUtils} blockTreeUtils
     * @returns {Promise<{[key: String]: BlockRefComment;}>}
     * @access public
     */
    appendClonedBlockBranchToDom(clonedBlock, clonedFromBlock, blockTreeUtils) {
        const contentToClone = this.getBlockContents(clonedFromBlock);
        const clonedContentEls = [document.createComment(makeStartingComment(clonedBlock)),
                                  contentToClone[1].cloneNode(true),
                                  document.createComment(makeEndingComment(clonedBlock))];
        //
        const childBlockMap = {};
        blockTreeUtils.traverseRecursively(clonedFromBlock.children, (block, i, pi) => {
            childBlockMap[`${pi}-${i}`] = {clonedFrom: block, cloned: null, startingCommentNode: null};
        });
        blockTreeUtils.traverseRecursively(clonedBlock.children, (block, i, pi) => {
            childBlockMap[`${pi}-${i}`].cloned = block;
        });
        // Update the comment ref nodes of each cloned block
        const clonedComms = getAllComments(clonedContentEls[1]);
        for (const key in childBlockMap) {
            const {clonedFrom, cloned} = childBlockMap[key];
            const startingCommentNode = clonedComms.find(c => c.nodeValue === makeStartingComment(clonedFrom));
            const endindCommentNode = clonedComms.find(c => c.nodeValue === makeEndingComment(clonedFrom));
            startingCommentNode.textContent = makeStartingComment(cloned); // Note: mutates clonedContentEls
            endindCommentNode.textContent = makeEndingComment(cloned); // Note: mutates clonedContentEls
            childBlockMap[key].startingCommentNode = startingCommentNode;
        }
        // Append new contents to the DOM
        const referenceEndingComment = contentToClone[contentToClone.length - 1];
        const parent = referenceEndingComment.parentNode;
        const before = referenceEndingComment.nextSibling;
        if (before) clonedContentEls.forEach(el => { parent.insertBefore(el, before); });
        else clonedContentEls.forEach(el => { parent.appendChild(el); });
        //
        const _crefs = {
            [clonedBlock.id]: makeBlockRefComment(clonedBlock, clonedContentEls[0])
        };
        for (const key in childBlockMap) {
            const {cloned, startingCommentNode} = childBlockMap[key];
            _crefs[cloned.id] = makeBlockRefComment(cloned, startingCommentNode);
        }
        for (const clonedBlockId in _crefs) {
            this.registerBlockMouseListeners(_crefs[clonedBlockId]);
            this.registerLocalLinkEventHandlers(_crefs[clonedBlockId].startingCommentNode.parentElement);
        }
        return Promise.resolve(_crefs);
    }
    /**
     * @param {Block} block
     * @param {Block} replacement
     * @returns {Promise<BlockRefComment|{[blockId: String]: BlockRefComment;}>}
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
            if (replacement.type !== 'GlobalBlockReference') {
                const cref = makeBlockRefComment(replacement, contents[0]);
                this.replaceBlockMouseListeners(cref, replacement);
                return cref;
            }
            replacement._cref = makeBlockRefComment(replacement, contents[0]);
            const crefs = scanAndCreateBlockRefCommentsFrom(replacement.getRootDomNode());
            const crefsOut = {[replacement.id]: replacement._cref};
            for (const crefCom of crefs) {
                crefsOut[crefCom.blockId] = crefCom;
            }
            return crefsOut;
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
        }).then(() => {
            this.replaceBlockMouseListeners(block._cref, block);
        });
    }
    /**
     * @param {HTMLElement} outerEl = document.body
     * @access private
     */
    registerLocalLinkEventHandlers(outerEl = document.body) {
        let currentOrigHref = '';
        let timeout = null;
        Array.from(outerEl.querySelectorAll('a')).forEach(a => {
            if (a.hasListener)
                return;
            a.addEventListener('mousedown', e => {
                if (e.button !== 0) return;
                this.allowClick = false;
                currentOrigHref = e.target.href;
                this.handlers.onLocalLinkClickStarted(e);
                timeout = setTimeout(() => {
                    if (!currentOrigHref) return;
                    this.handlers.onLocalLinkClickEnded();
                    timeout = null;
                    window.location.href = this.isLocalLink(a)
                        ? `${currentOrigHref}${a.search[0] !== '?' ? '?' : '&'}in-edit`
                        : currentOrigHref;
                }, 325);
            });
            a.addEventListener('click', e => {
                if (e.button !== 0) return;
                e.preventDefault();
            });
            a.addEventListener('mouseup', e => {
                if (e.button !== 0) return;
                if (timeout) { this.allowClick = true; clearTimeout(timeout); timeout = null; }
                this.handlers.onLocalLinkClickEnded();
            });
            a.hasListener = true;
        });
    }
    /**
     * @param {Block} blockToMove
     * @param {Block} blockToMoveTo
     * @param {'before'|'after'|'as-child'} position
     * @access public
     */
    reOrderBlocksInDom(blockToMove, blockToMoveTo, position) {
        const targetStartingComment = blockToMoveTo._cref.startingCommentNode;
        const targetParent = targetStartingComment.parentElement;
        /*
         *                          <- move here
         * <!-- block-start ... -->
         * ...
         */
        if (position === 'before') {
            this.getBlockContents(blockToMove).forEach(n => targetParent.insertBefore(n, targetStartingComment));
        /*
         * <!-- block-start ... -->
         * ...
         * <!-- block-end ... -->
         *                          <- move here
         * <span> (marker)          <- then remove the marker
         */
        } else if (position === 'after') {
            const targetBlockContents = this.getBlockContents(blockToMoveTo);
            const endingComment = targetBlockContents[targetBlockContents.length - 1];
            //
            const marker = document.createElement('span');
            if (endingComment.nextSibling) targetParent.insertBefore(marker, endingComment.nextSibling);
            else targetParent.appendChild(marker);
            //
            this.getBlockContents(blockToMove).forEach(n => targetParent.insertBefore(n, marker));
            targetParent.removeChild(marker);
        /*
         * <!-- block-start ... -->
         * <section> (rootDomNode)
         * ...                      <- move here
         * </section>
         * <!-- block-end ... -->
         */
        } else if (position === 'as-child') {
            const to = blockToMoveTo.getRootDomNode();
            this.getBlockContents(blockToMove).forEach(n => to.appendChild(n));
        } else {
            throw new Error(`Invalid drop position ${position}`);
        }
    }
    /**
     * @param {Block} globalBlockReference
     * @param {Block} blockToConvert
     * @returns {BlockRefComment}
     * @access public
     */
    convertToGlobal(globalBlockReference, blockToConvert) {
        const contents = this.getBlockContents(blockToConvert);
        const startingComment = contents[0];
        const endingComment = contents[contents.length - 1];
        // Insert GlobalBlockReference's starting comment before starting comment of blockToConvert
        const newStartingComment = document.createComment(makeStartingComment(globalBlockReference));
        startingComment.parentElement.insertBefore(newStartingComment, startingComment);
        // Append GlobalBlockReference's ending comment after ending comment of blockToConvert
        const nextEl = endingComment.nextElementSibling || endingComment.nextSibling;
        const newEndingComment = document.createComment(makeEndingComment(globalBlockReference));
        if (nextEl) nextEl.parentElement.insertBefore(newEndingComment, nextEl);
        else endingComment.parentElement.appendChild(newEndingComment);
        //
        return makeBlockRefComment(globalBlockReference, newStartingComment);
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
        getTitleEls().forEach(el => {
            el.textContent = text;
        });
    }
    /**
     * @param {BlockRefComment} blockRef
     * @param {HTMLElement=} nextEl = null
     * @access public
     */
    registerBlockMouseListeners(blockRef, nextEl = null) {
        if (nextEl === null) {
            const comment = blockRef.startingCommentNode;
            nextEl = comment.nextElementSibling || comment.nextSibling;
        }
        nextEl.addEventListener('mouseover', e => {
            if (e.target !== this.currentlyHoveredEl) {
                this.currentlyHoveredEl = e.target;
                e.stopPropagation();
                if (this.currentlyHoveredRootEl !== nextEl) {
                    this.currentlyHoveredRootEl = nextEl;
                    this.currentlyHoveredBlockRef = blockRef;
                    this.handlers.onHoverStarted(this.currentlyHoveredBlockRef, nextEl.getBoundingClientRect());
                }
            }
        });
        nextEl.addEventListener('mouseleave', e => {
            if (e.target === this.currentlyHoveredRootEl) {
                e.stopPropagation();
                this.handlers.onHoverEnded(this.currentlyHoveredBlockRef);
                this.currentlyHoveredEl = null;
                this.currentlyHoveredBlockRef = null;
                this.currentlyHoveredRootEl = null;
            }
        });
    }
    /**
     * @param {Block} block
     * @param {() => {parent: HTMLElement; before: HTMLElement|null; prevChildNodes?: Array<HTMLElement>;}} getSettings
     * @param {Boolean} doInsertCommentBoundaryComments = false
     * @returns {Promise<Comment|null>}
     * @access private
     */
    renderBlockInto(block, getSettings, doInsertCommentBoundaryComments = false) {
        const startingComment = !doInsertCommentBoundaryComments ? null : makeStartingComment(block);
        const temp = document.createElement('template');
        const markerHtml = !block.children.length ? null : '<span id="temp-marker"></span>';
        const htmlOrPromise = block.toHtml(markerHtml);
        return (typeof htmlOrPromise === 'string'
            ? Promise.resolve(htmlOrPromise)
            : htmlOrPromise.then(newHtml => {
                const startAt = `<!--${makeStartingComment(block)}-->`.length;
                return newHtml.substr(
                    startAt,
                    newHtml.length - `<!--${makeEndingComment(block)}-->`.length - startAt
                );
            })
        ).then(newHtml => {
            const {parent, before, prevChildNodes} = getSettings();
            //
            temp.innerHTML = !doInsertCommentBoundaryComments
                ? newHtml
                : `<!--${startingComment}-->${newHtml}<!--${makeEndingComment(block)}-->`;
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
     * @param {Boolean} doIncludeBoundaryComments = true
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
     * @param {Block} block
     * @access private
     */
    replaceBlockMouseListeners(blockRef, block) {
        this.registerBlockMouseListeners(blockRef);
        this.registerLocalLinkEventHandlers(block._cref.startingCommentNode.parentElement);
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
 * @param {HTMLElement} el = document.body
 * @returns {Array<BlockRefComment>}
 */
function scanAndCreateBlockRefCommentsFrom(el = document.body) {
    const L1 = /* <!-- */ ' block-start '.length;
    const L2 = ' '.length /* --> */;
    const out = [];
    for (const c of getAllComments(el)) {
        if (!c.nodeValue.startsWith(' block-start '))
            continue;
        const pair = c.nodeValue.substr(L1, c.nodeValue.length - L1 - L2);
        const [blockId, blockType] = pair.split(':');
        const PUSH_ID_LENGTH = 20;
        if (blockId.length !== PUSH_ID_LENGTH)
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

/**
 * @return {Array<HTMLElement>}
 */
function getTitleEls() {
    return Array.from(document.querySelectorAll('[data-prop="title"]'));
}

/**
 * https://stackoverflow.com/a/2911045
 *
 * @param {Location} location = window.location
 * @returns {(link: HTMLAnchorElement) => Boolean}
 */
function createIsLocalLinkCheckFn(location = window.location) {
    const host = location.hostname;
    return a => a.hostname === host || !a.hostname.length;
}

export default EditAppAwareWebPage;
