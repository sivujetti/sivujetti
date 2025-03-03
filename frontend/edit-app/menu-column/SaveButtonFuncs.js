import {
    __,
    api,
    arrayUtils,
    env,
    http,
    objectUtils,
} from '@sivujetti-commons-for-edit-app';
import {treeToTransferable} from '../includes/block/utils.js';
import toasters from '../includes/toasters.jsx';
import {pathToFullSlug} from '../includes/utils.js';
import globalData from '../includes/globalData.js';

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
                [err?.cause instanceof Http.ErrorCauseClass && err.cause.response.status === 403 ? 'You lack permissions to edit this content.' : message, level]
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
            const saveable = createSaveableItems(stateHistory);
            const results = await Promise.all(saveable.map(({type, arg}) => type === 'insert'
                ? http.post('/api/reusable-branches', arg)
                : (window.console.error(`${type}:ng to backend not implemented yet`), {ok: 'ok'})
            ));
            const wasSuccess = results.every(resp => resp?.ok === 'ok');
            return {wasSuccess, data: null};
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
            const saveables = createGbtSaveables(stateHistory);
            let i = 0;
            for (i; i < saveables.length; ++i) {
                const {type, arg} = saveables[i];
                try {
                    const status = await doPostOrPut(type === 'update'
                        ? http.put(`/api/global-block-trees/${arg.id}/blocks`, {blocks: arg.blocks}, undefined, true)
                        : http.post('/api/global-block-trees', arg, undefined, undefined, true))
                    if (status === 'error') break;
                } catch (err) {
                    break;
                }
            }
            const stoppedDueToError = i < saveables.length;
            // This object is passed to the saveButton.on('after-items-synced') event
            // (registered by registerUpdateSyncedGbtsPatchers() below) by the SaveButton
            return {wasSuccess: !stoppedDueToError, data: saveables.slice(0, i - 1)};
        }
    };
}

/**
 * @param {SaveButton} saveButton = api.saveButton.getInstance()
 * @returns {[Function, Function]}
 */
function registerUpdateSyncedGbtsPatchers(saveButton = api.saveButton.getInstance()) {
    /** @type {Array<GlobalBlockTree>} */
    let latestGbtsJustBeforeSave = [];
    return [
        saveButton.on('before-items-synced', () => {
            latestGbtsJustBeforeSave = saveButton.getChannelState('globalBlockTrees');
        }),
        saveButton.on('after-items-synced', (
            /** @type {boolean} */ hadStopError,
            /** @type {Array<ScopedSyncResult<{type: 'insert'|'update'; arg: GlobalBlockTree;}[], GlobalBlockTree>>} */ results
        ) => {
            if (!latestGbtsJustBeforeSave.length) // Page didn't contain 'GlobalBlockReference' blocks
                return;
            const syncResult = results.find(it => it.queueItem.channelName === 'globalBlockTrees');
            if (!syncResult) // Op queue didn't contain 'globalBlockTrees' items
                return;

            let gbtsMarkedAsSynced = null;

            if (!hadStopError)
                gbtsMarkedAsSynced = latestGbtsJustBeforeSave;
            else {
                const succesfulHttpCalls = syncResult.result.data; 
                gbtsMarkedAsSynced = succesfulHttpCalls.map(({arg}) => latestGbtsJustBeforeSave.find(({id}) => id === arg.id));
            }

            if (gbtsMarkedAsSynced?.length)
                saveButton.setSyncedState('globalBlockTrees', mergeGlobalBlockTrees(
                    saveButton.getSyncedState('globalBlockTrees'),
                    gbtsMarkedAsSynced,
                ));

            latestGbtsJustBeforeSave = [];
        })
    ];
}

/**
 * @param {Array<GlobalBlockTree>} mergeTo
 * @param {Array<GlobalBlockTree>} additions
 * @returns {Array<GlobalBlockTree>}
 */
