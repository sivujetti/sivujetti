import {CHILDREN_START, CHILD_CONTENT_PLACEHOLDER, CHILDREN_END,
        HAS_ERRORS, STYLE_INSTANCE_UNIT_CLS_PREFIX, VAR_UNIT_CLS_PREFIX,
        BASE_UNIT_CLS_PREFIX} from '../../edit-app/src/block/dom-commons.js';

let renderBlockAndThen;
let toTransferable;
let blockTreeUtils;

/**
 * Listens theBlockTree-related storeOn events, and updates the DOM of current
 * WebPageIframe based on those events.
 */
class ReRenderer {
    // elCache;
    // throttledUpdates;
    // onReRenderFn;
    /**
     * @param {(block: RawBlock, then: (result: BlockRendctor) => void, shouldBackendRender: Boolean = false) => void} renderBlockAndThen_
     * @param {(block: RawBlock, includePrivates: Boolean = false) => {[key: String]: any;}} _toTransferable
     * @param {blockTreeUtils} _blockTreeUtils
     */
    constructor(_renderBlockAndThen, _toTransferable, _blockTreeUtils) {
        renderBlockAndThen = _renderBlockAndThen;
        toTransferable = _toTransferable;
        blockTreeUtils = _blockTreeUtils;
        this.throttledUpdates = {};
        this.onReRenderFn = () => {};
    }
    /**
     * @returns {{fast: (event: blockChangeEvent, data: Array<any>) => void; slow: (blockId: String) => void;}}
     * @access public
     */
    createBlockTreeChangeListeners() {
        return {
            fast: this.handleFastChangeEvent.bind(this),
            slow: this.handleSlowChangeEvent.bind(this)
        };
    }
    /**
     * @param {() => void} fn
     * @access public
     */
    setOnReRender(fn) {
        this.onReRenderFn = fn;
    }
    /**
     * @param {{theBlockTree: Array<RawBlock>;} && {[key: String]: any;}} storeState
     * @param {[blockChangeEvent, Array<any>]} context
     * @access private
     */
    handleFastChangeEvent(storeState, [event, data]) {
        const {theBlockTree} = storeState;
        // ====================================================================
        if (event === 'theBlockTree/init') {
            this.elCache = createElCache(theBlockTree);
        // ====================================================================
        } else if ([
            'theBlockTree/swap',
            'theBlockTree/applyAdd(Drop)Block',
            'theBlockTree/applySwap',
            'theBlockTree/deleteBlock',
            'theBlockTree/undoAdd(Drop)Block',
            'theBlockTree/convertToGbt'
        ].indexOf(event) > -1) {
            this.doReRender(theBlockTree);

            const context = data.at(-1); // [..., {clone, reRenderThese}]
            if (context && typeof context === 'object' && Array.isArray(context.reRenderThese || null)) {
                for (const blockId of context.reRenderThese) {
                    const [block] = blockTreeUtils.findBlockSmart(blockId, theBlockTree);
                    this.reRenderBlock(block, theBlockTree);
                }
            }
        // ====================================================================
        } else if (event === 'theBlockTree/undo') {
            const [_oldTree, maybeBlockId, isUndoOfConvertToGlobal] = data;
            //
            if (maybeBlockId && !isUndoOfConvertToGlobal) {
                const pool = this.elCache.get(maybeBlockId);
                pool.pop();
                this.elCache.set(maybeBlockId, pool);
            }
            //
            this.doReRender(theBlockTree);
        // ====================================================================
        } else if (event === 'theBlockTree/addBlockOrBranch') { // added to tree while dragging, not dropped yet
            const [newBlockInf] = data; // [SpawnDescriptor, BlockDescriptor, dropPosition]
            const newBlock = newBlockInf.block;
            const {isReusable} = newBlockInf;

            let renderType = 'none';
            const isGbtRef = newBlock.type === 'GlobalBlockReference';
            renderBlockAndThen(toTransferable(newBlock),
            // # race-1
            ({html}) => {
                if (renderType === 'none') renderType = 'sync';

                if (!isGbtRef) {
                    const hasPlace = html.indexOf(CHILD_CONTENT_PLACEHOLDER) > -1;
                    const completed = hasPlace ? html.replace(CHILD_CONTENT_PLACEHOLDER, '') : html;
                    const temp = document.createElement('div');
                    temp.innerHTML = completed;

                    blockTreeUtils.traverseRecursively([newBlock], (b, _i, parent, _parentIdPath) => {
                        const el = !parent ? temp.firstElementChild : getBlockEl(b.id, temp.firstElementChild);
                        if (!el) throw new Error('');
                        this.elCache.set(b.id, [extractRendered(el)]);
                    });
                } else {
                    const temp = document.createElement('div');
                    temp.innerHTML = html;
                    blockTreeUtils.traverseRecursively(newBlock.__globalBlockTree.blocks, (b, _i, _parent, _parentIdPath) => {
                        const fromTemp = getBlockEl(b.id, temp);
                        this.elCache.set(b.id, [extractRendered(fromTemp)]);
                    });
                }

                this.doReRender(theBlockTree);

            }, isReusable);

            // #race-2
            if (renderType === 'none') {
                renderType = 'async';
                const insertPlaceholdersFor = !isGbtRef ? [newBlock] : newBlock.__globalBlockTree.blocks;
                blockTreeUtils.traverseRecursively(insertPlaceholdersFor, (b, _i, parent, _parentIdPath) => {
                    const place = document.createElement('div');
                    const cls = parent ? '' : ' sjet-dots-animation';
                    place.innerHTML = `<div class="j-Placeholder${cls}" data-block-type="Placeholder" data-block="${b.id}"><!--${CHILDREN_START}--><!--${CHILDREN_END}--></p>`;
                    this.elCache.set(b.id, [extractRendered(place.firstElementChild)]);
                });
                this.doReRender(theBlockTree);
            }
        // ====================================================================
        } else if (event === 'theBlockTree/updatePropsOf') {
            const [blockId, blockIsStoredToTreeId, _changes, flags, debounceMillis] = data;
            if (flags & HAS_ERRORS) { window.console.log('not impl'); return; }

            const tree = blockTreeUtils.findTree(blockIsStoredToTreeId, theBlockTree);
            const [block] = blockTreeUtils.findBlock(blockId, tree);
            this.reRenderBlock(block, theBlockTree, debounceMillis);
        // ====================================================================
        } else if (event === 'theBlockTree/cloneItem') {
            const [clonedInf, clonedFromInf] = data; // [SpawnDescriptor, BlockDescriptor]
            const [clonedFrom] = blockTreeUtils.findBlockSmart(clonedFromInf.blockId, theBlockTree);
            const cloned = clonedInf.block;
            const hasUserMutations = getBlockPropsAsString(clonedFrom) !== getBlockPropsAsString(cloned);
            if (!hasUserMutations) {
                const [flatOriginal, flatCloned] = flattenBlocksRecursive(clonedFrom, cloned);
                for (let i = 0; i < flatOriginal.length; ++i) {
                    const clonedFromNode = getBlockEl(flatOriginal[i].id);
                    const cloned = extractRendered(clonedFromNode);
                    cloned.setAttribute('data-block', flatCloned[i].id);
                    this.elCache.set(flatCloned[i].id, [cloned]);
                }
                this.doReRender(theBlockTree);
            } else {
                this.handleFastChangeEvent(storeState, ['theBlockTree/addBlockOrBranch', data]);
            }
        // ====================================================================
        } else if (event === 'theBlockTree/updateDefPropsOf') {
            const [blockId, _blockIsStoredToTreeId, changes, isOnlyStyleClassesChange] = data;
            if (isOnlyStyleClassesChange) {
                this.updateBlocksStyleClasses(blockId, changes.styleClasses);
                this.doReRender(theBlockTree);
            } // else nothing to render, i.e. only block.title changed)
        // ====================================================================
        } else if (event === 'theBlockTree/undoUpdateDefPropsOf') {
            const [_oldTree, blockId, _blockIsStoredToTreeId, isOnlyStyleClassesChange] = data;
            if (isOnlyStyleClassesChange) {
                const pool = this.elCache.get(blockId);
                pool.pop();
                this.doReRender(theBlockTree);
            } // same as above
        }
    }
    /**
     * @param {String} blockId
     * @access private
     */
    handleSlowChangeEvent(blockId) {
        if (this.throttledUpdates[blockId]) {
            this.elCache.get(blockId).push(extractRendered(getBlockEl(blockId)));
            this.throttledUpdates[blockId] = null;
        }
    }
    /**
     * @param {RawBlock} block
     * @param {Array<RawBlock>} theBlockTree
     * @param {Number} debounceMillis = 0
     * @access private
     */
    reRenderBlock(block, theBlockTree, debounceMillis = 0) {
        const el = getBlockEl(block.id);

        renderBlockAndThen((function (out) { out.children = []; return out; })(toTransferable(block)), ({html, onAfterInsertedToDom}) => {
            const temp = document.createElement('template');
            const completed = html.replace(CHILD_CONTENT_PLACEHOLDER, getChildContent(el));
            temp.innerHTML = completed;
            el.replaceWith(temp.content);
            onAfterInsertedToDom(completed);

            const el2 = getBlockEl(block.id);
            const onlySelf = extractRendered(el2);
            if (debounceMillis > 0) this.throttledUpdates[block.id] = 1;
            else this.elCache.get(block.id).push(onlySelf);
            this.doReRender(theBlockTree, {blockId: block.id, el: onlySelf.cloneNode(true)});
        }, false);
    }
    /**
     * @param {Array<RawBlock>} tree
     * @param {{blockId: String; el: HTMLElement;}} singleOverride = null
     * @access private
     */
    doReRender(tree, singleOverride = null) {
        const appendCachedEls = (branch, toEl, endcom = null) => {
            if (!endcom) endcom = getChildEndComment(getBlockContentRoot(toEl));
            for (const b of branch) {
                if (b.type === 'PageInfo') continue;
                if (b.type !== 'GlobalBlockReference') {
                    const selfWithoutChildren = !(singleOverride && singleOverride.blockId === b.id) ? this.getLatestCachedElClone(b.id) : singleOverride.el;
                    endcom.parentElement.insertBefore(selfWithoutChildren, endcom);
                    if (b.children.length) {
                        appendCachedEls(b.children, selfWithoutChildren);
                    }
                } else {
                    const endcom2 = document.createComment(` block-end ${b.id} `);
                    toEl.insertBefore(endcom2, toEl.lastChild);
                    toEl.insertBefore(document.createComment(` block-start ${b.id}:GlobalBlockReference `), endcom2);
                    const node = this.getLatestCachedElClone(b.__globalBlockTree.blocks[0].id);
                    appendCachedEls(b.__globalBlockTree.blocks, node, endcom2);
                }
            }
        };
        //
        let el = document.body.firstChild;
        while (el) {
            const cur = el;
            el = el.nextSibling;
            cur.parentElement.removeChild(cur);
            if ((cur.nodeType === Node.COMMENT_NODE && cur.textContent === CHILDREN_END) || !el) break;
        }
        //
        const frag = document.createElement('div');
        frag.innerHTML = `<!--${CHILDREN_START}--><!--${CHILDREN_END}-->`;
        appendCachedEls(tree, frag);
        const firstScriptEl = el;
        Array.from(frag.childNodes).forEach(insert => document.body.insertBefore(insert, firstScriptEl));
        this.onReRenderFn();
    }
    /**
     * @param {String} blockId
     * @returns {HTMLElement}
     * @access private
     */
    getLatestCachedElClone(blockId) {
        const pool = this.elCache.get(blockId);
        return pool[pool.length - 1].cloneNode(true);
    }
    /**
     * @param {String} blockId
     * @param {String} newStyleClasses
     * @access private
     */
    updateBlocksStyleClasses(blockId, newStyleClasses) {
        const withNewClsClone = extractRendered(getBlockEl(blockId));
        const current = withNewClsClone.className.split(' ');
        const unitStart = `${current[0]}-unit-`; // 'j-Something-unit-'
        const defaultUnitStart = `no-${unitStart}`;
        const nonUnit = current.filter(cls => !cls.startsWith(unitStart) &&
                                            !cls.startsWith(defaultUnitStart) &&
                                            !cls.startsWith(STYLE_INSTANCE_UNIT_CLS_PREFIX) &&
                                            !cls.startsWith(VAR_UNIT_CLS_PREFIX) &&
                                            !cls.startsWith(BASE_UNIT_CLS_PREFIX));
        withNewClsClone.className = [
            ...nonUnit.slice(0, 1), // j-Something
            ...(newStyleClasses ? newStyleClasses.split(' ') : []),
            ...nonUnit.slice(1)     // all except j-Something
        ].join(' ');
        this.elCache.get(blockId).push(withNewClsClone);
    }
}

