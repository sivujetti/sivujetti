import {env} from '@kuura-commons';
import {urlUtils} from '../../commons/utils.js';

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
