import createHashHistory from '../includes/custom-history.js';

const historyInstance = createHashHistory();

class MyRouter extends preactRouter {
    /**
     * @param {String} url
     * @returns {Boolean|undefined}
     * @access public
     */
    routeTo(url) {
        if (historyInstance.doRevertNextHashChange)
            return;
        return super.routeTo(url);
    }
}

export {historyInstance, MyRouter};
