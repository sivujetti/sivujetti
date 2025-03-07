import {Http} from '@sivujetti-commons-for-web-pages';
import {
    __,
    api,
    arrayUtils,
    env,
    http,
    objectUtils,
    stringUtils,
} from '@sivujetti-commons-for-edit-app';
import {treeToTransferable} from '../includes/block/utils.js';
import toasters from '../includes/toasters.jsx';
import {pathToFullSlug} from '../includes/utils.js';
import globalData from '../includes/globalData.js';

const handlerFactoriesMap = {
    'currentPageData': createCurrentPageDataChannelHandler,
    'globalBlockTrees': createGlobalBlockTreesChannelHandler,
    'quicklyAddedPages': createQuicklyAddedPagesChannelHandler,
    'reusableBranches': createReusableBranchesChannelHandler,
    'stylesBundle': createStylesBundleChannelHandler,
    'theBlockTree': createBlockTreeChannelHandler,
    'pageTypes': createPageTypesChannelHandler,
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
         * @returns {Promise<SyncResult>}
         */
        syncToBackend(stateHistory, _otherHistories) {
            const toTransferable = bundle => {
                const {id, type} = api.saveButton.getInstance().getChannelState('currentPageData');
                return {
                    styleChunks: bundle.styleChunks.map(({id, ...rest}) => rest),
                    cachedCompiledCss: bundle.cachedCompiledCss,
                    pageId: id,
                    pageType: type,
                };
            };
            return doWrappedPostOrPut(http.put(
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
         * @returns {Promise<SyncResult>}
         */
        syncToBackend(stateHistory, _otherHistories) {
            const page = api.saveButton.getInstance().getChannelState('currentPageData');
            const blocks = treeToTransferable(stateHistory.latest);
            return doWrappedPostOrPut(http.put(
                `/api/pages/${page.type}/${page.id}/blocks`,
                {blocks},
                undefined,
                true
            ), (message, level, err) =>
                [__(err?.cause instanceof Http.ErrorCauseClass && err.cause.response.status === 403 ? 'You lack permissions to edit this content.' : message), level]
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
         * @returns {Promise<SyncResult>}
         */
        async syncToBackend(stateHistory, _otherHistories) {
            return await sendHttpEach(stateHistory, ({type, arg}) =>
                type === 'insert'
                    ? doPostOrPut(http.post('/api/reusable-branches', arg, undefined, undefined, true))
                    : (window.console.error(`${type}:ng to backend not implemented yet`), Promise.resolve({level: null, httpStatus: null}))
            );
        }
    };
}

function createGlobalBlockTreesChannelHandler() {
    return {
        /**
         * @param {any} state
         * @param {StateChangeUserContext|null} userCtx
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
         * See also broadcastCurrentPageData() at ./main-column/WebPagePreviewApp.jsx
         *
         * @param {StateHistory} stateHistory
         * @param {Array<StateHistory>} _otherHistories
         * @returns {Promise<SyncResult>}
         */
        async syncToBackend(stateHistory, _otherHistories) {
            return await sendHttpEach(stateHistory, ({type, arg}) =>
                doPostOrPut(type === 'update'
                    ? http.put(`/api/global-block-trees/${arg.id}/blocks`, {blocks: arg.blocks}, undefined, true)
                    : http.post('/api/global-block-trees', arg, undefined, undefined, true))
            );
        }
    };
}

/**
 * @template T extends {id: string;}
 * @param {'globalBlockTrees'|'reusableBranches'} channelName 
 * @param {SaveButton} saveButton = api.saveButton.getInstance()
 * @returns {[Function, Function]}
 */
function registerSyncedItemsUpdater(channelName, saveButton = api.saveButton.getInstance()) {
    let latestItemsJustBeforeSave = [];
    return [
        saveButton.on('before-items-synced', () => {
            latestItemsJustBeforeSave = saveButton.getChannelState(channelName);
        }),
        saveButton.on('after-items-synced', (
            /** @type {boolean} */ hadStopError,
            /** @type {Array<ScopedSyncResult<{type: 'insert'|'update'; arg: WithId<T>;}[], WithId<T>>>} */ results
        ) => {
            if (!latestItemsJustBeforeSave?.length) // Empty $channelName state
                return;
            const syncResult = results.find(it => it.queueItem.channelName === channelName);
            if (!syncResult) // Op queue didn't contain $channelName items
                return;

            let markTheseItemsAsSynced = null;

            if (!hadStopError)
                markTheseItemsAsSynced = latestItemsJustBeforeSave;
            else {
                const succesfulHttpCalls = syncResult.result.data;
                markTheseItemsAsSynced = succesfulHttpCalls.map(({arg}) => arrayUtils.findById(latestItemsJustBeforeSave, arg.id));
            }

            if (markTheseItemsAsSynced?.length)
                saveButton.setSyncedState(channelName, mergeItems(
                    saveButton.getSyncedState(channelName),
                    markTheseItemsAsSynced,
                ));

            latestItemsJustBeforeSave = [];
        })
    ];
}

/**
 * @template T extends {id: string;}
 * @param {Array<WithId<T>>} mergeTo
 * @param {Array<WithId<T>>} additions
 * @returns {Array<WithId<T>>}
 */
function mergeItems(mergeTo, additions) {
    const out = [...mergeTo];
    const append = [];
    for (const item of additions) {
        const pos = out.findIndex(({id}) => id === item.id);
        if (pos < 0)
            append.push(item);
        else
            out[pos] = item;
    }
    return [...out, ...append];
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
         * @returns {Promise<SyncResult>}
         */
        async syncToBackend(stateHistory, _otherHistories) {
            const saveable = createSaveableItems(stateHistory);
            const results = await Promise.all(saveable.map(({arg}) =>
                http.post(`/api/pages/${arg.type}/upsert-quick`, arg)
            ));
            const wasSuccess = results.every(resp => resp?.ok === 'ok');
            return {wasSuccess, data: null};
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
         * @returns {Promise<SyncResult>}
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
         * @returns {Promise<SyncResult>}
         * @access private
         */
        syncAlreadyExistingPageToBackend(page, syncedPage) {
            const data = pageToTransferable(page, ['blocks', 'isPlaceholderPage']);

            // Add code that redirects to the new path after SaveButton has finished syncQueuedOpsToBackend()
            if (data.path !== syncedPage.path && !unregisterNavigateToNewSlugHandler) {
                const newPagePath = pathToFullSlug(data.path, '');
                unregisterNavigateToNewSlugHandler = api.saveButton.getInstance().on('after-items-synced', (hadStopError, _results) => {
                    if (!hadStopError)
                        env.window.myRoute(newPagePath);
                    unregisterNavigateToNewSlugHandler();
                    unregisterNavigateToNewSlugHandler = null;
                });
            }

            return doWrappedPostOrPut(
                http.put(`/api/pages/${data.type}/${data.id}`, data, undefined, true),
                (message, level, _err) => [
                    stringUtils.capitalize(`${__('page#genitive')} ${__('PageInfo')}`.toLowerCase()) + ': ' + message,
                    level
                ]
            );
        },
        /**
         * @param {Page} newPage
         * @returns {Promise<SyncResult>}
         * @access private
         */
        syncNewPageToBackend(newPage) {
            const postData = pageToTransferable(newPage);
            return doWrappedPostOrPut(
                http.post(`/api/pages/${postData.type}`, postData, undefined, undefined, true),
                (message, level, _err) => [
                    message.indexOf('Page with identical slug already exists') > -1
                        ? __('Page "%s" already exist', postData.slug)
                        : message,
                    level
                ]
            );
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
         * @returns {Promise<SyncResult>}
         */
        async syncToBackend(stateHistory, _otherHistories) {
            const saveable = createSaveableItems(stateHistory, 'name');
            const results = await Promise.all(saveable.map(({arg}) =>
                http.post('/api/page-types', arg)
            ));
            const wasSuccess = results.every(resp => resp?.ok === 'ok');
            return {wasSuccess, data: null};
        }
    };
}

/**
 * @param {Page & {[additionalProps: string]: any;}} page
 * @param {Array<keyof Page|string>} notTheseKeys = [] Example: ['id', 'blocks' ...]
 * @return {{[key: string]: any;}} Clean object
 */
function pageToTransferable(page, notTheseKeys = []) {
    const allKeys = Object.keys(page);
    const onlyTheseKeys = allKeys.filter(key =>
        !key.startsWith('__') && notTheseKeys.indexOf(key) < 0
    );
    return objectUtils.clonePartially(onlyTheseKeys, page);
}

/**
 * @param {Promise<Object|string>} httpCallPromise
 * @param {adjustErrorToastArgsFn} adjustErrorToastArgs = null
 * @returns {Promise<SyncResult>}
 */
async function doWrappedPostOrPut(httpCallPromise, adjustErrorToastArgs = null) {
    const info = await doPostOrPut(httpCallPromise, adjustErrorToastArgs);
    const {level, httpStatus} = info || {level: null, httpStatus: null};
    return {wasSuccess: level === null, causeHttpStatus: httpStatus, data: null};
}

/**
 * @param {Promise<Object|string>} httpCallPromise
 * @param {adjustErrorToastArgsFn} adjustErrorToastArgs = null
 * @returns {Promise<HttpCallResult|null>}
 */
async function doPostOrPut(httpCallPromise, adjustErrorToastArgs = null) {
    try {
        await httpCallPromise;
        return null;
    } catch (err) {
        window.console.error(err);

        let message1;
        let level1;
        let httpStatus = null;
        if (err?.cause instanceof Http.ErrorCauseClass) {
            const {response, error} = err.cause;
            if (response.status === 400 && Array.isArray(error)) {
                message1 = 'Error [' + JSON.stringify(error) + ']';
                level1 = 'error';
            } else if (response.status === 403) {
                message1 = 'You lack permissions to do this action';
                level1 = 'notice';
            }
            httpStatus = response.status;
        }
        if (!message1) {
            message1 = 'Something unexpected happened';
            level1 = 'error';
        }

        const [message, level] = !adjustErrorToastArgs
            ? [__(message1), level1]
            : adjustErrorToastArgs(message1, level1, err);

        toasters.editAppMain(message, level);

        return {level, httpStatus};
    }
}

/**
 * @template T
 * @param {StateHistory} stateHistory
 * @param {(saveable: Saveable<T>) => Promise<HttpCallResult|null>} sendRequest
 * @returns {Promise<SyncResult>}
 */
async function sendHttpEach(stateHistory, sendRequest) {
    const saveables = createSaveables(stateHistory);
    let i = 0;
    let stopInfo = null;
    for (i; i < saveables.length; ++i) {
        try {
            const info = await sendRequest(saveables[i]);
            if (info?.level === 'error') {
                stopInfo = info;
                break;
            }
        } catch (err) {
            break;
        }
    }
    const stoppedDueToError = i < saveables.length;
    // This object is passed to the saveButton.on('after-items-synced') event
    // (registered by registerSyncedItemsUpdater() below) by the SaveButton
    return {
        wasSuccess: !stoppedDueToError,
        causeHttpStatus: stopInfo?.httpStatus,
        data: saveables.slice(0, i - 1),
    };
}

/**
 * @template T
 * @param {StateHistory} stateHistory
 * @param {string} key = 'id'
 * @returns {Saveable<T>[]}
 */
function createSaveableItems({initial, latest}, key = 'id') {
    const out = [];
    for (const entity of latest) {
        const fromInitial = initial.find(ent => ent[key] === entity[key]);
        const isNew = !fromInitial;
        if (isNew)
            out.push({type: 'insert', arg: entity});
        else if (JSON.stringify(fromInitial) !== JSON.stringify(entity))
            out.push({type: 'update', arg: entity});
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
 * @template T extends {id: string;}
 * @param {StateHistory<Array<T & {id: string;}>>} stateHistory
 * @returns {Saveable<T>[]}
 */
function createSaveables({channelName, latest}) {
    const alreadyExisting = api.saveButton.getInstance().getSyncedState(channelName);
    const out = [];
    for (const entity of latest) {
        const fromInitial = arrayUtils.findById(alreadyExisting, entity.id);
        if (!fromInitial)
            out.push({type: 'insert', arg: entity});
        else if (JSON.stringify(fromInitial) !== JSON.stringify(entity))
            out.push({type: 'update', arg: entity});
    }
    return out;
}

/**
 * @param {Array<StateHistory>} queue
 * @returns {StateMap}
 */
function getLatestItemsOfEachChannel(queue) {
    /** @type {StateMap} */
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
function createEventName(channelName) {
    return `on-${channelName}-event`;
}

/**
 * @typedef {any} state
 */

/**
 * @typedef {{[channelName: string]: Array<state>;}} StateMap
 */

/**
 * @typedef {(message: string, level: toastMessageLevel, err: Error|Object) => [string, toastMessageLevel]} adjustErrorToastArgsFn
 */

/**
 * @typedef {{channelName: string; userCtx: any; flags: blockPropValueChangeFlags;}} HistoryItem
 */

/**
 * @template T
 * @typedef {{type: 'insert'|'update'|string; arg: T;}} Saveable
 */

/**
 * @typedef {{level: toastMessageLevel; httpStatus: number|null;}} HttpCallResult
 */

export {
    createEventName,
    getLatestItemsOfEachChannel,
    handlerFactoriesMap,
    mergeItems,
    normalizeItem,
    registerSyncedItemsUpdater
};