function mergeGlobalBlockTrees(mergeTo, additions) {
    const out = [...mergeTo];
    const append = [];
    for (const gbt of additions) {
        const pos = out.findIndex(({id}) => id === gbt.id);
        if (pos < 0)
            append.push(gbt);
        else
            out[pos] = gbt;
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
            throw new Error('todo');
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
                unregisterNavigateToNewSlugHandler = api.saveButton.getInstance().onAfterItemsSynced(() => {
                    env.window.myRoute(newPagePath);
                    unregisterNavigateToNewSlugHandler();
                    unregisterNavigateToNewSlugHandler = null;
                });
            }

            return doWrappedPostOrPut(
                http.put(`/api/pages/${data.type}/${data.id}`, data)
            );
        },
        /**
         * @param {Page} newPage
         * @returns {Promise<SyncResult>}
         * @access private
         */
        syncNewPageToBackend(newPage) {
            const postData = pageToTransferable(newPage);
            //
            throw new Error('todo');
            return http.post(`/api/pages/${postData.type}`, postData)
                .then(resp => {
                    if (Array.isArray(resp) && resp[0] === 'Page with identical slug already exists') {
                        toasters.editAppMain(__('Page "%s" already exist', postData.slug), 'error');
                        return false;
                    }
                    if (resp.ok !== 'ok') throw new Error('-');
                    return true;
                })
                .catch(err => createAndLogError(err, null));
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
 * @param {string|Error} err
 * @param {adjustErrorToastArgsFn|null} adjustErrorToastArgs
 * @returns {ToastMessageSettings|null}
 */
function createAndLogError(err, adjustErrorToastArgs) {
    window.console.error(err);

    let message1;
    let level1;
    if (err?.cause instanceof Http.ErrorCauseClass) {
        const {response, error} = err.cause;
        if (response.status === 400 && Array.isArray(error)) {
            message1 = 'Error [' + JSON.stringify(error) + ']';
            level1 = 'error';
        } else if (response.status === 403) {
            message1 = 'You lack permissions to do this action';
            level1 = 'notice';
        }
    }
    if (!message1) {
        message1 = 'Something unexpected happened';
        level1 = 'error';
    }

    const [message, level] = !adjustErrorToastArgs
        ? [message1, level1]
        : adjustErrorToastArgs(message1, level1, err);

    toasters.editAppMain(__(message), level);

    return [level, message];
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
    const level = await doPostOrPut(httpCallPromise, adjustErrorToastArgs);
    return {wasSuccess: level === null, data: null};
}

/**
 * @param {Promise<Object|string>} httpCallPromise
 * @param {adjustErrorToastArgsFn} adjustErrorToastArgs = null
 * @returns {Promise<toastMessageLevel|null>}
 */
async function doPostOrPut(httpCallPromise, adjustErrorToastArgs = null) {
    try {
        await httpCallPromise;
        return null;
    } catch (err) {
        return createAndLogError(err, adjustErrorToastArgs)[0];
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
 * @param {StateHistory} stateHistory
 * @returns {Array<{type: 'insert'|'update'; arg: GlobalBlockTree;}>}
 */
function createGbtSaveables({latest}) {
    const alreadyExisting = api.saveButton.getInstance().getSyncedState('globalBlockTrees');
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
 *
 * @typedef {{[channelName: string]: Array<state>;}} StateMap
 *
 * @typedef {(message: string, level: toastMessageLevel, err: Error|Object) => [string, toastMessageLevel]} adjustErrorToastArgsFn
 *
 * @typedef HistoryItem
 * @prop {string} channelName
 * @prop {any} userCtx
 * @prop {blockPropValueChangeFlags} flags
 */

export {
    createEventName,
    getLatestItemsOfEachChannel,
    handlerFactoriesMap,
    mergeGlobalBlockTrees,
    normalizeItem,
    registerUpdateSyncedGbtsPatchers,
};
