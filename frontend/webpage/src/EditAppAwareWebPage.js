const CHILDREN_START = ' children-start ';
const CHILDREN_END = ' children-end ';
const CHILD_CONTENT_PLACEHOLDER = '<!-- children-placeholder -->';

class EditAppAwareWebPage {
    // data;
    // currentlyHoveredRootEl;
    // isLocalLink:
    // tempStyleOverrideNames:
    // tempStyleOverrideElsRemoveTimeouts:
    /**
     * @param {CurrentPageData} dataFromAdminBackend
     */
    constructor(dataFromAdminBackend) {
        this.data = dataFromAdminBackend;
        this.currentlyHoveredRootEl = null;
        this.isLocalLink = createIsLocalLinkCheckFn();
        this.tempStyleOverrideNames = new Map;
        this.tempStyleOverrideElsRemoveTimeouts = new Map;
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
     * @param {RawBlock} lastBlock
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
     * @access public
     */
    registerEventHandlers(handlers) {
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
     * @param {(block: RawBlock) => {[key: String]: any;}} blockToTransferable
     * @param {BlockTypes} blockTypes
     * @param {(trid: String) => Array<RawBlock>} getTree
     * @param {hack} t
     * @returns {(blockTreeState: BlockTreeReduxState) => void}
     */
    createBlockTreeChangeListener(trid, blockTreeUtils, blockToTransferable, blockTypes, getTree, t) {
        /**
         * @param {RawBlock} b
         * @returns {String}
         */
        const getVisibleBlockId = b =>
            b.type !== 'GlobalBlockReference' ? b.id : getTree(b.globalBlockTreeId)[0].id
        ;
        /**
         * @param {RawBlock|null} of
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
         * @param {RawBlock} moveBlock
         * @param {HTMLElement} treeRootEl
         * @returns {Array<HTMLElement|Comment>}
         */
        const getElsToMove = (moveBlock, treeRootEl) => {
            const el = treeRootEl.querySelector(`[data-block="${getVisibleBlockId(moveBlock)}"]`);
            return moveBlock.type !== 'GlobalBlockReference' ? [el] : [el.previousSibling, el, el.nextSibling];
        };
        /**
         * @param {RawBlock} beforeBlock
         * @param {RawBlock} moveBlock
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
         * @param {RawBlock} afterBlock
         * @param {RawBlock} moveBlock
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
         * @param {RawBlock} parentBlock
         * @param {RawBlock} moveBlock
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
         * @param {RawBlock} blockToMove
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
     * @param {Boolean} isDisabled
     * @access public
     */
    setIsMouseListenersDisabled(isDisabled) {
        this.isMouseListenersDisabled = isDisabled;
    }
    /**
     * @param {String} unitCls Example 'j-Heading-unit-6'
     * @param {String} varName Example 'textColor'
     * @param {String} varValue Example '#f5f5f5'
     * @param {'color'} valueType
     * @access public
     */
    fastOverrideStyleUnitVar(unitCls, varName, varValue, valueType) {
        if (valueType !== 'color') throw new Error();
        let el;
        if (!this.tempStyleOverrideNames.has(unitCls)) {
            el = document.createElement('style');
            el.setAttribute('data-temp-overrides-for', unitCls);
            document.head.appendChild(el);
            this.tempStyleOverrideNames.set(unitCls, 1);
        } else {
            el = document.head.querySelector(`[data-temp-overrides-for="${unitCls}"]`);
        }
        //
        el.innerHTML = `.${unitCls} { --${varName}: ${varValue}; }`;
        //
        const timeoutId = this.tempStyleOverrideElsRemoveTimeouts.get(unitCls);
        if (timeoutId) clearTimeout(timeoutId);
        this.tempStyleOverrideElsRemoveTimeouts.set(unitCls, setTimeout(() => {
            document.head.removeChild(document.head.querySelector(`[data-temp-overrides-for="${unitCls}"]`));
            this.tempStyleOverrideNames.delete(unitCls);
        }, 2000));
    }
    /**
     * @param {String} varName
     * @param {RawCssValue} to
     * @access public
     */
    setCssVarValue(varName, {type, value}) {
        if (!isValidIdentifier(varName))
            throw new Error(`\`${varName}\` is not valid var name`);
        if (type !== 'color')
            throw new Error('Not implemented yet');
        document.documentElement.style.setProperty(`--${varName}`, `#${value.join('')}`);
    }
    /**
     * @param {RawBlock} block
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
 * @param {RawBlock} original
 * @param {RawBlock} cloned
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
 * @param {RawBlock} block
 * @param {(result: BlockRendctor) => void} then
 * @param {BlockTypes} blockTypes
 * @param {Boolean} shouldBackendRender = false
 * @param {String} childContent = null
 */
function renderBlockAndThen(block, then, blockTypes, shouldBackendRender = false) {
    const stringOrPromiseOrObj = blockTypes.get(block.type).reRender(
        block,
        () => `<!--${CHILDREN_START}-->${CHILD_CONTENT_PLACEHOLDER}<!--${CHILDREN_END}-->`,
        shouldBackendRender
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
