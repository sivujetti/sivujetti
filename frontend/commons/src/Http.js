class Http {
    /**
     * @param {(url: string, settings?: Object) => Promise<Object>} fetchFn
     * @param {(url: string) => string} makeUrl
     */
    constructor(fetchFn = (url, settings) => window.fetch(url, settings),
                makeUrl = url => url) {
        this.fetchFn = fetchFn;
        this.makeUrl = makeUrl;
    }
    /**
     * @param {string} url esim. '/api/foo'
     * @returns {Promise<Object>}
     * @access public
     */
    get(url) {
        return this.fetchFn(this.makeUrl(url), completeSettings({method: 'GET'}, null))
            .then(resp => {
                if (resp.status === 401)
                    window.console.error('todo');
                return resp.json();
            });
    }
    /**
     * @param {string} url
     * @param {Object} data
     * @param {Object} settings = {}
     * @param {Object} defaults = {method: 'POST'}
     * @returns {Promise<Object>}
     * @access public
     */
    post(url, data, settings = {}, defaults = {method: 'POST'}) {
        return this.fetchFn(this.makeUrl(url), completeSettings(Object.assign(defaults, settings), data))
            .then(resp => {
                if (resp.status === 401)
                    window.console.error('todo');
                return resp.json();
            });
    }
    /**
     * @param {string} url
     * @param {Object} data
     * @param {Object} settings = {}
     * @returns {Promise<Object>}
     * @access public
     */
    put(url, data, settings = {}) {
        return this.post(url, data, settings, {method: 'PUT'});
    }
    /**
     * @param {string} url
     * @param {Object} settings = {}
     * @returns {Promise<Object>}
     */
    delete(url, settings = {}) {
        return this.post(url, null, settings, {method: 'DELETE'});
    }
}

function completeSettings(settings, data) {
    if (!settings.headers)
        settings.headers = {'Content-Type': 'application/json',
                            'X-Requested-With': 'js-fetch'};
    else if (settings.headers === '@auto')
        settings.headers = {'X-Requested-With': 'js-fetch'};
    if (!settings.body && data)
        settings.body = !(data instanceof FormData) ? JSON.stringify(data) : data;
    if (!settings.credentials)
        settings.credentials = 'same-origin';
    return settings;
}

export default Http;
