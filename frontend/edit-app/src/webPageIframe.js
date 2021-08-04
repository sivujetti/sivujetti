import {env, urlUtils} from '@kuura-commons';

const webPageIframe = {
    /**
     * @param {String} pageType
     * @param {String} layoutId = '1'
     */
    openPlaceholderPage(pageType, layoutId = '1') {
        const u = urlUtils.makeUrl(`/api/_placeholder-page/${pageType}/${layoutId}`);
        env.document.getElementById('kuura-site-iframe').contentWindow.location.href = u;
    },
    /**
     */
    goBack() {
        env.window.history.back();
    }
};

export default webPageIframe;
