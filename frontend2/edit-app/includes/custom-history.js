import {env, Events} from '@sivujetti-commons-for-edit-app';

class HashHistory {
    // path;
    // events;
    // confirmNextNavMessage;
    // doRevertNextHashChange;
    /**
     */
    constructor() {
        this.path = this.parsePath();
        this.events = new Events;
        this.confirmNextNavMessage = null;
        this.doRevertNextHashChange = false;
        env.window.addEventListener('popstate', () => {
            if (!this.confirmNextNavMessage) {
                this.doRevertNextHashChange = false;
                return;
            }
            this.doRevertNextHashChange = env.window.confirm(this.confirmNextNavMessage) !== true;
        });
        env.window.addEventListener('hashchange', e => {
            if (e.newURL !== e.oldURL) {
                if (!this.doRevertNextHashChange) {
                    this.path = this.parsePath();
                    this.events.emit('dummy', {...this.path});
                } else {
                    history.replaceState(null, null, e.oldURL);
                }
            }
        });
    }
    /**
     * @returns {Path}
     * @access public
     */
    getCurrentLocation() {
        return this.path;
    }
    /**
     * @param {String} withMessage
     * @returns {() => void}
     * @access public
     */
    block(withMessage) {
        this.confirmNextNavMessage = withMessage;
        return () => { this.confirmNextNavMessage = null; };
    }
    /**
     * @param {String} url
     * @access public
     */
    push(url) {
        env.window.location.hash = `#${url}`;
    }
    /**
     * @access public
     */
    replace() {
        throw new Error('Not supported.');
    }
    /**
     * @param {(update: Path) => void} listener
     * @returns {() => void}
     * @access public
     */
    listen(listener) {
        return this.events.on('dummy', listener);
    }
    /**
     * https://github.com/remix-run/history/blob/c9bc27dfcf81f540ee275978f651d3fed27e93a9/packages/history/index.ts#L1069
     * @param {String} path
     * @returns {Path}
     */
    parsePath(url = env.window.location.hash.substr(1)) {
        if (!url) return {pathname: '/', search: '', hash: ''};

        let parsedPath = {};

        let hashIndex = url.indexOf('#');
        if (hashIndex >= 0) {
            parsedPath.hash = url.substr(hashIndex);
            url = url.substr(0, hashIndex);
        } else parsedPath.hash = null;

        let searchIndex = url.indexOf('?');
        if (searchIndex >= 0) {
            parsedPath.search = url.substr(searchIndex);
            url = url.substr(0, searchIndex);
        } else parsedPath.search = null;

        parsedPath.pathname = url;

        return parsedPath;
    }
}

export default (_options = {}) => new HashHistory();
