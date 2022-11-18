import {__, api, signals, env} from '@sivujetti-commons-for-edit-app';
import store, {observeStore, setCurrentPageDataBundle, setOpQueue, createSetBlockTree,
               createBlockTreeReducerPair, createSelectBlockTree} from './store.js';
import store2, {observeStore as observeStore2} from './store2.js';
import {makePath, makeSlug} from './block-types/pageInfo.js';
import blockTreeUtils from './left-panel/Block/blockTreeUtils.js';
import {toTransferable} from './Block/utils.js';
import opQueueItemEmitter from './OpQueueItemEmitter.js';

const webPageUnregistrables = new Map;
let LEFT_PANEL_WIDTH = 318;

/**
 * Receives EditAppAwareWebPage instance and cleans up the previous one. Prepares
 * EditAppAwareWebPage's data and dispatches them to various stores.
 */
class IframePageManager {
    // currentWebPage; // public
    // highlightRectEl;
    /**
     * @param {HTMLElement} highlightRectEl
     */
    constructor(highlightRectEl) {
        this.highlightRectEl = highlightRectEl;
    }
    /**
     * @param {EditAppAwareWebPage} webPage
     * @access public
     */
    loadPage(webPage) {
        window.templock = 1;
        if (window.useStoreonBlockTree !== false) {
        const isFirstLoad = !this.currentWebPage;
        this.currentWebPage = null;
        if (webPageUnregistrables.size) {
            for (const fn of webPageUnregistrables.values()) fn();
            webPageUnregistrables.clear();
        }
        this.currentWebPage = webPage;
        //
        const els = webPage.scanBlockElements();
        const {blocks} = webPage.data.page;
        const ordered = getOrdededBlocks(blocks, els);
        blockTreeUtils.traverseRecursively(ordered, b => {
            b.isStoredTo = 'page';
            b.isStoredToTreeId = 'main';
            if (b.type !== 'GlobalBlockReference' && b.type !== 'PageInfo') webPage.setTridAttr(b.id, 'main');
            if (b.type === 'GlobalBlockReference') {
                blockTreeUtils.traverseRecursively(b.__globalBlockTree.blocks, b2 => {
                    b2.isStoredTo = 'globalBlockTree';
                    b2.isStoredToTreeId = b.globalBlockTreeId;
                    webPage.setTridAttr(b2.id, b.globalBlockTreeId);
                });
            }
        });
        //
        const {data} = webPage;
        delete webPage.data;
        data.page = maybePatchTitleAndSlug(data.page);
        //
        webPage.addRootBoundingEls(ordered[ordered.length - 1]);
        webPage.registerEventHandlers(createWebsiteEventHandlers2(this.highlightRectEl));
        webPage.setIsMouseListenersDisabled(getArePanelsHidden());
        this.registerWebPageDomUpdater('main');
        //
        data.page.__blocksDebug = data.page.blocks;
        delete data.page.blocks;
        opQueueItemEmitter.resetAndBegin();
        store2.dispatch('theBlockTree/init', [ordered]);
        store.dispatch(setCurrentPageDataBundle(data));
        store.dispatch(setOpQueue([]));
        const fn = webPage.createThemeStylesChangeListener();
        webPageUnregistrables.set('themeStyles', observeStore2('themeStyles', fn));
        if (isFirstLoad) signals.on('visual-styles-var-value-changed-fast', (unitCls, varName, varValue, valueType) => {
            webPage.fastOverrideStyleUnitVar(unitCls, varName, varValue, valueType);
        });
        } else {
        const isFirstLoad = !this.currentWebPage;
        this.currentWebPage = null;
        if (webPageUnregistrables.size) {
            for (const fn of webPageUnregistrables.values()) fn();
            webPageUnregistrables.clear();
        }
        this.currentWebPage = webPage;
        //
        const els = webPage.scanBlockElements();
        const {blocks} = webPage.data.page;
        const ordered = [blocks.find(({type}) => type === 'PageInfo')];
        for (const el of els) {
            const [isPartOfGlobalBlockTree, globalBlockRefBlockId] = t(el);
            const blockId = !isPartOfGlobalBlockTree ? el.getAttribute('data-block') : globalBlockRefBlockId;
            const block = blocks.find(({id}) => id === blockId);
            if (block) ordered.push(block);
        }
        //
        const [mutatedOrdered, separatedTrees] = _separate(ordered);
        blockTreeUtils.traverseRecursively(mutatedOrdered, b => {
            b.isStoredTo = 'page';
            b.isStoredToTreeId = 'main';
            if (b.type !== 'GlobalBlockReference' && b.type !== 'PageInfo') webPage.setTridAttr(b.id, 'main');
        });
        for (const [trid, tree] of separatedTrees) {
            blockTreeUtils.traverseRecursively(tree, b => {
                b.isStoredTo = 'globalBlockTree';
                b.isStoredToTreeId = trid;
                webPage.setTridAttr(b.id, trid);
            });
        }
        webPage.addRootBoundingEls(ordered[ordered.length - 1]);
        //
        const trees = new Map;
        trees.set('main', mutatedOrdered);
        for (const [trid, tree] of separatedTrees)
            trees.set(trid, tree);
        // ------
        // ------
        const {data} = webPage;
        delete webPage.data;
        //
        webPage.registerEventHandlers(createWebsiteEventHandlers2(this.highlightRectEl));
        data.page = maybePatchTitleAndSlug(data.page);
        webPage.setIsMouseListenersDisabled(getArePanelsHidden());
        //
        if (trees.keys().next().value !== 'main') throw new Error('Sanity');
        for (const [trid, _] of trees)
            this.registerWebPageDomUpdater(trid);
        //
        store.dispatch(setCurrentPageDataBundle(data));
        store.dispatch(setOpQueue([]));
        //
        for (const [trid, tree] of trees) {
            if (trid === 'main') continue;
            createStoreAndDispatchInnerTree(trid, tree);
        }
        store.dispatch(createSetBlockTree('main')(trees.get('main'), ['init', {}]));
        const fn = webPage.createThemeStylesChangeListener();
        webPageUnregistrables.set('themeStyles', observeStore2('themeStyles', fn));
        if (isFirstLoad) signals.on('visual-styles-var-value-changed-fast', (unitCls, varName, varValue, valueType) => {
            webPage.fastOverrideStyleUnitVar(unitCls, varName, varValue, valueType);
        });
        }
        window.templock = null;
    }
    /**
     * @param {String} trid
     * @access public
     */
    registerWebPageDomUpdater(trid) {
        if (webPageUnregistrables.has(trid)) return;
        if (window.useStoreonBlockTree !== false) {
        const {fast, slow} = this.currentWebPage.reRenderer.createBlockTreeChangeListeners();
        webPageUnregistrables.set('blockTreeFastChangeListener', observeStore2('theBlockTree', fast));
        webPageUnregistrables.set('blockTreeSlowChangeListener', signals.on('onOpQueueBeforePushItem', slow));
        } else {
        const fn = this.currentWebPage.createBlockTreeChangeListener(trid, blockTreeUtils, toTransferable, api.blockTypes, getTree);
        webPageUnregistrables.set(trid, observeStore(createSelectBlockTree(trid), fn));
        }
    }
    /**
     * @param {String} trid
     * @access public
     */
    unregisterWebPageDomUpdaterForBlockTree(trid) {
        const unreg = webPageUnregistrables.get(trid);
        if (!unreg) return;
        unreg();
        webPageUnregistrables.delete(trid);
    }
}

