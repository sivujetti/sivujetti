import {createTrier} from '../../../frontend/webpage/src/EditAppAwareWebPage.js';

let env;
let urlUtils;

class WebPageIframe {
    // el;
    /**
     * @param {HTMLIFrameElement} el
     * @param {any} _env
     * @param {any} _urlUtils
     */
    constructor(el, _env, _urlUtils) {
        this.el = el;
        env = _env;
        urlUtils = _urlUtils;
    }
    /**
     * @param {String} pageTypeName
     * @param {String} layoutId = '1'
     */
    openPlaceholderPage(pageTypeName, layoutId = '1') {
        const u = urlUtils.makeUrl(`/api/_placeholder-page/${pageTypeName}/${layoutId}`);
        this.getEl().contentWindow.location.href = u;
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
        const getRect = firstEl => firstEl.querySelector(':scope > [data-block-root]') ||
                firstEl.getBoundingClientRect();
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
     * @returns {HTMLElement}
     */
    getEl() {
        return this.el;
    }
}

export default WebPageIframe;