/**
 * @param {RawBlock} original
 * @param {RawBlock} cloned
 * @returns {[Array<RawBlock>, Array<RawBlock]}
 */
function flattenBlocksRecursive(original, cloned) {
    const flatOriginal = [];
    blockTreeUtils.traverseRecursively([original], b1 => {
        flatOriginal.push(b1);
    });
    const flatCloned = [];
    blockTreeUtils.traverseRecursively([cloned], b2 => {
        flatCloned.push(b2);
    });
    return [flatOriginal, flatCloned];
}

/**
 * @param {Array<RawBlock>} tree
 * @returns {Map<String, HTMLElement[]>}
 */
function createElCache(tree) {
    const traverse = (branch, out) => {
        for (const b of branch) {
            if (b.type === 'PageInfo') continue;
            if (b.type !== 'GlobalBlockReference') {
                const elFromBody = getBlockEl(b.id);
                const withoutChildren = extractRendered(elFromBody);
                out.set(b.id, [withoutChildren]);
                if (b.children.length) traverse(b.children, out);
            } else {
                traverse(b.__globalBlockTree.blocks, out);
            }
        }
    };
    const out = new Map;
    traverse(tree, out);
    return out;
}

/**
 * @param {String} blockId
 * @param {HTMLElement} from = document.body
 * @returns {HTMLElement|null}
 */
function getBlockEl(blockId, from = document.body) {
    return from.querySelector(`[data-block="${blockId}"]`);
}

/**
 * Returns cloned $el, without its children (els between <!-- children-start --><!-- children-end -->)
 *
 * @param {HTMLElement|null} el
 * @returns {HTMLElement|null}
 */
function extractRendered(el) {
    if (!el) return null;
    const copy = el.cloneNode(true);
    const start = getChildStartComment(getBlockContentRoot(copy));
    if (!start) throw new Error();
    //
    const childNodes = [];
    let cur = start.nextSibling;
    while (cur) {
        if (cur.nodeType === Node.COMMENT_NODE && cur.nodeValue === CHILDREN_END) {
            break;
        }
        childNodes.push(cur);
        cur = cur.nextSibling;
    }
    childNodes.forEach(el2 => el2.parentElement.removeChild(el2));
    return copy;
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
 * @param {RawBlock} block
 * @returns {String}
 */
function getBlockPropsAsString(block) {
    const includePrivates = false;
    const recursive = false;
    const stripped = toTransferable(block, includePrivates, recursive);
    stripped.id = '-';
    return JSON.stringify(stripped);
}

export default ReRenderer;
export {findCommentR, getBlockEl};
