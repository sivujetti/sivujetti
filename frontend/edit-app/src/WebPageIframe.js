import {createTrier} from '../../../frontend/webpage/src/EditAppAwareWebPage.js';
import IframePageManager from './IframePageManager.js';

let env;
let urlUtils;

class WebPageIframe {
    // el;
    // pageManager;
    /**
     * @param {HTMLIFrameElement} el
     * @param {HTMLElement} blockHighlightEl
     * @param {any} _env
     * @param {any} _urlUtils
     */
    constructor(el, blockHighlightEl, _env, _urlUtils) {
        this.el = el;
        this.pageManager = new IframePageManager(blockHighlightEl);
        env = _env;
        urlUtils = _urlUtils;
    }
    /**
     * @param {String} pageTypeName
     * @param {String} layoutId = '1'
     * @param {String} slug = ''
     * @returns {Promise<EditAppAwareWebPage>}
     * @access public
     */
    renderPlaceholderPage(pageTypeName, layoutId = '1', slug = '') {
        return this.loadPage(
            urlUtils.makeUrl(`/api/_placeholder-page/${pageTypeName}/${layoutId}`) + (!slug ? '' : `/${encodeURIComponent(slug)}`)
        );
    }
    /**
     * @param {String} slug
     * @returns {Promise<EditAppAwareWebPage>}
     * @access public
     */
    renderNormalPage(slug) {
        return this.loadPage(
            urlUtils.makeUrl(slug) + `${urlUtils.baseUrl.indexOf('?') < 0 ? '?' : '&'}in-edit=1`,
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
     * @param {String} iframeUrl
     * @returns {Promise<EditAppAwareWebPage>}
     * @access private
     */
    loadPage(iframeUrl) {
        if (env.window.receiveNewPreviewIframePage)
            throw new Error('race condition');
        return new Promise(resolve => {
            // 1.
            env.window.receiveNewPreviewIframePage = webPage => {
                // 3.
                this.pageManager.loadPage(webPage);
                resolve(webPage);
                env.window.receiveNewPreviewIframePage = null;
            };
            // 2.
            this.getEl().contentWindow.location.replace(iframeUrl);
        });
    }
}

export default WebPageIframe;
