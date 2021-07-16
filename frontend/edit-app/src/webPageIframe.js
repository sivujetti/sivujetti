import {urlUtils} from '../../commons/utils.js';

const webPageIframe = {
    /** @var {Env?} */
    env: null,
    /**
     * @param {String} pageType
     * @param {String} layoutId = '1'
     */
    openPlaceholderPage(pageType, layoutId = '1') {
        const u = urlUtils.makeUrl(`/api/_placeholder-page/${pageType}/${layoutId}`);
        this.env.document.getElementById('kuura-site-iframe').contentWindow.location.href = u;
    },
    /**
     */
    goBack() {
        this.env.window.history.back();
    }
};

export default webPageIframe;
