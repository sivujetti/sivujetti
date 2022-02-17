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
     * @param {Block} block
     */
    scrollTo(block) {
        const win = this.getEl().contentWindow;
        const inPageElRect = block.getRootDomNode().getBoundingClientRect();
        const inPageElTop = inPageElRect.top;
        const min = (a, b) => a >= b ? a : b;
        if (inPageElTop > win.innerHeight)
            win.scrollTo({
                top: inPageElTop + min(inPageElRect.heigth * 0.5, 100),
                behavior: 'smooth'
            });
        else if (inPageElTop < 0)
            win.scrollTo({
                top: win.scrollY - Math.abs(inPageElTop) - min(inPageElRect.heigth * 0.5, 100),
                behavior: 'smooth'
            });
    }
    /**
     * @returns {HTMLElement}
     */
    getEl() {
        return this.el;
    }
}

export default WebPageIframe;
