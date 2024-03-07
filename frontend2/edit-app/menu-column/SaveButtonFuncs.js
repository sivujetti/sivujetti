import {
    __,
    http,
    objectUtils,
} from '../../sivujetti-commons-unified.js';
import toasters from '../includes/toasters.jsx';

const handlerFactoriesMap = {
    currentPageDataBundle: createCurrentPageDataBundleChannelHandler,
    globalBlockTrees: createGlobalBlockTreesChannelHandler,
    reusableBranches: createReusableBranchesChannelHandler,
    stylesBundle: createStylesBundleChannelHandler,
    theBlockTree: createBlockTreeChannelHandler,
};

function createStylesBundleChannelHandler() {
    return {
        /**
         * @param {any} state
         * @param {StateChangeUserContext|null} userCtx
         * @param {stateChangeContext} _context
         */
        handleStateChange(state, userCtx, _context) {
        },
        /**
         * @param {StateHistory} stateHistory
         * @param {Array<StateHistory>} _otherHistories
         * @returns Promise<Boolean|any>
         */
        syncToBackend(stateHistory, _otherHistories) {
        }
    };
}

function createBlockTreeChannelHandler() {
    return {
        /**
         * @param {any} state
         * @param {StateChangeUserContext|null} userCtx
         * @param {stateChangeContext} _context
         */
        handleStateChange(state, userCtx, _context) {
        },
        /**
         * @param {StateHistory} stateHistory
         * @param {Array<StateHistory>} _otherHistories
         * @returns Promise<Boolean|any>
         */
        syncToBackend(stateHistory, _otherHistories) {
        },
    };
}

function createReusableBranchesChannelHandler() {
    return {
        /**
         * @param {any} _state
         * @param {StateChangeUserContext|null} _userCtx
         * @param {stateChangeContext} _context
         */
        handleStateChange(_state, _userCtx, _context) {
            // Do nothing
        },
        /**
         * @param {StateHistory} stateHistory
         * @param {Array<StateHistory>} _otherHistories
         * @returns Promise<Boolean|any>
         */
        syncToBackend(stateHistory, _otherHistories) {
            // todo
        }
    };
}
function createGlobalBlockTreesChannelHandler() {
    return {
        /**
         * @param {any} _state
         * @param {StateChangeUserContext|null} _userCtx
         * @param {stateChangeContext} _context
         */
        handleStateChange(_state, _userCtx, _context) {
            // Do nothing
        },
        /**
         * @param {StateHistory} stateHistory
         * @param {Array<StateHistory>} _otherHistories
         * @returns Promise<Boolean|any>
         */
        syncToBackend(stateHistory, _otherHistories) {
        }
    };
}

function createCurrentPageDataBundleChannelHandler() {
    return {
        /**
         * @param {any} _state
         * @param {StateChangeUserContext|null} _userCtx
         * @param {stateChangeContext} _context
         */
        handleStateChange(_state, _userCtx, _context) {
            // Do nothing
        },
        /**
         * @param {StateHistory} stateHistory
         * @param {Array<StateHistory>} _otherHistories
         * @returns Promise<Boolean|any>
         */
        syncToBackend(stateHistory, _otherHistories) {
            if (!stateHistory.latest?.page.isPlaceholderPage) // Not new page, do nothing
                return Promise.resolve(true);
            const postData = toTransferable(stateHistory.latest.page);
            //
            return http.post(`/api/pages/${postData.type}`, postData)
                .then(resp => {
                    if (Array.isArray(resp) && resp[0] === 'Page with identical slug already exists') {
                        toasters.editAppMain(__('Page "%s" already exist.', postData.slug), 'error');
                        return false;
                    }
                    if (resp.ok !== 'ok') throw new Error('-');
                    return true;
                })
                .catch(err => {
                    window.console.error(err);
                    toasters.editAppMain(__('Something unexpected happened.'), 'error');
                    return false;
                });
        }
    };
}

/**
 * @param {Page & {[additionalProps: String]: any;}} page
 * @param {Array<keyof Page|String>} notTheseKeys = [] Example: ['id', 'blocks' ...]
 * @return {{[key: String]: any;}} Clean object
 */
function toTransferable(page, notTheseKeys = []) { // todo yhdistä jonnekin utilsiin 
    const allKeys = Object.keys(page);
    const onlyTheseKeys = allKeys.filter(key =>
        !key.startsWith('__') && notTheseKeys.indexOf(key) < 0
    );
    return objectUtils.clonePartially(onlyTheseKeys, page);
}

export {handlerFactoriesMap};
