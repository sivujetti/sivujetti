class EditAppAwareWebPage {
    // data;
    // currentlyHoveredEl;
    // currentlyHoveredRootEl;
    // currentlyHoveredBlockRef;
    // allowOpenBlockClick:
    // isLocalLink:
    /**
     * @param {CurrentPageData} dataFromAdminBackend
     */
    constructor(dataFromAdminBackend) {
        this.data = dataFromAdminBackend;
        this.currentlyHoveredEl = null;
        this.currentlyHoveredRootEl = null;
        this.currentlyHoveredBlockRef = null;
        this.allowOpenBlockClick = true;
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
            let target;
            if (!this.currentlyHoveredEl)
                target = null;
            else if (e.target.nodeName === 'A' && !this.allowOpenBlockClick)
                target = null;
            else
                target = this.currentlyHoveredBlockRef;
            this.handlers.onClicked(target);
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
        const commentOrPseudoComment = this.getAfterNode(after);
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
                                  updateClonedBlockElAttrs(contentToClone[1].cloneNode(true), clonedBlock.id),
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
            updateClonedBlockElAttrs(startingCommentNode.nextElementSibling, cloned.id);
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
     * @param {Array<HTMLElement>} originalDomNodes A value returned from this.getBlockContents()
     * @param {Block|{parentNode: HTMLElement|null; nextSibling: HTMLElement|null;}} after
     * @returns {Promise<void>}
     * @access public
     */
    restoreBlockToDom(originalDomNodes, after) {
        if (originalDomNodes[0].nodeType !== Node.COMMENT_NODE)
            throw new Error('Expected $domNodes to be a return value of getBlockContents()');
        const commentOrPseudoComment = this.getAfterNode(after);
        const parent = commentOrPseudoComment.parentNode;
        const before = commentOrPseudoComment.nextSibling;
        if (before) originalDomNodes.forEach(el => { parent.insertBefore(el, before); });
        else originalDomNodes.forEach(el => { parent.appendChild(el); });
        return Promise.resolve();
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
            const first = replacement.__globalBlockTree.blocks[0];
            const crefsOut = {[replacement.id]: replacement._cref,
                              [first.id]: makeBlockRefComment(first, replacement._cref.startingCommentNode.nextSibling)};
            const pseudo = {_cref: crefsOut[first.id]};
            this.replaceBlockMouseListeners(pseudo._cref, pseudo);
            for (const crefCom of crefs) {
                const pseudo2 = {_cref: crefCom};
                this.replaceBlockMouseListeners(pseudo2._cref, pseudo2);
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
            if (this.isMouseListenersDisabled) return;
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
     * @param {Boolean} isDisabled
     * @access public
     */
    setIsMouseListenersDisabled(isDisabled) {
        this.isMouseListenersDisabled = isDisabled;
    }
    /**
     * @param {Block} block
     * @param {Boolean} doIncludeBoundaryComments = true
     * @returns {Array<HTMLElement>}
     * @access public
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
     * @param {String} varName
     * @param {RawCssValue} to
     */
    setCssVarValue(varName, {type, value}) {
        if (!isValidIdentifier(varName))
            throw new Error(`\`${varName}\` is not valid var name`);
        if (type !== 'color')
            throw new Error('Not implemented yet');
        document.documentElement.style.setProperty(`--${varName}`, `#${value.join('')}`);
    }
    /**
     * Note: this method does not validate the input css in any way.
     *
     * @param {{type: 'singleBlock'|'blockType'|'global'; id: String;}} style
     * @param {String} css
     */
    updateCssStyles({type, id}, css) {
        if (type === 'singleBlock') {
            document.head.querySelector(`style[${temp1(type)}="${id}"]`).innerHTML=temp2(type, id, css);
        } else if (type === 'blockType') {
            if (!isValidIdentifier(id))
                throw new Error(`\`${id}\` is not valid block type name`);
            document.head.querySelector(`style[${temp1(type)}="${id}"]`).innerHTML=temp2(type, id, css);
        } else if (type === 'global') {
            // todo
        } else throw new Error();
    }
    /**
     * Note: this method does not validate the input css in any way.
     *
     * @param {'singleBlock'|'blockType'|'global'} target
     * @param {String} id Target's identifier (block id, or block type name)
     * @param {String} css
     */
    updateCssStylesIfChanged(type, id, css) {
        if (type !== 'singleBlock' && type !== 'blockType')
            throw new Error('Not implemented yet');
        const attrName = temp1(type);
        const sel = `style[${attrName}="${id}"]`;
        if (!document.head.querySelector(sel)) {
            const node = document.createElement('style');
            node.setAttribute(attrName, id);
            document.head.appendChild(node);
        }
        const current = document.head.querySelector(sel);
        const newv = temp2(type, id, css);
        if (current.innerHTML !== newv)
            current.innerHTML = newv;
    }
    /**
     * @param {HTMLElement} outerEl = document.body
     * @access private
     */
    registerLocalLinkEventHandlers(outerEl = document.body) {
        const doFollowLink = el => {
            window.location.href = this.isLocalLink(el)
                ? `${el.href}${el.search[0] !== '?' ? '?' : '&'}in-edit`
                : el.href;
        };
        let lastClickedAt = 0;
        Array.from(outerEl.querySelectorAll('a')).forEach(a => {
            if (a.hasListener)
                return;
            a.addEventListener('click', e => {
                if (e.button !== 0) return;
                e.preventDefault();
                if (this.isMouseListenersDisabled) {
                    doFollowLink(a);
                } else {
                    if (lastClickedAt && Date.now() - lastClickedAt < 300) {
                        doFollowLink(a);
                        lastClickedAt = 0;
                    }
                    lastClickedAt = Date.now();
                }
            });
            a.hasListener = true;
        });
        Array.from(outerEl.querySelectorAll('.jet-form button[type="submit"]')).forEach(btn => {
            if (btn.hasListener)
                return;
            btn.addEventListener('click', e => {
                if (e.button !== 0) return;
                e.preventDefault();
                if (this.isMouseListenersDisabled)
                    btn.click();
            });
            btn.hasListener = true;
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
        const isBackendRender = typeof htmlOrPromise !== 'string';
        return (!isBackendRender
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
            const markerEl = markerHtml || isBackendRender ? document.getElementById('temp-marker') : null;
            if (markerHtml)
                prevChildNodes.forEach(el => { markerEl.parentNode.insertBefore(el, markerEl); });
            if (markerEl)
                markerEl.parentNode.removeChild(markerEl);
            //
            return !doInsertCommentBoundaryComments
                ? null
                : getAllComments(parent).find(c => c.nodeValue === startingComment);
        });
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
    /**
     * @param {Block|{parentNode: HTMLElement|null; nextSibling: HTMLElement|null;}} after
     * @returns {Comment|{parentNode: HTMLElement|null; nextSibling: HTMLElement|null;}}
     * @access private
     */
    getAfterNode(after) {
        let commentOrPseudoComment;
        if (after._cref) { // Block
            commentOrPseudoComment = this.getBlockContents(after).pop();
            if (!commentOrPseudoComment) throw new Error(`Failed to ending comment for "${makeStartingComment(after)}"`);
            return commentOrPseudoComment;
        }
        // Pseudo comment / marker
        return after;
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
 * @returns {Array<HTMLElement>}
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

/**
 * @param {String} str
 * @returns {Boolean}
 */
function isValidIdentifier(str) {
    return /^[a-zA-Z_]{1}\w*$/.test(str);
}

/**
 * @param {HTMLElement} clonedDomNode
 * @param {String} blockId
 * @returns {HTMLElement}
 */
function updateClonedBlockElAttrs(clonedDomNode, blockId) {
    if (!clonedDomNode.getAttribute('data-block')) // probably RichText
        return clonedDomNode;
    clonedDomNode.setAttribute('data-block', blockId);
    return clonedDomNode;
}

function temp1(type) {
    if (type === 'singleBlock')
        return 'data-styles-for-block';
    if (type === 'blockType')
        return 'data-styles-for-block-type';
}
function temp2(type, id, css) {
    if (type === 'singleBlock')
        return compileSivujettiFlavoredCss(`[data-block="${id}"]`, css);
    if (type === 'blockType')
        return compileSivujettiFlavoredCss(`[data-block-type="${id}"]`, css);
}
function compileSivujettiFlavoredCss(sel, css) {
    return css.replace(/:self/g, sel);
}

/**
 * Calls $fn once every $tryEveryMillis until it returns true or $stopTryingAfterNTimes
 * is reached.
 *
 * @param {() => Boolean} fn
 * @param {Number} tryEveryMillis = 200
 * @param {Number} stopTryingAfterNTimes = 5
 * @param {String} messageTmpl = 'fn() did not return true after %sms'
 * @returns {fn() => void}
 */
function createTrier(fn,
                     tryEveryMillis = 200,
                     stopTryingAfterNTimes = 5,
                     messageTmpl = 'fn() did not return true after %sms') {
    let tries = 0;
    const callTryFn = () => {
        const ret = fn();
        if (ret === true) {
            return;
        }
        if (ret === false) {
            if (++tries < stopTryingAfterNTimes)
                setTimeout(callTryFn, tryEveryMillis);
            else
                window.console.error(messageTmpl.replace('%s', tries * tryEveryMillis));
        } else {
            throw new Error('fn must return true or false, got: ', ret);
        }
    };
    return callTryFn;
}

export default EditAppAwareWebPage;
export {createTrier, compileSivujettiFlavoredCss};
