import {
    __,
    api,
    env,
    http,
    objectUtils,
} from '@sivujetti-commons-for-edit-app';
import {treeToTransferable} from '../includes/block/utils.js';
import toasters from '../includes/toasters.jsx';
import {pathToFullSlug} from '../includes/utils.js';
import globalData from '../includes/globalData.js';
/** @typedef {import('../includes/toasters.jsx').messageLevel} messageLevel */

const handlerFactoriesMap = {
    currentPageData: createCurrentPageDataChannelHandler,
    globalBlockTrees: createGlobalBlockTreesChannelHandler,
    quicklyAddedPages: createQuicklyAddedPagesChannelHandler,
    reusableBranches: createReusableBranchesChannelHandler,
    stylesBundle: createStylesBundleChannelHandler,
    theBlockTree: createBlockTreeChannelHandler,
    pageTypes: createPageTypesChannelHandler,
};

function createStylesBundleChannelHandler() {
    return {
        /**
         * @param {StylesBundleWithId} state
         * @param {StateChangeUserContext|null} _userCtx
         * @param {stateChangeContext} _context
         */
        handleStateChange(state, _userCtx, _context) {
            const {cachedCompiledCss} = state;
            api.webPagePreview.updateCss(cachedCompiledCss);
        },
        /**
         * @param {StateHistory} stateHistory
         * @param {Array<StateHistory>} _otherHistories
         * @returns {Promise<boolean|any>}
         */
        syncToBackend(stateHistory, _otherHistories) {
            const toTransferable = bundle => {
                const {id, type} = api.saveButton.getInstance().getChannelState('currentPageData');
                return {
                    styleChunks: bundle.styleChunks,
                    cachedCompiledCss: bundle.cachedCompiledCss,
                    pageId: id,
                    pageType: type,
                };
            };
            return doPostOrPut(http.put(
                `/api/themes/${globalData.theme.id}/styles/all`,
                toTransferable(stateHistory.latest)
            ));
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
            if (userCtx?.event === 'update-single-block-prop') {
                if (!userCtx?.isDefPropOnly)
                    api.webPagePreview.reRenderBlock(state, api.saveButton.getInstance().getChannelState('globalBlockTrees'), null);
            } else
                api.webPagePreview.reRenderAllBlocks(state, api.saveButton.getInstance().getChannelState('globalBlockTrees'));
        },
        /**
         * @param {StateHistory} stateHistory
         * @param {Array<StateHistory>} _otherHistories
         * @returns {Promise<boolean|any>}
         */
        syncToBackend(stateHistory, _otherHistories) {
            const page = api.saveButton.getInstance().getChannelState('currentPageData');
            const blocks = treeToTransferable(stateHistory.latest);
            return doPostOrPut(http.put(
                `/api/pages/${page.type}/${page.id}/blocks`,
                {blocks}
            ), (err, [message, level]) =>
                [err.cause?.status === 403 ? 'You lack permissions to edit this content.' : message, level]
            );
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
         * @returns {Promise<boolean|any>}
         */
        async syncToBackend(stateHistory, _otherHistories) {
            const saveable = createSaveableItems(stateHistory);
            const results = await Promise.all(saveable.map(({type, arg}) => type === 'insert'
                ? http.post('/api/reusable-branches', arg)
                : (window.console.error(`${type}:ng to backend not implemented yet`), {ok: 'ok'})
            ));
            return results.every(resp => resp?.ok === 'ok');
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
        handleStateChange(state, userCtx, _context) {
            if (userCtx?.event === 'update-block-in') {
                if (!userCtx?.isDefPropOnly)
                    api.webPagePreview.reRenderBlock(api.saveButton.getInstance().getChannelState('theBlockTree'), state, null);
            } else
                api.webPagePreview.reRenderAllBlocks(api.saveButton.getInstance().getChannelState('theBlockTree'), state);
        },
        /**
         * @param {StateHistory} stateHistory
         * @param {Array<StateHistory>} _otherHistories
         * @returns {Promise<boolean|any>}
         */
        async syncToBackend(stateHistory, _otherHistories) {
            const saveable = createSaveableItems(stateHistory);
            const results = await Promise.all(saveable.map(({type, arg}) => type === 'update'
                ? http.put(`/api/global-block-trees/${arg.id}/blocks`, {blocks: arg.blocks})
                : http.post('/api/global-block-trees', arg)
            ));
            return results.every(resp => resp?.ok === 'ok');
        }
    };
}

function createQuicklyAddedPagesChannelHandler() {
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
         * @returns {Promise<boolean|any>}
         */
        async syncToBackend(stateHistory, _otherHistories) {
            const saveable = createSaveableItems(stateHistory);
            const results = await Promise.all(saveable.map(({arg}) =>
                http.post(`/api/pages/${arg.type}/upsert-quick`, arg)
            ));
            return results.every(resp => resp?.ok === 'ok');
        }
    };
}

function createCurrentPageDataChannelHandler() {
    let unregisterNavigateToNewSlugHandler;
    return {
        /**
         * @param {Page} _state
         * @param {StateChangeUserContext|null} _userCtx
         * @param {stateChangeContext} _context
         */
        handleStateChange(_state, _userCtx, _context) {
            // Do nothing
        },
        /**
         * @param {StateHistory<Page>} stateHistory
         * @param {Array<StateHistory>} _otherHistories
         * @returns {Promise<boolean|any>}
         */
        syncToBackend(stateHistory, _otherHistories) {
            if (!stateHistory.latest.isPlaceholderPage) {
                return this.syncAlreadyExistingPageToBackend(
                    stateHistory.latest,
                    stateHistory.initial,
                );
            }
            return this.syncNewPageToBackend(stateHistory.latest);
        },
        /**
         * @param {Page} page
         * @param {Page} syncedPage
         * @returns {Promise<boolean|any>}
         * @access private
         */
        syncAlreadyExistingPageToBackend(page, syncedPage) {
            const data = toTransferable(page, ['blocks', 'isPlaceholderPage']);

            // Add code that redirects to the new path after SaveButton has finished syncQueuedOpsToBackend()
            if (data.path !== syncedPage.path && !unregisterNavigateToNewSlugHandler) {
                const newPagePath = pathToFullSlug(data.path, '');
                unregisterNavigateToNewSlugHandler = api.saveButton.getInstance().onAfterItemsSynced(() => {
                    env.window.myRoute(newPagePath);
                    unregisterNavigateToNewSlugHandler();
                    unregisterNavigateToNewSlugHandler = null;
                });
            }

            return doPostOrPut(
                http.put(`/api/pages/${data.type}/${data.id}`, data)
            );
        },
        /**
         * @param {Page} newPage
         * @returns {Promise<boolean|any>}
         * @access private
         */
        syncNewPageToBackend(newPage) {
            const postData = toTransferable(newPage);
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
                .catch(err => handleHttpError(err, null));
        }
    };
}

function createPageTypesChannelHandler() {
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
         * @returns {Promise<boolean|any>}
         */
        async syncToBackend(stateHistory, _otherHistories) {
            const saveable = createSaveableItems(stateHistory, 'name');
            const results = await Promise.all(saveable.map(({arg}) =>
                http.post('/api/page-types', arg)
            ));
            return results.every(resp => resp?.ok === 'ok');
        }
    };
}

