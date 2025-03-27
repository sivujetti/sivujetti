import {
    __,
    floatingDialog,
    getFromLocalStorage,
    http,
    Http,
    putToLocalStorage,
} from '@sivujetti-commons-for-edit-app';
import AuthReloginDialog from '../main-column/popups/AuthReloginDialog.jsx';

/**
 */
function makeHttp401Aware() {
    const origGet = http.get;
    http.get = async (url, settings = {}, throwIfError = false) => {
        await callHeartbeatIfNeeded(url);
        return origGet.call(http, url, settings, throwIfError);
    };

    const origPost = http.post;
    http.post = async (url, data, settings = {}, defaults = {method: 'POST'}, throwIfError = false) => {
        await callHeartbeatIfNeeded(url);
        return origPost.call(http, url, data, settings, defaults, throwIfError);
    };

    const origPut = http.put;
    http.put = async (url, data, settings = {}, throwIfError = false) => {
        await callHeartbeatIfNeeded(url);
        return origPut.call(http, url, data, settings, throwIfError);
    };

    const origDelete = http.delete;
    http.delete = async (url, settings = {}) => {
        await callHeartbeatIfNeeded(url);
        return origDelete.call(http, url, settings);
    };

    /**
     * @param {string} url
     * @returns {Promise<void>}
     */
    async function callHeartbeatIfNeeded(url) {
        if (!isHeartbeatNeeded(url))
            return;
        try {
            await origGet.call(http, '/api/the-website/do-heartbeat', undefined, true);
            putToLocalStorage(createTimestamp().toString(), 'sivujettiLastHeartbeat');
        } catch (err) {
            if (err?.cause instanceof Http.ErrorCauseClass && err.cause.response.status === 401)
                await doReloginDialog();
        }
    }
}

/**
 * @returns {Promise<void>}
 */
async function doReloginDialog() {
    return new Promise(resolve => {
        floatingDialog.open(AuthReloginDialog, {
            title: __('Login information not found'),
            height: 396,
            backdrop: true,
            noClose: true,
        }, {
            onSuccesfulRelogin: () => {
                resolve();
            }
        });
    });
}

let twentyMinutes = 60 * 20;

/**
 * @param {string} url
 * @returns {boolean}
 */
function isHeartbeatNeeded(url) {
    if (['/api/auth/login', '/api/auth/logout'].indexOf(url) > -1)
        return false;
    const saved = getFromLocalStorage('sivujettiLastHeartbeat');
    const lastChecked = saved ? parseInt(saved, 10) : 0;
    return createTimestamp() - lastChecked > twentyMinutes;
}

/**
 * @returns {number}
 */
function createTimestamp() {
    return Math.floor(Date.now() / 1000);
}

export default makeHttp401Aware;
