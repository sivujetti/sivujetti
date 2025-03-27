class HttpErrorCause {
    /**
     * @param {string|Array<string>} error
     * @param {Response} response
     */
    constructor(error, response) {
        this.error = error;
        this.response = response;
    }
}

class Http {
    static ErrorCauseClass = HttpErrorCause;
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
     * @param {RequestInit} settings = {}
     * @param {boolean} throwIfError = false
     * @returns {Promise<Object>}
     * @access public
     */
    async get(url, settings = {}, throwIfError = false) {
        const resp = await this.fetchFn(this.makeUrl(url), completeSettings({method: 'GET', ...settings}, null));
        await throwErrorIfNeeded(resp, throwIfError);
        return readResponseBody(resp);
    }
    /**
     * @param {string} url
     * @param {Object} data
     * @param {RequestInit} settings = {}
     * @param {RequestInit} defaults = {method: 'POST'}
     * @param {boolean} throwIfError = false
     * @returns {Promise<Object>}
     * @access public
     */
    async post(url, data, settings = {}, defaults = {method: 'POST'}, throwIfError = false) {
        const resp = await this.fetchFn(this.makeUrl(url), completeSettings({...defaults, ...settings}, data));
        await throwErrorIfNeeded(resp, throwIfError);
        return readResponseBody(resp);
    }
    /**
     * @param {string} url
     * @param {Object} data
     * @param {RequestInit} settings = {}
     * @param {boolean} throwIfError = false
     * @returns {Promise<Object>}
     * @access public
     */
    put(url, data, settings = {}, throwIfError = false) {
        return this.post(url, data, settings, {method: 'PUT'}, throwIfError);
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

/**
 * @param {Response} resp
 * @param {boolean} throwIfError
 * @returns {Promise<void>}
 * @throws {Error}
 */
async function throwErrorIfNeeded(resp, throwIfError) {
    if (!throwIfError)
        return;
    if (resp.status === 400 || resp.status === 403 || resp.status === 401) {
        let error = null;
        try {
            error = await readResponseBody(resp);
        } catch (e) {
            error = e.message;
        }
        throw new Error(
            resp.statusText, // '400 Bad Request', '403 Forbidden' etc.
            {cause: new Http.ErrorCauseClass(error, resp)}
        );
    }
}

/**
 * @template T
 * @param {Response} resp 
 * @returns {Promise<T>}
 */
function readResponseBody(resp) {
    return resp.json();
}

/**
 * @param {RequestInit & {headers?: HeadersInit|'@auto';}} settings
 * @returns {RequestInit}
 */
function completeSettings(settings, data) {
    if (!settings.headers)
        settings.headers = {'Content-Type': 'application/json',
                            'X-Requested-With': 'Loving kindness'};
    else if (settings.headers === '@auto')
        settings.headers = {'X-Requested-With': 'Loving kindness'};
    if (!settings.body && data)
        settings.body = !(data instanceof FormData) ? JSON.stringify(data) : data;
    if (!settings.credentials)
        settings.credentials = 'same-origin';
    return settings;
}

export default Http;