/**
 * @param {Array<RawBlock>} unordered
 * @param {Array<HTMLElement>} orderedEls
 * @returns {Array<RawBlock>}
 */
function getOrdededBlocks(unordered, orderedEls) {
    const ordered = [unordered.find(({type}) => type === 'PageInfo')];
    for (const el of orderedEls) {
        const [isPartOfGlobalBlockTree, globalBlockRefBlockId] = t(el);
        const blockId = !isPartOfGlobalBlockTree ? el.getAttribute('data-block') : globalBlockRefBlockId;
        const block = unordered.find(({id}) => id === blockId);
        if (block) ordered.push(block);
    }
    return ordered;
}

/**
 * @param {String} trid
 * @param {Array<RawBlock>} tree
 * @access private
 */
function createStoreAndDispatchInnerTree(trid, tree) {
    const [storeStateKey, reducer] = createBlockTreeReducerPair(trid);
    if (store.reducerManager.has(storeStateKey)) return;
    store.reducerManager.add(storeStateKey, reducer);
    store.dispatch(createSetBlockTree(trid)(tree, ['init', {}]));
}

/**
 * @returns {Boolean}
 */
function getArePanelsHidden() {
    return env.window.localStorage.sivujettiDoHidePanels === 'yes';
}

/**
 * @param {Array<RawBlock>} mainTreeBlocks
 * @returns {[Array<RawBlock>, Map<String, Array<RawBlock>>]}
 */
