import {__, api, signals, env} from '@sivujetti-commons-for-edit-app';
import store, {setCurrentPageDataBundle, setOpQueue} from '../store.js';
import store2, {observeStore as observeStore2} from '../store2.js';
import {makePath, makeSlug} from '../block-types/pageInfo.js';
import opQueueItemEmitter from '../OpQueueItemEmitter.js';
import {findBlockFrom} from '../block/utils-utils.js';

const webPageUnregistrables = new Map;
const TITLE_LABEL_HEIGHT = 18; // at least

/**
 * Receives EditAppAwareWebPage instance and cleans up the previous one. Prepares
 * EditAppAwareWebPage's data and dispatches them to various stores.
 */
class IframePageManager {
    // currentWebPage; // public
    // highlightRectEl;
    // getCurrentLeftPanelWidth;
    // cachedLeftPanelWidth;
    // stickyHighlightRect;
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
        //
        const {data} = webPage;
        delete webPage.data;
        data.page = maybePatchTitleAndSlug(data.page, isDuplicate);
        //
        webPage.addRootBoundingEls(ordered[ordered.length - 1]);
        webPage.registerEventHandlers(this.createWebsiteEventHandlers(this, webPageUnregistrables));
        webPage.setIsMouseListenersDisabled(getArePanelsHidden());
        this.registerWebPageDomUpdater('main');
        this.currentWebPage.reRenderer.setOnReRender(this.onWebPageReRender.bind(this));
        //
        data.page.__blocksDebugOnly = data.page.blocks;
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
        const {getCurrentLeftPanelWidth} = this;
        const hideRect = () => {
            this.hideHighlightRect(false);
            prevHoverStartBlockEl = null;
        };
        this.cachedLeftPanelWidth = getCurrentLeftPanelWidth();
        webPageUnregistrables.set('highlightRectLeftPosUpdater', signals.on('left-column-width-changed', w => {
            this.cachedLeftPanelWidth = w;
        }));
        const pageManager = this;
        return {
            /**
             * @param {HTMLElement} blockEl
             * @param {DOMRect} rect
             */
            onHoverStarted(blockEl, rect) {
                if (prevHoverStartBlockEl === blockEl)
                    return;
                const [block] = findBlockFrom(blockEl.getAttribute('data-block'), 'mainTree');
                pageManager.showHighlightRect(block, false, rect);
                prevHoverStartBlockEl = blockEl;
            },
            /**
             * @param {HTMLElement|null} blockEl
             * @param {HTMLAnchorElement|null} link
             */
            onClicked(blockEl, link) {
                signals.emit('web-page-click-received', blockEl, link);
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
    /**
     * @param {RawBlock} block
     * @param {Boolean} isSticky
     * @param {DOMRect} rect = null
     * @access private
     */
    showHighlightRect(block, isSticky, rect = null) {
        const {highlightRectEl} = this;
        if (!rect) rect = this.currentWebPage.getBlockEl(block.id).getBoundingClientRect();

        if (isSticky) this.stickyHighlightRect = {block, rect};
        highlightRectEl.style.cssText = [
            'width:', rect.width, 'px;',
            'height:', rect.height, 'px;',
            'top:', rect.top, 'px;',
            'left:', rect.left + this.cachedLeftPanelWidth, 'px'
        ].join('');

        if (rect.top < -TITLE_LABEL_HEIGHT)
            highlightRectEl.setAttribute('data-position', 'bottom-inside');
        else if (rect.top > TITLE_LABEL_HEIGHT)
            highlightRectEl.setAttribute('data-position', 'top-outside');
        else
            highlightRectEl.setAttribute('data-position', 'top-inside');
        highlightRectEl.setAttribute('data-title',
            (block.type !== 'PageInfo' ? '' : `${__('Page title')}: `) + block.title || __(block.type)
        );
    }
    /**
     * @param {Boolean} clearSticky
     * @access private
     */
    hideHighlightRect(clearSticky) {
        const {highlightRectEl} = this;
        highlightRectEl.setAttribute('data-title', '');
        highlightRectEl.style.cssText = '';

        if (clearSticky)
            this.stickyHighlightRect = null;
        else if (this.stickyHighlightRect) {
            setTimeout(() => {
                this.showHighlightRect(this.stickyHighlightRect.block, true);
            }, 40);
        }
    }
    /**
     * @access private
     */
    onWebPageReRender() {
        if (!this.stickyHighlightRect) return;
        const {block, rect} = this.stickyHighlightRect;
        const el = this.currentWebPage.getBlockEl(block.id);
        if (!el) { // removed from dom
            this.hideHighlightRect(true);
            return;
        }
        const rectNow = el.getBoundingClientRect();
        if (rectNow.width !== rect.width || rectNow.height !== rect.height ||
            rectNow.top !== rect.top || rectNow.left !== rect.left)
            this.showHighlightRect(block, true);
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
