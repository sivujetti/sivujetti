import {CHILDREN_START, CHILD_CONTENT_PLACEHOLDER, CHILDREN_END, noop} from '../../edit-app/src/shar2.js';

let renderBlockAndThen;
let toTransferable;
let blockTreeUtils;

/**
 * Listens theBlockTree-related storeOn events, and updates the DOM of current
 * WebPageIframe based on those events.
 */
class ReRenderer {
    /**
     * @param {(block: RawBlock, then: (result: BlockRendctor) => void, shouldBackendRender: Boolean = false) => void} renderBlockAndThen_
     * @param {(block: RawBlock, includePrivates: Boolean = false) => {[key: String]: any;}} _toTransferable
     * @param {blockTreeUtils} _blockTreeUtils
     */
    constructor(_renderBlockAndThen, _toTransferable, _blockTreeUtils) {
        renderBlockAndThen = _renderBlockAndThen;
        toTransferable = _toTransferable;
        blockTreeUtils = _blockTreeUtils;
    }
    /**
     * @returns {{fast: (event: String, data: Array<any>) => void; slow: (blockId: String) => void;}}
     * @access public
     */
    createBlockTreeChangeListeners() {
        const state = {cac: null, fast: null};
        const doReRender = (tree, uni=null, over=null) => {
            document.body.innerHTML = '';
            const onlyOwnNodes = (endcomOf, selfWithoutChilren) => {
                endcomOf.parentElement.insertBefore(selfWithoutChilren, endcomOf);
            };
            const eer = (bid, diff) => {
                const pool = state.cac.get(bid);
                const keys = Object.keys(pool);
                const itm = pool[keys[keys.length - diff]];
                return itm !== '(deleted)' ? itm.cloneNode(true) : itm;
            };
            const tate = (branch, f, endcom=null) => {
                for (const b of branch) {
                    if (b.type === 'PageInfo') continue;
                        let diff;
                        if (uni && uni.bid === 'all') diff = 1; // todo !uni else
                        else if (uni && uni.bid === b.id) diff = 2;
                        else diff = 1;
                    if (b.type !== 'GlobalBlockReference') {
                        if (!endcom) endcom = getChildEndComment(getBlockContentRoot(f));
                        const node = !(over && over.bid === b.id) ? eer(b.id, diff) : over.nod;
                        if (node !== '(deleted)') {
                        onlyOwnNodes(endcom, node);
                        if (b.children.length) tate(b.children, node);
                        } else {
                            //?
                        }
                    } else { // ?? 
                        const e = document.createComment(` block-end ${b.id} `);
                        f.insertBefore(e, f.lastChild);
                        f.insertBefore(document.createComment(` block-start ${b.id}:GlobalBlockReference `), e);
                        const node = eer(b.__globalBlockTree.blocks[0].id, diff);
                        if (node !== '(deleted)')
                        tate(b.__globalBlockTree.blocks,
                            node,
                            //state.cac.get(b.__globalBlockTree.blocks[0].id).cloneNode(true), // ??
                            e);
                    }
                }
            };
            const frag = document.createElement('div');
            frag.innerHTML = '<!-- children-start --><!-- children-end -->';
            tate(tree, frag);
            Array.from(frag.childNodes).forEach(movable => document.body.appendChild(movable));
        };
        return {fast: ({theBlockTree}, [event, data]) => {
            ////////////////////////////////////////////////////////////////////////
            if (event === 'theBlockTree/init') {
                state.cac = createCac(theBlockTree);
            } else if (event === 'theBlockTree/swap') {
                if (data[0].trid === 'main' && data[1].isGbtRef)
                    ;
                else
                    doReRender(theBlockTree);
            } else if (event === 'theBlockTree/undo') {
                if (!data[1]) { // undo of non singel update
                    doReRender(theBlockTree, {bid: 'all'});
                } else { // undo of single update
                    doReRender(theBlockTree, {bid: data[1]}, undefined, true);
                    const pool = state.cac.get(data[1]);
                    const takeNewest = () => {
                        const ks = Object.keys(pool);
                        return ks[ks.length - 1];
                    };
                    const newes = takeNewest();
                    state.cac.set(data[1], Object.keys(pool).reduce((out, hash) => {
                        if (hash !== newes) out[hash] = pool[hash];
                        return out;
                    }, {}));
                }
            } else if (event === 'theBlockTree/deleteBlock') {
                doReRender(theBlockTree);
            ////////////////////////////////////////////////////////////////////////
            } else if (event === 'theBlockTree/addBlockOrBranch') { // added to tree while dragging, not dropped yet
                const [newBlockInf] = data;
                const newBlock = newBlockInf.block;
                const {isReusable} = newBlockInf;

                let renderType = 'none';
                renderBlockAndThen(toTransferable(newBlock),
                // # race-1
                ({html}) => {
                    if (renderType === 'none') renderType = 'sync';

                    const hasPlace = html.indexOf(CHILD_CONTENT_PLACEHOLDER) > -1;
                    const rendered = withTrid(html, newBlock.isStoredToTreeId, !hasPlace);
                    const completed = hasPlace ? rendered.replace(CHILD_CONTENT_PLACEHOLDER, '') : rendered;
                    const temp = document.createElement('div');
                    temp.innerHTML = completed;

                    blockTreeUtils.traverseRecursively([newBlock], (b, _i, parent, _parentIdPath) => {
                        const erer = !parent ? temp.firstElementChild : gb(b.id, temp.firstElementChild);
                        if (!erer) throw new Error('');
                        const exi = extr(erer);
                        state.cac.set(b.id, {[hash(b)]: exi});
                    });
                    doReRender(theBlockTree);

                }, isReusable);

                // #race-2
                if (renderType === 'none') {
                    renderType = 'async';
                    blockTreeUtils.traverseRecursively([newBlock], (b, _i, parent, _parentIdPath) => {
                        const place = document.createElement('div');
                        const ssss = parent ? '' : ' sjet-dots-animation';
                        place.innerHTML = `<div class="j-Placeholder${ssss}" data-block-type="Placeholder" data-block="${b.id}" data-trid="${newBlock.isStoredToTreeId}"><!--${CHILDREN_START}--><!--${CHILDREN_END}--></p>`;
                        const exi = extr(place.firstElementChild);
                        state.cac.set(b.id, {[hash(b)]: exi});
                    });
                    doReRender(theBlockTree);
                }
            ////////////////////////////////////////////////////////////////////////
            } else if (event === 'theBlockTree/applyAdd(Drop)Block') { // dropped
                // ?
            ////////////////////////////////////////////////////////////////////////
            } else if (event === 'theBlockTree/undoAdd(Drop)Block') {
                doReRender(theBlockTree);
            ////////////////////////////////////////////////////////////////////////
            } else if (event === 'theBlockTree/updatePropsOf') {
                const [blockId, blockIsStoredToTreeId, _changes, hasErrors, debounceMillis] = data;
                if (hasErrors) { window.console.log('not impl'); return; }

                const rootOrInnerTree = blockTreeUtils.getRootFor(blockIsStoredToTreeId, theBlockTree);
                const block = blockTreeUtils.findBlock(blockId, rootOrInnerTree)[0];
                const el = gb(block.id);

                renderBlockAndThen((function (out) { out.children = []; return out; })(toTransferable(block)), ({html, onAfterInsertedToDom}) => {
                    const temp = document.createElement('template');
                    const completed = withTrid(html, blockIsStoredToTreeId).replace(CHILD_CONTENT_PLACEHOLDER, getChildContent(el));
                    temp.innerHTML = completed;
                    el.replaceWith(temp.content);
                    onAfterInsertedToDom(completed); // ??

                    if (debounceMillis > 0) {
                    const ela = gb(block.id);
                    const exi = extr(ela);
                    state.fast = {block};
                    // ## todo luo optimoitu asd3, joka päivittää vain muokatun lohkon
                    doReRender(theBlockTree, undefined, {bid: block.id, nod: exi}); // ### tässä temp-elementtiä
                    } else { // ????
                    state.cac.get(block.id)[hash(block)] = extr(gb(block.id));
                    }
                }, false);

            ////////////////////////////////////////////////////////////////////////
            } else if (event === 'theBlockTree/cloneItem') {
                const [info, clonedFromInf] = data; // [SpawnDescriptor, BlockDescriptor]
                const mainOrInnerTree = blockTreeUtils.getRootFor(clonedFromInf.trid, theBlockTree);
                const clonedFrom = blockTreeUtils.findBlock(clonedFromInf.blockId, mainOrInnerTree)[0];
                const cloned = info.block;
                const [flatOriginal, flatCloned] = flattenBlocksRecursive(clonedFrom, cloned);
                for (let i = 0; i < flatOriginal.length; ++i) {
                    const clonedFromNode = gb(flatOriginal[i].id);
                    const ast = extr(clonedFromNode);
                    ast.setAttribute('data-block', flatCloned[i].id);
                    state.cac.set(flatCloned[i].id, {[hash(flatCloned[i])]: ast});
                }
                doReRender(theBlockTree);
            }
        }, slow: blockId => {
            // 1. fast what? was first, this (slow what?) came after that
            if (state.fast) {
                const {block} = state.fast;
                if (block.id !== blockId) throw new Error();
                state.cac.get(block.id)[hash(block)] = extr(gb(block.id));
                state.fast = null;
            // 2. fast what? this (slow what?) happened simuiltaneousldlskdslkm
            } else {
                // ?
            }
        }};
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

function createCac(tree) {
    const t = (branch, out) => {
        for (const b of branch) {
            if (b.type === 'PageInfo') continue;
            if (b.type !== 'GlobalBlockReference') {
                const ela = gb(b.id);
                const exi = extr(ela);
                out.set(b.id, {[hash(b)]: exi});
                if (b.children.length) t(b.children, out);
            } else {
                t(b.__globalBlockTree.blocks, out);
            }
        }
    };
    const out = new Map;
    t(tree, out);
    return out;
}

function gb(blockId, from = document.body) {
    return from.querySelector(`[data-block="${blockId}"]`);
}

/**
 * Returns cloned $ela, without its children (els between <!-- children-start --><!-- children-end -->)
 *
 * @param {HTMLElement|null} ela
 * @returns {HTMLElement|null}
 */
function extr(ela) {
    if (!ela) return null;
    const copy = ela.cloneNode(true);
    const start = getChildStartComment(getBlockContentRoot(copy));
    if (!start) throw new Error();
    //
    const childNodes = [];
    let el = start.nextSibling;
    while (el) {
        if (el.nodeType === Node.COMMENT_NODE && el.nodeValue === CHILDREN_END) {
            break;
        }
        childNodes.push(el);
        el = el.nextSibling;
    }
    childNodes.forEach(nod => nod.parentElement.removeChild(nod));
    return copy;
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
function createBlockTreeChangeListener(trid, blockTreeUtils, blockToTransferable, blockTypes, getTree) {
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
        const endcom = getChildEndComment(parentBlock.root !== 1
            ? getBlockContentRoot(treeRootEl.querySelector(`[data-block="${getVisibleBlockId(parentBlock)}"]`))
            : document.body);
        const movables = getElsToMove(moveBlock, treeRootEl);
        movables.forEach(movable => endcom.parentElement.insertBefore(movable, endcom));
        return movables;
    };
    /**
     * @param {RawBlock} dragBlock
     * @param {HTMLElement} treeRootEl
     * @returns {() => void}
     */
    const createGetRevertRef = (dragBlock, treeRootEl) => {
        let next = treeRootEl.querySelector(`[data-block="${getVisibleBlockId(dragBlock)}"]`).nextSibling;
        if (dragBlock.type === 'GlobalBlockReference') next = next.nextSibling;
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
        if (!context || context[0] === 'init' || (context[0] !== 'init' && window.parent.templock === 1)) return;
        const event = context[0];
        const treeRootEl = document.body;
        if (event === 'swap-blocks') {
            const [mut1, mut2] = context[1];
            const {dropPos, dragBlock, dropBlock} = mut1;
            if (context[2] !== 'dnd-spawner') {
                if (!this.revertSwapStacks.has(dragBlock.id)) this.revertSwapStacks.set(dragBlock.id, []);
                this.revertSwapStacks.get(dragBlock.id).push(createGetRevertRef(dragBlock, treeRootEl));
            }
            if (!mut2) {
                if (dropPos === 'before')
                    moveBefore(dropBlock, dragBlock, treeRootEl);
                else if (dropPos === 'after')
                    moveAfter(dropBlock, dragBlock, treeRootEl);
                else if (dropPos === 'as-child')
                    moveToChild(dropBlock, dragBlock, treeRootEl);
            } else {
                let newTrid = dropBlock.isStoredToTreeId;
                let movables;
                if (dropPos === 'before') {
                    movables = moveBefore(dropBlock, dragBlock, treeRootEl);
                } else if (dropPos === 'after') {
                    movables = moveAfter(dropBlock, dragBlock, treeRootEl);
                } else if (dropPos === 'as-child') {
                    movables = moveToChild(dropBlock, dragBlock, treeRootEl);
                    if (dropBlock.type === 'GlobalBlockReference') newTrid = dropBlock.globalBlockTreeId;
                }
                movables.forEach(el => el.setAttribute('data-trid', newTrid));
            }
            return;
        }
        if (event === 'undo-swap-blocks') {
            const {dragBlock} = context[1];
            const getNext = this.revertSwapStacks.get(dragBlock.id).pop();
            const next = getNext();
            const movables = getElsToMove(dragBlock, treeRootEl);
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

function hash(block) {
    const out = JSON.stringify(block.propsData);
    return out;
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

/**
 * @param {String} html
 * @param {String} trid
 * @param {Boolean} recursive = false
 * @returns {String}
 */
function withTrid(html, trid, recursive = false) {
    return html.replace(!recursive ? ' data-block=' : / data-block=/g, ` data-trid="${trid}" data-block=`);
}

export default ReRenderer;
export {createBlockTreeChangeListener as fooOld, findCommentR, withTrid};
