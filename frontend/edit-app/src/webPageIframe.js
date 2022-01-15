import {env, urlUtils} from '@sivujetti-commons-for-edit-app';

const webPageIframe = {
    /**
     * @param {String} pageTypeName
     * @param {String} layoutId = '1'
     */
    openPlaceholderPage(pageTypeName, layoutId = '1') {
        const u = urlUtils.makeUrl(`/api/_placeholder-page/${pageTypeName}/${layoutId}`);
        this.getEl().contentWindow.location.href = u;
    },
    /**
     */
    goBack() {
        env.window.history.back();
    },
    /**
     */
    getEl() {
        return env.document.getElementById('sivujetti-site-iframe');
    }
};

export default webPageIframe;
