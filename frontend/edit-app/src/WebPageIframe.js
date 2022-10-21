import {createTrier} from '../../../frontend/webpage/src/EditAppAwareWebPage.js';
import createInit from './Test.js'; // ??

let env;
let urlUtils;

class WebPageIframe {
    // el;
    // blockHighlightEl;
    /**
     * @param {HTMLIFrameElement} el
     * @param {HTMLElement} blockHighlightEl
     * @param {any} _env
     * @param {any} _urlUtils
     */
    constructor(el, blockHighlightEl, _env, _urlUtils) {
        this.el = el;
        this.blockHighlightEl = blockHighlightEl;
        env = _env;
        urlUtils = _urlUtils;
    }
    foo(pageTypeName, layoutId, ia, then) {
        this._foo(() => {
            this.renderPlaceholderPage(pageTypeName, layoutId||'1', ia||'');
        }, then);
    }
    foo2(slug, then) {
        this._foo(() => {
            this.renderInEditPage(slug);
        }, then);
    }
    _foo(fn ,then) {
        if (env.window.receiveNewPreviewIframePage)
            throw new Error('race condition');
        // 2.
        env.window.receiveNewPreviewIframePage = webPage => {
            createInit(this.getBlockHighlightEl())(webPage);
            then(webPage);
            env.window.receiveNewPreviewIframePage = null;
        };
        // 1.
        fn();
    }
    /**
     * @param {String} pageTypeName
     * @param {String} layoutId = '1'
     * @param {String} is = '' 
     */
    openPlaceholderPage(pageTypeName, layoutId = '1', ia = '') { 
        const u = urlUtils.makeUrl(`/api/_placeholder-page/${pageTypeName}/${layoutId}`);
        this.getEl().contentWindow.location.href = u + (!ia ? '' : `/${encodeURIComponent(ia)}`);
    }
    renderInEditPage(slug) {
        const u = urlUtils.makeUrl(slug) + `${urlUtils.baseUrl.indexOf('?') < 0 ? '?' : '&'}in-edit=1`;
        this.getEl().contentWindow.location.replace(u);
    }
    renderPlaceholderPage(pageTypeName, layoutId = '1', ia = '') {
        const u = urlUtils.makeUrl(`/api/_placeholder-page/${pageTypeName}/${layoutId}`) + (!ia ? '' : `/${encodeURIComponent(ia)}`);
        this.getEl().contentWindow.location.replace(u);
    }
    /**
     */
    goBack() {
        env.window.history.back();
    }
    /**
     * @param {RawBlock} block
     * @param {Boolean} isStillMaybeInsertingToDom = false
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
     */
    getEl() {
        return this.el;
    }
    /**
     * @returns {HTMLElement}
     */
    getBlockHighlightEl() {
        return this.blockHighlightEl;
    }
}

export default WebPageIframe;