/**
 * @param {Error|Object} err
 * @param {adjustErrorToastArgsFn|null} adjustErrorToastArgs
 */
function handleHttpError(err, adjustErrorToastArgs) {
    window.console.error(err);
    //
    const pair1 = err.cause?.status === 403
        ? ['You lack permissions to do this action.', 'notice']
        : ['Something unexpected happened.', 'error'];
    const [message, level] = !adjustErrorToastArgs
        ? pair1
        : adjustErrorToastArgs(err, ...pair1);
    toasters.editAppMain(__(message), level);
    //
    return false;
}

/**
 * @param {Page & {[additionalProps: string]: any;}} page
 * @param {Array<keyof Page|string>} notTheseKeys = [] Example: ['id', 'blocks' ...]
 * @return {{[key: string]: any;}} Clean object
 */
function toTransferable(page, notTheseKeys = []) { // todo yhdistä jonnekin utilsiin 
    const allKeys = Object.keys(page);
    const onlyTheseKeys = allKeys.filter(key =>
        !key.startsWith('__') && notTheseKeys.indexOf(key) < 0
    );
    return objectUtils.clonePartially(onlyTheseKeys, page);
}

/**
 * @param {Promise<Object|string>} httpCall
 * @param {adjustErrorToastArgsFn} adjustErrorToastArgs = null
 * @returns {Promise<boolean>}
 */
async function doPostOrPut(httpCall, adjustErrorToastArgs = null) {
    try {
        const resp = await httpCall;
        if (resp.ok !== 'ok') throw new Error(typeof resp.err !== 'string' ? '-' : resp.err);
        return true;
    } catch (err) {
        return handleHttpError(err, adjustErrorToastArgs);
    }
}

/**
 * @template T
 * @param {StateHistory} stateHistory
 * @param {string} key = 'id'
 * @returns {Array<{type: 'insert'|'update'; arg: T;}>}
 */
function createSaveableItems({initial, latest}, key = 'id') {
    const out = [];
    for (const entity of latest) {
        const fromInitial = initial.find(ent => ent[key] === entity[key]);
        const isNew = !fromInitial;
        if (isNew)
            out.push({type: 'insert', arg: entity});
        else if (JSON.stringify(fromInitial) !== JSON.stringify(entity))
            out.push({type: 'update', arg: entity, isNew});
    }
    const includeDeletables = false;
    if (includeDeletables) {
    for (const entity of initial) {
        const fromLatest = latest.find(ent => ent[key] === entity[key]);
        if (!fromLatest)
            out.push({type: 'delete', arg: entity[key]});
    }
    }
    return out;
}

/**
 * @param {Array<StateHistory>} queue
 * @returns {{[channelName: string]: state;}}
 */
function getLatestItemsOfEachChannel(queue) {
    const out = {};
    for (const item of queue) {
        if (!item.latest) continue;
        out[item.channelName] = item.latest;
    }
    return out;
}

/**
 * @param {HistoryItem|Array<HistoryItem>} ir
 * @returns {Array<HistoryItem>}
 */
function normalizeItem(ir) {
    return Array.isArray(ir) ? ir : [ir];
}

/**
 * @param {string} channelName
 * @returns {string}
 */
function createSignalName(channelName) {
    return `on-${channelName}-event`;
}

/**
 * @returns {Object}
 */
function createInitialState() {
    return {
        isVisible: false,
        isSubmitting: false,
        canUndo: false,
        canRedo: false,
    };
}

/**
 * @typedef {(err: Error|Object, message: string, level: messageLevel) => [string, messageLevel]} adjustErrorToastArgsFn
 */

export {
    createInitialState,
    createSignalName,
    getLatestItemsOfEachChannel,
    handlerFactoriesMap,
    normalizeItem,
};