function _separate(mainTreeBlocks) {
    const separatedGlobalTreesBlocks = new Map;
    blockTreeUtils.traverseRecursively(mainTreeBlocks, b => {
        if (b.type !== 'GlobalBlockReference') return;
        separatedGlobalTreesBlocks.set(b.globalBlockTreeId, b.__globalBlockTree.blocks);
        delete b.__globalBlockTree;
    });
    return [mainTreeBlocks, separatedGlobalTreesBlocks];
}

/**
 * @param {HTMLElement} el
 * @returns {[Boolean, String|null]}
 */
function t(el) {
    const p = el.previousSibling;
    return !p || p.nodeType !== Node.COMMENT_NODE || !p.nodeValue.endsWith(':GlobalBlockReference ')
        ? [false, null]
        : [true, p.nodeValue.split(' block-start ')[1].split(':')[0]];
}

/**
 * @param {Page} page
 * @returns {Page}
 */
function maybePatchTitleAndSlug(page) {
    if (page.isPlaceholderPage) {
        page.title = __(page.title);
        page.slug = makeSlug(page.title);
        const pageType = api.getPageTypes().find(({name}) => name === page.type);
        page.path = makePath(page.slug, pageType);
    }
    return page;
}

/**
 * @param {String} trid
 * @returns {Array<RawBlock>}
 */
function getTree(trid) {
    return createSelectBlockTree(trid)(store.getState()).tree;
}

/**
 * @param {HTMLElement} highlightRectEl
 * @returns {EditAwareWebPageEventHandlers}
 */
function createWebsiteEventHandlers2(highlightRectEl) {
    let prevHoverStartBlockEl = null;
    const TITLE_LABEL_HEIGHT = 18; // at least
    const hideRect = () => {
        highlightRectEl.setAttribute('data-title', '');
        highlightRectEl.style.cssText = '';
        prevHoverStartBlockEl = null;
    };
    const findBlock = blockEl => {
        if (window.useStoreonBlockTree !== false) {
        const trid = blockEl.getAttribute('data-trid');
        const rootOrInnerTree = blockTreeUtils.getRootFor(trid, store2.get().theBlockTree);
        return blockTreeUtils.findBlock(blockEl.getAttribute('data-block'), rootOrInnerTree)[0];
        } else {
        const {tree} = createSelectBlockTree(blockEl.getAttribute('data-trid'))(store.getState());
        return blockTreeUtils.findBlock(blockEl.getAttribute('data-block'), tree)[0];
        }
    };
    return {
        /**
         * @param {HTMLElement} blockEl
         * @param {ClientRect} r
         */
        onHoverStarted(blockEl, r) {
            if (prevHoverStartBlockEl === blockEl)
                return;
            highlightRectEl.style.cssText = [
                'width:', r.width, 'px;',
                'height:', r.height, 'px;',
                'top:', r.top, 'px;',
                'left:', r.left + LEFT_PANEL_WIDTH, 'px'
            ].join('');
            const block = findBlock(blockEl);
            if (r.top < -TITLE_LABEL_HEIGHT)
                highlightRectEl.setAttribute('data-position', 'bottom-inside');
            else if (r.top > TITLE_LABEL_HEIGHT)
                highlightRectEl.setAttribute('data-position', 'top-outside');
            else
                highlightRectEl.setAttribute('data-position', 'top-inside');
            highlightRectEl.setAttribute('data-title',
                (block.type !== 'PageInfo' ? '' : `${__('Page title')}: `) + block.title || __(block.type)
            );
            prevHoverStartBlockEl = blockEl;
        },
        /**
         * @param {HTMLElement|null} blockEl
         * @param {HTMLAnchorElement|null} link
         */
        onClicked(blockEl, link) {
            signals.emit('on-web-page-click-received', blockEl, link, findBlock);
        },
        /**
         * @param {HTMLElement} blockEl
         */
        onHoverEnded(blockEl, _r) {
            setTimeout(() => {
                if (blockEl === prevHoverStartBlockEl)
                    hideRect();
            }, 80);
        },
    };
}

export default IframePageManager;
export {getArePanelsHidden, createWebsiteEventHandlers2, createStoreAndDispatchInnerTree};
