import {__, api, env, urlUtils} from '@sivujetti-commons-for-edit-app';
import {CHILDREN_START, CHILD_CONTENT_PLACEHOLDER, CHILDREN_END, noop,
        isMetaBlock, getBlockEl} from '../block/dom-commons.js';
import {toTransferable} from '../block/utils.js';
import blockTreeUtils from '../left-column/block/blockTreeUtils.js';
import IframePageManager from './IframePageManager.js';

const useShareNothing = true;

class WebPageIframe {
    // el;
    // pageManager;
    /**
     * @param {HTMLIFrameElement} el
     * @param {HTMLElement} blockHighlightEl
     * @param {(width: Number) => void} getCurrentLeftPanelWidth
     */
    constructor(el, blockHighlightEl, getCurrentLeftPanelWidth) {
        this.el = el;
        this.pageManager = new IframePageManager(blockHighlightEl, getCurrentLeftPanelWidth);
    }
    /**
     * @param {String} pageTypeName
     * @param {String} layoutId = '1'
     * @param {String} slug = ''
     * @returns {Promise<EditAppAwareWebPage>}
     * @access public
     */
    renderPlaceholderPage(pageTypeName, layoutId = '1', slug = '') {
        return this.loadPageToIframe(
            urlUtils.makeUrl(`/api/_placeholder-page/${pageTypeName}/${layoutId}`
                + (!slug ? '' : `?duplicate=${encodeURIComponent(slug)}`))
        );
    }
    /**
     * @param {String} slug
     * @returns {Promise<EditAppAwareWebPage>}
     * @access public
     */
    renderNormalPage(slug) {
        return this.loadPageToIframe(
            urlUtils.makeUrl(`${slug}?in-edit=1`)
        );
    }
    /**
     * @access public
     */
    goBack() {
        env.window.history.back();
    }
    /**
     * @param {RawBlock} block
     * @returns {Boolean} didScroll
     * @access public
     */
    scrollToBlock(block, win = this.getEl().contentWindow, behavior = 'smooth') {
        if (isMetaBlock(block)) return;
        const body = this.getEl().contentDocument.body;
        const getRect = firstEl => firstEl.getBoundingClientRect();
        const inPageElRect = getRect(getBlockEl(block.id, body));
        const inPageElTop = inPageElRect.top;
        const elBottom = inPageElRect.bottom;
        const quarterVisible = win.innerHeight / 4;
        if (inPageElTop <= 0 && elBottom <= (quarterVisible * 3) ||
            elBottom < 0 ||
            inPageElTop > quarterVisible) {
            win.scrollTo({
                top: inPageElTop + win.scrollY - 40,
                behavior,
            });
            return true;
        }
        return false;
    }
    /**
     * @param {Number} childElemIdx
     * @param {String} textBlockId
     * @access public
     */
    scrollToTextBlockChildEl(childElemIdx, textBlockId, behavior = 'auto') {
        const body = this.getEl().contentDocument.body;
        const blockEl = getBlockEl(textBlockId, body);
        const child = blockEl.children[childElemIdx];
        const rect = child.getBoundingClientRect();
        const win = this.getEl().contentWindow;
        win.scrollTo({
            top: rect.top + win.scrollY - 30,
            behavior,
        });
    }
    /**
     * @param {RawBlock} block
     * @access public
     */
    highlightBlock(block) {
        if (isMetaBlock(block)) return;
        this.pageManager.showHighlightRect(block, 'block-tree');
    }
    /**
     * @param {String} blockId
     * @access public
     */
    unHighlightBlock(blockId) {
        this.pageManager.hideHighlightRect(blockId);
    }
    /**
     * @param {Number} elIdx
     * @param {String} blockId
     * @access public
     */
    highlightTextBlockChildEl(elIdx, block) {
        elIdx, block;
    }
    /**
     * @param {Number} elIdx
     * @param {String} blockId
     * @access public
     */
    unHighlightTextBlockChildEl(elIdx, blockId) {
        elIdx, blockId;
    }
    /**
     * @returns {HTMLIFrameElement}
     * @access public
     */
    getEl() {
        return this.el;
    }
    /**
     * @param {String} trid
     * @access public
     */
    registerWebPageDomUpdater(trid) {
        this.pageManager.registerWebPageDomUpdater(trid);
    }
    /**
     * @param {String} trid
     * @access public
     */
    unregisterWebPageDomUpdaterForBlockTree(trid) {
        this.pageManager.unregisterWebPageDomUpdaterForBlockTree(trid);
    }
    /**
     * @param {String} url
     * @returns {Promise<EditAppAwareWebPage>}
     * @access private
     */
    loadPageToIframe(url) {
        if (env.window.receiveNewPreviewIframePage)
            env.window.console.log('Previous page didn\'t load properly, ignoring.');
        return new Promise(resolve => {
            // 1.
            env.window.receiveNewPreviewIframePage = webPage => {
                // 3.
                webPage.init(renderBlockAndThen, toTransferable, blockTreeUtils,
                    this.pageManager.currentWebPage?.metaKeyIsPressed || false);
                this.pageManager.loadPage(webPage, url.indexOf('duplicate=') > -1);
                resolve(webPage);
                env.window.receiveNewPreviewIframePage = null;
            };
            // 2.
            if (!useShareNothing) {
                this.getEl().contentWindow.location.replace(url);
            } else  {
                const newEl = createNewIframeEl(url, this.getEl());
                this.getEl().replaceWith(newEl);
                this.el = newEl;
            }
        });
    }
}

/**
 * @param {String} url
 * @param {HTMLIFrameElement} current
 * @returns {HTMLIFrameElement}
 */
function createNewIframeEl(url, current) {
    const newEl = document.createElement('iframe');
    newEl.src = url;
    newEl.id = current.id;
    const css = current.getAttribute('style');
    if (css) newEl.setAttribute('style', current.getAttribute('style'));
    return newEl;
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
 * @param {Boolean} shouldBackendRender = false
 */
function renderBlockAndThen(block, then, shouldBackendRender = false) {
    const stringOrPromiseOrObj = api.blockTypes.get(block.type).reRender(
        block,
        () => `<!--${CHILDREN_START}-->${CHILD_CONTENT_PLACEHOLDER}<!--${CHILDREN_END}-->`,
        shouldBackendRender
    );
    getBlockReRenderResult(stringOrPromiseOrObj, then);
}

export default WebPageIframe;
export {renderBlockAndThen};
