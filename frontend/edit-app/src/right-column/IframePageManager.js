import {__, api, signals, env} from '@sivujetti-commons-for-edit-app';
import store, {setCurrentPageDataBundle, setOpQueue} from '../store.js';
import store2, {observeStore as observeStore2} from '../store2.js';
import {makePath, makeSlug} from '../block-types/pageInfo.js';
import blockTreeUtils from '../left-column/block/blockTreeUtils.js';
import opQueueItemEmitter from '../OpQueueItemEmitter.js';

const webPageUnregistrables = new Map;

/**
 * Receives EditAppAwareWebPage instance and cleans up the previous one. Prepares
 * EditAppAwareWebPage's data and dispatches them to various stores.
 */
class IframePageManager {
    // currentWebPage; // public
    // highlightRectEl;
    // getCurrentLeftPanelWidth;
    /**
     * @param {HTMLElement} highlightRectEl
     * @param {(width: Number) => void} getCurrentLeftPanelWidth
     */
    constructor(highlightRectEl, getCurrentLeftPanelWidth) {
        this.highlightRectEl = highlightRectEl;
        this.getCurrentLeftPanelWidth = getCurrentLeftPanelWidth;
    }
    /**
     * @param {EditAppAwareWebPage} webPage
     * @param {Boolean} isDuplicate = false
     * @access public
     */
    loadPage(webPage, isDuplicate = false) {
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
        data.page = maybePatchTitleAndSlug(data.page, isDuplicate);
        //
        webPage.addRootBoundingEls(ordered[ordered.length - 1]);
        webPage.registerEventHandlers(this.createWebsiteEventHandlers(this, webPageUnregistrables));
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
        webPageUnregistrables.set('fastStyleChanges', signals.on('visual-styles-var-value-changed-fast',
            (unitCls, varName, varValue, valueType) => {
                webPage.fastOverrideStyleUnitVar(unitCls, varName, varValue, valueType);
            }));
        }
    /**
     * @param {String} trid
     * @access public
     */
    registerWebPageDomUpdater(trid) {
        if (webPageUnregistrables.has(trid)) return;
        const {fast, slow} = this.currentWebPage.reRenderer.createBlockTreeChangeListeners();
        webPageUnregistrables.set('blockTreeFastChangeListener', observeStore2('theBlockTree', fast));
        webPageUnregistrables.set('blockTreeSlowChangeListener', signals.on('op-queue-before-push-item', slow));
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
    /**
     * @returns {EditAwareWebPageEventHandlers}
     * @access private
     */
    createWebsiteEventHandlers() {
        let prevHoverStartBlockEl = null;
        const TITLE_LABEL_HEIGHT = 18; // at least
        const {highlightRectEl, getCurrentLeftPanelWidth} = this;
        const hideRect = () => {
            highlightRectEl.setAttribute('data-title', '');
            highlightRectEl.style.cssText = '';
            prevHoverStartBlockEl = null;
        };
        const findBlock = blockEl => {
            const trid = blockEl.getAttribute('data-is-stored-to-trid');
            const rootOrInnerTree = blockTreeUtils.getRootFor(trid, store2.get().theBlockTree);
            return blockTreeUtils.findBlock(blockEl.getAttribute('data-block'), rootOrInnerTree)[0];
        };
        let leftPanelWidth = getCurrentLeftPanelWidth();
        webPageUnregistrables.set('highlightRectLeftPosUpdater', signals.on('left-column-width-changed', w => {
            leftPanelWidth = w;
        }));
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
                    'left:', r.left + leftPanelWidth, 'px'
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
                signals.emit('web-page-click-received', blockEl, link, findBlock);
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
 * @returns {Boolean}
 */
function getArePanelsHidden() {
    return env.window.localStorage.sivujettiDoHidePanels === 'yes';
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
 * @param {Boolean} isDuplicate = false
 * @returns {Page}
 */
function maybePatchTitleAndSlug(page, isDuplicate = false) {
    if (page.isPlaceholderPage) {
        page.title = __(page.title) + (!isDuplicate ? '' : ` (${__('Copy')})`);
        page.slug = makeSlug(page.title);
        const pageType = api.getPageTypes().find(({name}) => name === page.type);
        page.path = makePath(page.slug, pageType);
    }
    return page;
}

export default IframePageManager;
export {getArePanelsHidden};
