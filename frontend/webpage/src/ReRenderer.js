import {CHILDREN_START, CHILD_CONTENT_PLACEHOLDER, CHILDREN_END} from '../../edit-app/src/block/dom-commons.js';

const IS_STORED_TO_ATTR = 'data-is-stored-to-trid';

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
     * @param {{theBlockTree: Array<RawBlock>;} && {[key: String]: any;}} state
     * @param {[blockChangeEvent, Array<any>]} context
     * @access private
     */
    handleFastChangeEvent({theBlockTree}, [event, data]) {
        // ====================================================================
        if (event === 'theBlockTree/init') {
            this.elCache = createElCache(theBlockTree);
        // ====================================================================
        } else if (event === 'theBlockTree/swap') {
            this.doReRender(theBlockTree);
        // ====================================================================
        } else if (event === 'theBlockTree/undo') {
            const [_oldTree, maybeBlockId, _blockIsStoredToTreeId, isUndoOfConvertToGlobal] = data;
            if (!isUndoOfConvertToGlobal) {
                if (!maybeBlockId) { // undo of non-single update
                    this.doReRender(theBlockTree);
                } else { // undo of single update
                    const pool = this.elCache.get(maybeBlockId);
                    pool.pop();
                    this.elCache.set(maybeBlockId, pool);
                    this.doReRender(theBlockTree);
                }
            } else {
                this.unturnBlockElToGlobalRecursively(maybeBlockId);
                this.doReRender(theBlockTree);
            }
        // ====================================================================
        } else if (event === 'theBlockTree/deleteBlock') {
            this.doReRender(theBlockTree);
        // ====================================================================
        } else if (event === 'theBlockTree/addBlockOrBranch') { // added to tree while dragging, not dropped yet
            const [newBlockInf] = data; // [SpawnDescriptor, BlockDescriptor, 'before'|'after'|'as-child']
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
                    const rendered = withTrid(html, newBlock.isStoredToTreeId, !hasPlace);
                    const completed = hasPlace ? rendered.replace(CHILD_CONTENT_PLACEHOLDER, '') : rendered;
                    const temp = document.createElement('div');
                    temp.innerHTML = completed;

                    blockTreeUtils.traverseRecursively([newBlock], (b, _i, parent, _parentIdPath) => {
                        const el = !parent ? temp.firstElementChild : getBlockEl(b.id, temp.firstElementChild);
                        if (!el) throw new Error('');
                        this.elCache.set(b.id, [extractRendered(el)]);
                    });
                } else {
                    const temp = document.createElement('div');
                    temp.innerHTML = withTrid(html, newBlock.globalBlockTreeId, true);
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
                    const ssss = parent ? '' : ' sjet-dots-animation';
                    place.innerHTML = `<div class="j-Placeholder${ssss}" data-block-type="Placeholder" data-block="${b.id}" ${IS_STORED_TO_ATTR}="${b.isStoredToTreeId}"><!--${CHILDREN_START}--><!--${CHILDREN_END}--></p>`;
                    this.elCache.set(b.id, [extractRendered(place.firstElementChild)]);
                });
                this.doReRender(theBlockTree);
            }
        // ====================================================================
        } else if (event === 'theBlockTree/applyAdd(Drop)Block') { // dropped
            // ?
        // ====================================================================
        } else if (event === 'theBlockTree/undoAdd(Drop)Block') {
            this.doReRender(theBlockTree);
        // ====================================================================
        } else if (event === 'theBlockTree/updatePropsOf') {
            const [blockId, blockIsStoredToTreeId, _changes, hasErrors, debounceMillis] = data;
            if (hasErrors) { window.console.log('not impl'); return; }

            const rootOrInnerTree = blockTreeUtils.getRootFor(blockIsStoredToTreeId, theBlockTree);
            const block = blockTreeUtils.findBlock(blockId, rootOrInnerTree)[0];
            const el = getBlockEl(block.id);

            renderBlockAndThen((function (out) { out.children = []; return out; })(toTransferable(block)), ({html, onAfterInsertedToDom}) => {
                const temp = document.createElement('template');
                const completed = withTrid(html, blockIsStoredToTreeId).replace(CHILD_CONTENT_PLACEHOLDER, getChildContent(el));
                temp.innerHTML = completed;
                el.replaceWith(temp.content);
                onAfterInsertedToDom(completed);

                const el2 = getBlockEl(block.id);
                const onlySelf = extractRendered(el2);
                if (debounceMillis > 0) this.throttledUpdates[block.id] = 1;
                else this.elCache.get(block.id).push(onlySelf);
                this.doReRender(theBlockTree, {blockId: block.id, el: onlySelf});
            }, false);
        // ====================================================================
        } else if (event === 'theBlockTree/cloneItem') {
            const [clonedInf, clonedFromInf] = data; // [SpawnDescriptor, BlockDescriptor]
            const mainOrInnerTree = blockTreeUtils.getRootFor(clonedFromInf.isStoredToTreeId, theBlockTree);
            const clonedFrom = blockTreeUtils.findBlock(clonedFromInf.blockId, mainOrInnerTree)[0];
            const cloned = clonedInf.block;
            const [flatOriginal, flatCloned] = flattenBlocksRecursive(clonedFrom, cloned);
            for (let i = 0; i < flatOriginal.length; ++i) {
                const clonedFromNode = getBlockEl(flatOriginal[i].id);
                const cloned = extractRendered(clonedFromNode);
                cloned.setAttribute('data-block', flatCloned[i].id);
                this.elCache.set(flatCloned[i].id, [cloned]);
            }
            this.doReRender(theBlockTree);
        } else if (event === 'theBlockTree/convertToGbt') {
            const [_originalBlockId, idForTheNewBlock, _newGbtWithoutBlocks] = data;
            const newGbtRef = blockTreeUtils.findBlock(idForTheNewBlock, theBlockTree)[0];
            this.turnBlockElToGlobalRecursively(newGbtRef);
            this.doReRender(theBlockTree);
        } else if (event === 'theBlockTree/updateDefPropsOf') {
            const [blockId, _blockIsStoredToTreeId, changes, isOnlyStyleClassesChange] = data;
            if (isOnlyStyleClassesChange) {
                this.updateBlocksStyleClasses(blockId, changes.styleClasses);
                this.doReRender(theBlockTree);
            } // else nothing to render, i.e. only block.title changed)
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
     * @param {Array<RawBlock>} tree
     * @param {{blockId: String; el: HTMLElement;}} singleOverride = null
     * @access private
     */
    doReRender(tree, singleOverride = null) {
        document.body.innerHTML = '';
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
        const frag = document.createElement('div');
        frag.innerHTML = `<!--${CHILDREN_START}--><!--${CHILDREN_END}-->`;
        appendCachedEls(tree, frag);
        Array.from(frag.childNodes).forEach(movable => document.body.appendChild(movable));
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
     * @param {RawBlock} newGbtRefBlock
     * @access private
     */
    turnBlockElToGlobalRecursively(newGbtRefBlock) {
        const newGbtId = newGbtRefBlock.__globalBlockTree.id;
        blockTreeUtils.traverseRecursively(newGbtRefBlock.__globalBlockTree.blocks, (b, _i, _parent, _parentIdPath) => {
            const current = getBlockEl(b.id);
            const extractedCopy = extractRendered(current);
            extractedCopy.setAttribute(IS_STORED_TO_ATTR, newGbtId);
            this.elCache.get(b.id).push(extractedCopy);
        });
    }
    /**
     * @param {String} gbtsRootBlockId
     * @access private
     */
    unturnBlockElToGlobalRecursively(gbtsRootBlockId) {
        const gbtsRootBlockEl = getBlockEl(gbtsRootBlockId);
        const gbtId = gbtsRootBlockEl.getAttribute(IS_STORED_TO_ATTR);
        [gbtsRootBlockEl, ...Array.from(gbtsRootBlockEl.querySelectorAll(`[${IS_STORED_TO_ATTR}=${gbtId}]`))].forEach(el => {
            const innerBlockId = el.getAttribute('data-block');
            const pool = this.elCache.get(innerBlockId);
            pool.pop();
        });
    }
    /**
     * @param {String} blockId
     * @param {String} newStyleClasses
     * @access private
     */
    updateBlocksStyleClasses(blockId, newStyleClasses) {
        const withNewClsClone = extractRendered(getBlockEl(blockId));
        const blockTypeName = withNewClsClone.className.split(' ')[0]; // 'j-Something custom1' -> 'j-Something'
        withNewClsClone.className = blockTypeName + (newStyleClasses ? ` ${newStyleClasses}` : '');
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
 * @param {String} html
 * @param {String} trid
 * @param {Boolean} recursive = false
 * @returns {String}
 */
function withTrid(html, trid, recursive = false) {
    return html.replace(!recursive ? ' data-block=' : / data-block=/g, ` ${IS_STORED_TO_ATTR}="${trid}" data-block=`);
}

export default ReRenderer;
export {findCommentR, withTrid};
