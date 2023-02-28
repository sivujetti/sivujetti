import {__, api, env, urlUtils} from '@sivujetti-commons-for-edit-app';
import {CHILDREN_START, CHILD_CONTENT_PLACEHOLDER, CHILDREN_END, createTrier, noop} from '../block/dom-commons.js';
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
            urlUtils.makeUrl(`/api/_placeholder-page/${pageTypeName}/${layoutId}`)
                + (!slug ? '' : t(`duplicate=${encodeURIComponent(slug)}`))
        );
    }
    /**
     * @param {String} slug
     * @returns {Promise<EditAppAwareWebPage>}
     * @access public
     */
    renderNormalPage(slug) {
        return this.loadPageToIframe(
            `${urlUtils.makeUrl(slug)}${t('in-edit=1')}`,
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
     * @param {Boolean} isStillMaybeInsertingToDom = false
     * @access public
     */
    scrollTo(block, isStillMaybeInsertingToDom = false) {
        const win = this.getEl().contentWindow;
        const doScroll = inPageElRect => {
            const inPageElTop = inPageElRect.top;
            const elBottom = inPageElRect.bottom;
            const quarterVisible = win.innerHeight / 4;
            const scrollToInPageEl = () => {
                win.scrollTo({
                    top: inPageElTop + win.scrollY - 40,
                    behavior: 'smooth'
                });
            };
            //
            if (inPageElTop <= 0 && elBottom <= (quarterVisible * 3)) {
                scrollToInPageEl();
            } else if (elBottom < 0) {
                scrollToInPageEl();
            } else if (inPageElTop > quarterVisible) {
                scrollToInPageEl();
            }
        };
        //
        if (block.type === 'PageInfo') return;
        const body = this.getEl().contentDocument.body;
        const getRect = firstEl => firstEl.getBoundingClientRect();
        if (!isStillMaybeInsertingToDom) {
            doScroll(getRect(body.querySelector(`[data-block="${block.id}"]`)));
        } else {
            createTrier(() => {
                const el = body.querySelector(`[data-block="${block.id}"]`);
                if (el) { doScroll(getRect(el)); return true; }
                else return false;
            }, 80, 800)();
        }
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
                webPage.init(renderBlockAndThen, toTransferable, blockTreeUtils);
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

function t(url) {
    return `${urlUtils.baseUrl.indexOf('?') < 0 ? '?' : '&'}${url}`;
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
