const CHILDREN_START = ' children-start ';
const CHILDREN_END = ' children-end ';
const CHILD_CONTENT_PLACEHOLDER = '<!-- children-placeholder -->';

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
     * @returns {Array<HTMLElement}
     * @access public
     */
    scanBlockElements() {
        this.deletedInnerContentStorage = new Map;
        this.currentlyHoveredBlockEl = null;
        this.revertSwapStacks = new Map;
        return Array.from(document.body.querySelectorAll('[data-block-type]'));
    }
    /**
     * Adds <!-- children-start|end --> comments to document.body.
     *
     * @param {RawBlock2} lastBlock
     * @access public
     */
    addRootBoundingEls(lastBlock) {
        const rootEl = document.body;
        rootEl.insertBefore(document.createComment(' children-start '), rootEl.firstChild);
        const lastEl = lastBlock.type !== 'GlobalBlockReference' ? rootEl.querySelector(`[data-block="${lastBlock.id}"]`)
            : findCommentR(rootEl, ` block-end ${lastBlock.id} `);
        const nextOfLast = lastEl.nextSibling;
        if (nextOfLast) nextOfLast.parentElement.insertBefore(document.createComment(' children-end '), nextOfLast);
        else lastEl.parentElement.appendChild(document.createComment(' children-end '));
    }
    /**
     * @param {String} blockId
     * @param {String} trid
     * @access public
     */
    setTridAttr(blockId, trid) {
        const el = document.body.querySelector(`[data-block="${blockId}"]`);
        el.setAttribute('data-trid', trid);
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
     * @param {EditAwareWebPageEventHandlers2} handlers
     * @access public
     */
    registerEventHandlers2(handlers) {
        if (this.handlers) return;
        this.handlers = handlers;
        //
        let isDown = false;
        let lastDownLink = null;
        let lastDownLinkAlreadyHandled = false;
        document.body.addEventListener('mousedown', e => {
            if (!(this.currentlyHoveredBlockEl || this.isMouseListenersDisabled)) return;
            isDown = true;
            const a = e.button !== 0 ? null : e.target.nodeName === 'A' ? e.target : e.target.closest('a');
            if (!a || a.classList.contains('j-Button')) return;
            lastDownLink = a;
            lastDownLinkAlreadyHandled = false;
            setTimeout(() => {
                if (isDown && e.button === 0) {
                    lastDownLinkAlreadyHandled = true;
                    this.handlers.onClicked(this.currentlyHoveredBlockEl);
                }
            }, 80);
        });
        document.body.addEventListener('click', e => {
            const currentBlock = this.currentlyHoveredBlockEl;
            isDown = false;
            if (!lastDownLink) {
                if (this.isMouseListenersDisabled) { this.handlers.onClicked(currentBlock); return; }
                const b = e.button !== 0 ? null : e.target.classList.contains('j-Button') ? e.target : e.target.closest('.j-Button');
                if (b) e.preventDefault();
                this.handlers.onClicked(currentBlock);
            } else {
                e.preventDefault();
                if (!lastDownLinkAlreadyHandled) {
                    this.handlers.onClicked(null, lastDownLink);
                    this.doFollowLink(lastDownLink);
                }
                lastDownLink = null;
            }
        });
        //
        document.body.addEventListener('mouseover', e => {
            if (this.isMouseListenersDisabled) return;
            //
            let targ;
            if (this.currentlyHoveredBlockEl) {
                targ = e.target;
            } else {
                targ = e.target.closest('[data-block-type]');
                if (!targ) return;
            }
            //
            if (this.currentlyHoveredBlockEl) {
                const b = e.target.getAttribute('data-block-type') ? e.target : e.target.closest('[data-block-type]');
                if (this.currentlyHoveredBlockEl.contains(b) && this.currentlyHoveredBlockEl !== b) {
                    this.handlers.onHoverEnded(this.currentlyHoveredBlockEl);
                    this.currentlyHoveredBlockEl = b;
                    this.handlers.onHoverStarted(this.currentlyHoveredBlockEl, this.currentlyHoveredBlockEl.getBoundingClientRect());
                }
            } else {
                if (!targ.getAttribute('data-block-type')) return;
                this.currentlyHoveredBlockEl = targ;
                this.handlers.onHoverStarted(this.currentlyHoveredBlockEl, this.currentlyHoveredBlockEl.getBoundingClientRect());
            }
        }, true);
        //
        document.body.addEventListener('mouseleave', e => {
            if (this.isMouseListenersDisabled) return;
            //
            if (this.currentlyHoveredBlockEl) {
                if (e.target === this.currentlyHoveredBlockEl) {
                    this.handlers.onHoverEnded(this.currentlyHoveredBlockEl);
                    this.currentlyHoveredBlockEl = null;
                }
            }
        }, true);
    }
    /**
     * @param {String} trid
     * @param {blockTreeUtils} blockTreeUtils
     * @param {(block: RawBlock2) => {[key: String]: any;}} blockToTransferable
     * @param {BlockTypes} blockTypes
     * @param {(trid: String) => Array<RawBlock2>} getTree
     * @param {hack} t
     * @returns {(blockTreeState: BlockTreeReduxState) => void}
     */
    createBlockTreeChangeListener(trid, blockTreeUtils, blockToTransferable, blockTypes, getTree, t) {
        /**
         * @param {RawBlock2} b
         * @returns {String}
         */
        const getVisibleBlockId = b =>
            b.type !== 'GlobalBlockReference' ? b.id : getTree(b.globalBlockTreeId)[0].id
        ;
        /**
         * @param {RawBlock2|null} of
         * @param {HTMLElement} treeRootEl
         */
        const getInsertRefEl = (of, treeRootEl) => {
            const el = of ? treeRootEl.querySelector(`[data-block="${getVisibleBlockId(of)}"]`) : null;
            if (!el) return null;
            //
            return of.type !== 'GlobalBlockReference'
                // <some-el> <- this
                //   ...
                ? el
                // <!-- block-start...:GlobalBlockReference...--> <- this
                // <some-el>
                //   ...
                : el.previousSibling;
        };
        /**
         * @param {HTMLElement} el
         * @returns {[HTMLElement|Comment, () => void]}
         */
        const createNextRef = el => {
            const next = el.nextSibling;
            if (next) return [!isGlobalBlockTreeRefsEndMarker(next) ? next : next.nextSibling, noop];
            const marker = document.createComment(' temp ');
            el.parentElement.appendChild(marker);
            return [marker, () => { marker.parentElement.removeChild(marker); }];
        };
        /**
         * @param {RawBlock2} moveBlock
         * @param {HTMLElement} treeRootEl
         * @returns {Array<HTMLElement|Comment>}
         */
        const getElsToMove = (moveBlock, treeRootEl) => {
            const el = treeRootEl.querySelector(`[data-block="${getVisibleBlockId(moveBlock)}"]`);
            return moveBlock.type !== 'GlobalBlockReference' ? [el] : [el.previousSibling, el, el.nextSibling];
        };
        /**
         * @param {RawBlock2} beforeBlock
         * @param {RawBlock2} moveBlock
         * @param {HTMLElement} treeRootEl
         */
        const moveBefore = (beforeBlock, moveBlock, treeRootEl) => {
            const movables = getElsToMove(moveBlock, treeRootEl);
            const moveToEl = beforeBlock.type !== 'GlobalBlockReference'
                ? treeRootEl.querySelector(`[data-block="${beforeBlock.id}"]`)
                : getInsertRefEl(beforeBlock, treeRootEl);
            movables.forEach(movable => moveToEl.parentElement.insertBefore(movable, moveToEl));
            return movables;
        };
        /**
         * @param {RawBlock2} afterBlock
         * @param {RawBlock2} moveBlock
         * @param {HTMLElement} treeRootEl
         */
        const moveAfter = (afterBlock, moveBlock, treeRootEl) => {
            const movables = getElsToMove(moveBlock, treeRootEl);
            const [ref, cleanUp] = createNextRef(treeRootEl.querySelector(`[data-block="${getVisibleBlockId(afterBlock)}"]`));
            movables.forEach(movable => ref.parentElement.insertBefore(movable, ref));
            cleanUp();
            return movables;
        };
        /**
         * @param {RawBlock2} parentBlock
         * @param {RawBlock2} moveBlock
         * @param {HTMLElement} treeRootEl
         */
        const moveToChild = (parentBlock, moveBlock, treeRootEl) => {
            const el = treeRootEl.querySelector(`[data-block="${getVisibleBlockId(parentBlock)}"]`);
            const endcom = getChildEndComment(getBlockContentRoot(el));
            const movables = getElsToMove(moveBlock, treeRootEl);
            movables.forEach(movable => endcom.parentElement.insertBefore(movable, endcom));
            return movables;
        };
        /**
         * @param {RawBlock2} blockToMove
         * @param {HTMLElement} treeRootEl
         * @returns {() => void}
         */
        const createGetRevertRef = (blockToMove, treeRootEl) => {
            let next = treeRootEl.querySelector(`[data-block="${getVisibleBlockId(blockToMove)}"]`).nextSibling;
            if (blockToMove.type === 'GlobalBlockReference') next = next.nextSibling;
            if (next.nodeType === Node.COMMENT_NODE && next.nodeValue === CHILDREN_END) {
                const p = next.parentElement;
                const blockId = p !== treeRootEl ? p.getAttribute('data-block') || p.closest('[data-block]').getAttribute('data-block') : '';
                return () => getChildEndComment(getBlockContentRoot(blockId ? treeRootEl.querySelector(`[data-block="${blockId}"]`) : treeRootEl));
            }
            if (isGlobalBlockTreeRefsStartMarker(next)) {
                const blockId = next.nextSibling.getAttribute('data-block');
                return () => treeRootEl.querySelector(`[data-block="${blockId}"]`).previousSibling;
            }
            const blockId = next.getAttribute('data-block');
            if (blockId) return () => treeRootEl.querySelector(`[data-block="${blockId}"]`);
            throw new Error();
        };
        return ({tree, context}) => {
            if (!context || (context[0] !== 'init' && t.receivingData)) return;
            const event = context[0];
            const treeRootEl = document.body;
            if (event === 'swap-blocks') {
                const [mut1, mut2] = context[1];
                const {position, blockToMove, blockToMoveTo} = mut1;
                if (context[2] !== 'dnd-spawner') {
                    if (!this.revertSwapStacks.has(blockToMove.id)) this.revertSwapStacks.set(blockToMove.id, []);
                    this.revertSwapStacks.get(blockToMove.id).push(createGetRevertRef(blockToMove, treeRootEl));
                }
                if (!mut2) {
                    if (position === 'before')
                        moveBefore(blockToMoveTo, blockToMove, treeRootEl);
                    else if (position === 'after')
                        moveAfter(blockToMoveTo, blockToMove, treeRootEl);
                    else if (position === 'as-child')
                        moveToChild(blockToMoveTo, blockToMove, treeRootEl);
                } else {
                    let newTrid = blockToMoveTo.isStoredToTreeId;
                    let movables;
                    if (position === 'before') {
                        movables = moveBefore(blockToMoveTo, blockToMove, treeRootEl);
                    } else if (position === 'after') {
                        movables = moveAfter(blockToMoveTo, blockToMove, treeRootEl);
                    } else if (position === 'as-child') {
                        movables = moveToChild(blockToMoveTo, blockToMove, treeRootEl);
                        if (blockToMoveTo.type === 'GlobalBlockReference') newTrid = blockToMoveTo.globalBlockTreeId;
                    }
                    movables.forEach(el => el.setAttribute('data-trid', newTrid));
                }
                return;
            }
            if (event === 'undo-swap-blocks') {
                const {blockToMove} = context[1];
                const getNext = this.revertSwapStacks.get(blockToMove.id).pop();
                const next = getNext();
                const movables = getElsToMove(blockToMove, treeRootEl);
                movables.forEach(movable => next.parentElement.insertBefore(movable, next));
                return;
            }
            //
            const isAdd = event === 'add-single-block';
            if (isAdd || event === 'undo-delete-single-block') {
                const [block, containingBranch, parent] = blockTreeUtils.findBlock(context[1].blockId, tree);
                const addHtmlToDom = ({html, onAfterInsertedToDom}, isPreRender) => {
                    const temp = document.createElement('template');
                    const hasPlace = html.indexOf(CHILD_CONTENT_PLACEHOLDER) > -1;
                    const rendered = withTrid(html, trid, !hasPlace);
                    let childRep;
                    if (!isPreRender) {
                        // Normal 'add-single-block' -> remove child placeholder
                        childRep = '';
                        // 'add-single-block' but cloneOf is provided -> replace child placeholder with its child content
                        if (isAdd && context[1].cloneOf) childRep = cloneChildContent(blockTreeUtils.findBlock(context[1].cloneOf, tree)[0],
                            blockTreeUtils.findBlock(context[1].blockId, tree)[0],
                            blockTreeUtils,
                            treeRootEl);
                        // 'undo-delete-single-block' -> replace child placeholder with an entry from deleteCache
                        else if (!isAdd)
                            childRep = this.getAndWipeStoredInnerContent(block) || '';
                    } else {
                        // Pre-render, always remove child placeholder
                        childRep = '';
                    }
                    const completed = hasPlace ? rendered.replace(CHILD_CONTENT_PLACEHOLDER, childRep) : rendered;
                    temp.innerHTML = completed;
                    const nextBlock = containingBranch[containingBranch.indexOf(block) + 1] || null;
                    const nextEl = getInsertRefEl(nextBlock, treeRootEl);
                    if (nextEl)
                        nextEl.parentElement.insertBefore(temp.content, nextEl);
                    else {
                        const el = parent ? treeRootEl.querySelector(`[data-block="${getVisibleBlockId(parent)}"]`)
                            : trid === 'main' ? treeRootEl : treeRootEl.querySelector(`[data-block="${tree[0].id}"]`);
                        const endcom = getChildEndComment(getBlockContentRoot(el));
                        endcom.parentElement.insertBefore(temp.content, endcom);
                    }
                    onAfterInsertedToDom(completed);
                };
                const possiblePreRender = context[3];
                if (!possiblePreRender)
                    renderBlockAndThen(block, addHtmlToDom, blockTypes);
                else
                    addHtmlToDom(possiblePreRender, true);
                return;
            }
            //
            if (event === 'delete-single-block' || event === 'undo-add-single-block') {
                const data = context[1];
                if (data.blockType !== 'GlobalBlockReference') {
                    const {blockId} = data;
                    const el = treeRootEl.querySelector(`[data-block="${blockId}"]`);
                    const html = getChildContent(el);
                    if (html) this.deletedInnerContentStorage.set(blockId, html);
                    el.parentElement.removeChild(el);
                } else {
                    const blockId = getTree(data.isRootOfOfTrid)[0].id;
                    const el = treeRootEl.querySelector(`[data-block="${blockId}"]`);
                    const deletables = [el.previousSibling, el, el.nextSibling];
                    deletables.forEach(el => el.parentElement.removeChild(el));
                }
                return;
            }
            //
            const isNormalUpdate = event === 'update-single-value';
            if (isNormalUpdate || event === 'undo-update-single-value') {
                const {blockId} = context[1];
                const block = blockTreeUtils.findBlock(blockId, tree)[0];
                const el = treeRootEl.querySelector(`[data-block="${block.id}"]`);
                const trans = (function (out) { out.children = []; return out; })(blockToTransferable(block));
                renderBlockAndThen(trans, ({html, onAfterInsertedToDom}) => {
                    let childContent = null;
                    if (isNormalUpdate) { // Not undo -> cache current child content
                        childContent = getChildContent(el);
                        this.deletedInnerContentStorage.set(blockId, childContent);
                    } else {
                        // Undo -> use previously cached child content
                        childContent = this.getAndWipeStoredInnerContent(block) || getChildContent(el);
                    }
                    const temp = document.createElement('template');
                    const completed = withTrid(html, trid).replace(CHILD_CONTENT_PLACEHOLDER, childContent);
                    temp.innerHTML = completed;
                    el.replaceWith(temp.content);
                    onAfterInsertedToDom(completed);
                }, blockTypes);
                return;
            }
            //
            if (event === 'convert-block-to-global') {
                const newGbtBlocks = getTree(context[1].isRootOfOfTrid);
                const originalBlockId = newGbtBlocks[0];
                const el = treeRootEl.querySelector(`[data-block="${originalBlockId.id}"]`);
                el.parentElement.insertBefore(document.createComment(` block-start ${context[1].blockId}:GlobalBlockReference `), el);
                (function (endcom, nextEl) {
                    if (nextEl) nextEl.parentElement.insertBefore(endcom, nextEl);
                    else el.parentElement.appendChild(endcom);
                })(document.createComment(` block-end ${context[1].blockId} `), el.nextSibling);
                blockTreeUtils.traverseRecursively(newGbtBlocks, b => this.setTridAttr(b.id, context[1].isRootOfOfTrid));
                return;
            }
            //
            if (event === 'undo-convert-block-to-global') {
                const gbtBlocks = getTree(context[1].isRootOfOfTrid);
                const outermost = treeRootEl.querySelector(`[data-block="${gbtBlocks[0].id}"]`);
                [outermost.previousSibling, outermost.nextSibling].forEach(com => outermost.parentElement.removeChild(com));
                blockTreeUtils.traverseRecursively(gbtBlocks, b => this.setTridAttr(b.id, 'main'));
                return;
            }
        };
    }
    /**
     * @returns {(state: {themeStyles: Array<ThemeStyle>; [key: String]: any;}, eventInfo: ['themeStyles/addStyle'|'themeStyles/removeStyle'|'themeStyles/addUnitTo'|'themeStyles/removeUnitFrom', [String]|[ThemeStyle, String], Object]) => void}
     */
    createThemeStylesChangeListener() {
        const upsertInlineStyle = (blockTypeName, style) => {
            const css = style.units.map(({generatedCss}) => generatedCss).join('\n');
            const node = document.head.querySelector(`style[data-style-units-for="${blockTypeName}"]`);
            if (node) {
                node.innerHTML = css;
            } else {
                const node = document.createElement('style');
                node.setAttribute('data-style-units-for', blockTypeName);
                node.innerHTML = css;
                document.head.appendChild(node);
            }
        };
        return ({themeStyles}, [event, data]) => {
            if (event === 'themeStyles/updateUnitOf' || event === 'themeStyles/addUnitTo' || event === 'themeStyles/removeUnitFrom') {
                const blockTypeName = data[0]; // data: [String, String, {[key: String]: String;}]|[String]
                const style = themeStyles.find(s => s.blockTypeName === blockTypeName);
                upsertInlineStyle(blockTypeName, style);
            } else if (event === 'themeStyles/addStyle') {
                const {blockTypeName} = data[0]; // data: [ThemeStyle]
                upsertInlineStyle(blockTypeName, data[0]);
            } else if (event === 'themeStyles/removeStyle') {
                const blockTypeName = data[0]; // data: [String]
                const node = document.head.querySelector(`style[data-style-units-for="${blockTypeName}"]`);
                node.parentElement.removeChild(node);
            }
        };
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
                    b.isStoredToTreeId = 'main';
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
        let lastClickedAt = 0;
        Array.from(outerEl.querySelectorAll('a')).forEach(a => {
            if (a.hasListener)
                return;
            a.addEventListener('click', e => {
                if (e.button !== 0) return;
                e.preventDefault();
                if (this.isMouseListenersDisabled) {
                    this.doFollowLink(a);
                } else {
                    if (lastClickedAt && Date.now() - lastClickedAt < 300) {
                        this.doFollowLink(a);
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
    /**
     * @param {RawBlock2} block
     * @returns {String|undefined}
     * @access private
     */
    getAndWipeStoredInnerContent(block) {
        const cached = this.deletedInnerContentStorage.get(block.id);
        if (!cached) return null;
        this.deletedInnerContentStorage.delete(block.id);
        return cached;
    }
    /**
     * @param {HTMLAnchorElement} el
     * @access private
     */
    doFollowLink(el) {
        window.location.href = this.isLocalLink(el)
            ? `${el.href}${el.search[0] !== '?' ? '?' : '&'}in-edit`
            : el.href;
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

/**
 * @param {HTMLElement} el
 * @returns {HTMLElement}
 */
function getBlockContentRoot(el) {
    return el.querySelector(':scope > [data-block-root]') || el;
}

/**
 * @param {HTMLElement} of
 * @param {Boolean} doIncludeBoundaryComments = false
 * @returns {String}
 */
function getChildContent(of, doIncludeBoundaryComments = false) {
    const start = getChildStartComment(getBlockContentRoot(of));
    if (!start) return '';
    //
    const htmls = doIncludeBoundaryComments ? [`<!--${start.nodeValue}-->`] : [];
    let el = start.nextSibling;
    while (el) {
        if (el.nodeType === Node.COMMENT_NODE && el.nodeValue === CHILDREN_END) {
            if (doIncludeBoundaryComments) htmls.push(`<!--${CHILDREN_END}-->`);
            break;
        }
        htmls.push(el.outerHTML);
        el = el.nextSibling;
    }
    return htmls.join('');
}

/**
 * @param {RawBlock2} original
 * @param {RawBlock2} cloned
 * @param {blockTreeUtils} blockTreeUtils
 * @param {HTMLElement} treeRootEl
 * @returns {String}
 */
function cloneChildContent(original, cloned, blockTreeUtils, treeRootEl) {
    const flatOriginal = [];
    blockTreeUtils.traverseRecursively(original.children, b2 => {
        flatOriginal.push(b2);
    });
    const flatCloned = [];
    blockTreeUtils.traverseRecursively(cloned.children, b1 => {
        flatCloned.push(b1);
    });
    const clonedEl = treeRootEl.querySelector(`[data-block="${original.id}"]`).cloneNode(true);
    for (let i = 0; i < flatOriginal.length; ++i)
        clonedEl.querySelector(`[data-block="${flatOriginal[i].id}"]`).setAttribute('data-block', flatCloned[i].id);
    return getChildContent(clonedEl);
}

/**
 * @param {HTMLElement} of
 * @returns {Comment|null}
 */
function getChildStartComment(of) {
    let el = of.firstChild;
    while (el) {
        if (el.nodeType === Node.COMMENT_NODE && el.nodeValue === CHILDREN_START)
            return el;
        el = el.nextSibling;
    }
    return null;
}

/**
 * @param {HTMLElement} of
 * @returns {Comment|null}
 */
function getChildEndComment(of) {
    return findCommentR(of, CHILDREN_END);
}

/**
 * @param {HTMLElement} of
 * @param {String} find
 * @returns {Comment|null}
 */
function findCommentR(of, find) {
    let el = of.lastChild;
    while (el) {
        if (el.nodeType === Node.COMMENT_NODE && el.nodeValue === find)
            return el;
        el = el.previousSibling;
    }
    return null;
}

/**
 * @param {String} html
 * @param {String} trid
 * @param {Boolean} recursive = false
 * @returns {String}
 */
function withTrid(html, trid, recursive = false) {
    return html.replace(!recursive ? ' data-block=' : / data-block=/g, ` data-trid="${trid}" data-block=`);
}

/**
 * @param {String|Promise<String>} result
 * @param {(result: BlockRendctor) => void} to
 */
function getBlockReRenderResult(result, to) {
    if (typeof result === 'string') {
        to({html: result, onAfterInsertedToDom: noop});
        return;
    }
    if (typeof result !== 'object') {
        throw new TypeError('Invalid argumnt');
    }
    if (typeof result.then === 'function') {
        result.then(html => { to({html, onAfterInsertedToDom: noop}); });
        return;
    }
    to(result);
}

/**
 * @param {RawBlock2} block
 * @param {(result: BlockRendctor) => void} then
 * @param {BlockTypes} blockTypes
 * @param {String} childContent = null
 */
function renderBlockAndThen(block, then, blockTypes) {
    const stringOrPromiseOrObj = blockTypes.get(block.type).reRender(
        block,
        () => `<!--${CHILDREN_START}-->${CHILD_CONTENT_PLACEHOLDER}<!--${CHILDREN_END}-->`
    );
    getBlockReRenderResult(stringOrPromiseOrObj, then);
}

/**
 * @param {Node} node
 * @returns {Boolean}
 */
function isGlobalBlockTreeRefsStartMarker(node) {
    return node.nodeType === Node.COMMENT_NODE && node.nodeValue.endsWith(':GlobalBlockReference ');
}

/**
 * @param {Node} node
 * @returns {Boolean}
 */
function isGlobalBlockTreeRefsEndMarker(node) {
    return node.nodeType === Node.COMMENT_NODE && node.nodeValue.indexOf(' block-end ') > -1;
}

function noop() {
    //
}

export default EditAppAwareWebPage;
export {createTrier, renderBlockAndThen, withTrid};
