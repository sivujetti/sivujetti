import {__, api, signals, env} from '@sivujetti-commons-for-edit-app';
import store, {observeStore, setCurrentPageDataBundle, setOpQueue, createSetBlockTree,
               createBlockTreeReducerPair, createSelectBlockTree} from './store.js';
import {observeStore as observeStore2} from './store2.js';
import {makePath, makeSlug} from './block-types/pageInfo.js';
import blockTreeUtils from './blockTreeUtils.js';
import {toTransferable} from './Block/utils.js';

const webPageUnregistrables = new Map;
let LEFT_PANEL_WIDTH = 318;

function createInit(highlightRectEl) {
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
const state = {receivingData: false};
    /** @param {EditAppAwareWebPage} webPage */
    return webPage => {
        state.receivingData = true;

            if (webPageUnregistrables.size) {
                for (const fn of webPageUnregistrables.values()) fn();
                webPageUnregistrables.clear();
            }



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
            const [mutatedOrdered, separatedTrees] = separate(ordered);
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
            const isFirstLoad = !webPage;//this.currentWebPage;
            const {data} = webPage;
            delete webPage.data;
            //
            //this.currentWebPage = webPage;
            webPage.registerEventHandlers(createWebsiteEventHandlers2(highlightRectEl));
            data.page = maybePatchTitleAndSlug(data.page);
            // const {page} = data;
            // signals.emit('on-web-page-loading-started', page, this.state.currentPage);
            webPage.setIsMouseListenersDisabled(getArePanelsHidden());
            // const newState = a ? {currentPage: page} :  {currentPage: page, currentMainPanel: determineViewNameFrom(page)};
            // this.setState(newState);
            // const dispatchData = () => {
                //
                if (trees.keys().next().value !== 'main') throw new Error('Sanity');
                for (const [trid, _] of trees)
                    registerWebPageDomUpdater(trid, webPage, state);
                //
                store.dispatch(setCurrentPageDataBundle(data));
                store.dispatch(setOpQueue([]));
                //
                for (const [trid, tree] of trees) {
                    if (trid === 'main') continue;
                    createStoreAndDispatchInnerTree(trid, tree);
                }
                store.dispatch(createSetBlockTree('main')(trees.get('main'), ['init', {}]));
                // signals.emit('on-web-page-loaded');
                const fn = webPage.createThemeStylesChangeListener();
                webPageUnregistrables.set('themeStyles', observeStore2('themeStyles', fn));
                if (isFirstLoad) signals.on('visual-styles-var-value-changed-fast', (unitCls, varName, varValue, valueType) => {
                    webPage.fastOverrideStyleUnitVar(unitCls, varName, varValue, valueType);
                });
                
        state.receivingData = true;
                
            // };
            // if (a) {
            //     dispatchData();
            //     return;
            // }
            // const fromDefaultToCreateOrViceVersa = newState.currentMainPanel.charAt(0) !== this.state.currentMainPanel.charAt(0);
            // if (fromDefaultToCreateOrViceVersa)
            //     setTimeout(() => dispatchData(), 1);
            // else
            //     dispatchData();
        }
}

    /**
     * @param {String} trid
     * @access private
     */
    function registerWebPageDomUpdater(trid, currentWebPage, state) {
        if (webPageUnregistrables.has(trid)) return;
        const fn = currentWebPage.createBlockTreeChangeListener(trid, blockTreeUtils, toTransferable, api.blockTypes, getTree, state);
        webPageUnregistrables.set(trid, observeStore(createSelectBlockTree(trid), fn));
    }

    /**
     * @param {String} trid
     * @access public
     */
    function unregisterWebPageDomUpdaterForBlockTree(trid) {
        const unreg = webPageUnregistrables.get(trid);
        if (!unreg) return;
        unreg();
        webPageUnregistrables.delete(trid);
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
function separate(mainTreeBlocks) {
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
function createWebsiteEventHandlers2(highlightRectEl) { // todo siirrä loaderiin? 
    let prevHoverStartBlockEl = null;
    const TITLE_LABEL_HEIGHT = 18; // at least
    const hideRect = () => {
        highlightRectEl.setAttribute('data-title', '');
        highlightRectEl.style.cssText = '';
        prevHoverStartBlockEl = null;
    };
    const findBlock = blockEl => {
        const {tree} = createSelectBlockTree(blockEl.getAttribute('data-trid'))(store.getState());
        return blockTreeUtils.findBlock(blockEl.getAttribute('data-block'), tree)[0];
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

export default createInit;
export {registerWebPageDomUpdater, unregisterWebPageDomUpdaterForBlockTree, getArePanelsHidden, createWebsiteEventHandlers2};
