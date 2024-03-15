import {
    __,
    api,
    blockTreeUtils,
    env,
    http,
    objectUtils,
} from '../../sivujetti-commons-unified.js';
import {treeToTransferable} from '../includes/block/utils.js';
import toasters from '../includes/toasters.jsx';
import {pathToFullSlug} from '../includes/utils.js';

const handlerFactoriesMap = {
    currentPageDataBundle: createCurrentPageDataBundleChannelHandler,
    globalBlockTrees: createGlobalBlockTreesChannelHandler,
    quicklyAddedPages: createQuicklyAddedPagesChannelHandler,
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
         * @returns {Promise<Boolean|any>}
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
            if (userCtx?.event === 'update-single-block-prop') {
                if (!userCtx?.isDefPropOnly)
                    api.webPagePreview.reRenderBlock(blockTreeUtils.findBlockSmart(userCtx.blockId, state)[0], state);
            } else
                api.webPagePreview.reRenderAllBlocks(state);
        },
        /**
         * @param {StateHistory} stateHistory
         * @param {Array<StateHistory>} _otherHistories
         * @returns {Promise<Boolean|any>}
         */
        syncToBackend(stateHistory, _otherHistories) {
            const {page} = api.saveButton.getInstance().getChannelState('currentPageDataBundle');
            const blocks = treeToTransferable(stateHistory.latest);
            return doPostOrPut(http.put(
                `/api/pages/${page.type}/${page.id}/blocks`,
                {blocks}
            ));
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
         * @returns {Promise<Boolean|any>}
         */
        syncToBackend(stateHistory, _otherHistories) {
            const saveable = createSaveableItems(stateHistory);
            return Promise.all(saveable.map(({type, arg}) =>
                type === 'insert'
                    ? http.post('/api/reusable-branches', arg)
                    : (window.console.error(`${type}:ng to backend not implemented yet`), {ok: 'ok'})
            )).then(results =>
                results.every(resp => resp?.ok === 'ok')
            );
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
         * @returns {Promise<Boolean|any>}
         */
        syncToBackend(stateHistory, _otherHistories) {
            const saveable = createSaveableItems(stateHistory);
            return Promise.all(saveable.map(({type, arg}) =>
                type === 'update'
                    ? http.put(`/api/global-block-trees/${arg.id}/blocks`, {blocks: arg.blocks})
                    : http.post(`/api/global-block-trees`, arg)
            )).then(results =>
                results.every(resp => resp?.ok === 'ok')
            );
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
         * @returns {Promise<Boolean|any>}
         */
        syncToBackend(stateHistory, _otherHistories) {
            const saveable = createSaveableItems(stateHistory);
            return Promise.all(saveable.map(({arg}) =>
                http.post(`/api/pages/${arg.type}/upsert-quick`, arg)
            )).then(results =>
                results.every(resp => resp?.ok === 'ok')
            );
        }
    };
}

function createCurrentPageDataBundleChannelHandler() {
    let unregisterNavigateToNewSlugHandler;
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
         * @returns {Promise<Boolean|any>}
         */
        syncToBackend(stateHistory, _otherHistories) { 
            if (!stateHistory.latest.page.isPlaceholderPage) {
                return this.syncAlreadyExistingPageToBackend(
                    stateHistory.latest.page,
                    stateHistory.initial.page,
                );
            }
            return this.syncNewPageToBackend(stateHistory.latest.page);
        },
        /**
         * @param {Page} page
         * @param {Page} syncedPage
         * @returns {Promise<Boolean|any>}
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
         * @returns {Promise<Boolean|any>}
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

/**
 * @param {Promise<>} httpCall
 * @returns {Promise<Boolean>}
 */
function doPostOrPut(httpCall) {
    return httpCall
        .then(resp => {
            if (resp.ok !== 'ok') throw new Error(typeof resp.err !== 'string' ? '-' : resp.err);
            return true;
        })
        .catch(err => {
            if (err.message !== 'Not permitted.') {
                window.console.error(err);
                toasters.editAppMain(__('Something unexpected happened.'), 'error');
            } else {
                toasters.editAppMain(__('You lack permissions to edit this content.'), 'error');
            }
            return false;
        });
}

/**
 * @template T
 * @param {StateHistory} stateHistory
 * @returns {Array<{type: 'upsert'; arg: T;}>}
 */
function createSaveableItems({initial, latest}) {
    const out = [];
    for (const entity of latest) {
        const fromInitial = initial.find(({id}) => id === entity.id);
        const isNew = !fromInitial;
        if (isNew)
            out.push({type: 'insert', arg: entity});
        else if (JSON.stringify(fromInitial) !== JSON.stringify(entity))
            out.push({type: 'update', arg: entity, isNew});
    }
    const includeDeletables = false;
    if (includeDeletables) {
    for (const entity of initial) {
        const fromLatest = latest.find(({id}) => id === entity.id);
        if (!fromLatest)
            out.push({type: 'delete', arg: entity.id});
    }
    }
    return out;
}

/**
 * @param {Array<Array<RawBlock>>} blockTreeStates
 * @returns {Array<RawBlock>}
 */
function getGbtRefBlocksFrom(blockTreeStates) {
    const map = new Map;
    for (const item of blockTreeStates) {
        for (const block of item) {
            if (block.type === 'GlobalBlockReference')
                // Set or override previous, so map has always the latest change
                map.set(block.globalBlockTreeId, block);
        }
    }
    return [...map.values()];
}

/**
 * Returns a patched $initialState that contains changes from $refBlocksThatMaybeHaveChanges.
 *
 * @param {Array<RawGlobalBlockTree>} initialState
 * @param {Array<RawBlock>} refBlocksThatMaybeHaveChanges
 * @returns {Array<RawGlobalBlockTree>|null}
 */
function createGbtState(stateArr, refBlocksThatMaybeHaveChanges) {
    const patchInfo = stateArr.map(_ => ({status: 'no-changes', newBlocks: null}));
    for (const block of refBlocksThatMaybeHaveChanges) {
        const fromStateArrIdx = stateArr.findIndex(gbt => gbt.id === block.globalBlockTreeId);
        const fromBlockTree = treeToTransferable(block.__globalBlockTree.blocks);
        if (JSON.stringify(stateArr[fromStateArrIdx].blocks) !== JSON.stringify(fromBlockTree))
            patchInfo[fromStateArrIdx] = {status: 'has-changes', newBlocks: fromBlockTree};
    }
    if (patchInfo.findIndex(p => p.status === 'has-changes') < 0) {
        return null;
    }
    return stateArr.map((gbt, i) => {
        const pInfo = patchInfo[i];
        return pInfo.status === 'no-changes' ? gbt : {...gbt, ...{blocks: pInfo.newBlocks}};
    });
}

/**
 * @param {Array<StateHistory>} queue
 * @returns {{[channelName: String]: state;}}
 */
function getLatestItemsOfEachChannel(queue) {
    const out = {};
    for (const item of queue) {
        if (!item.latest) continue;
        out[item.channelName] = item.latest;
    }
    return out;
}

export {
    createGbtState,
    getLatestItemsOfEachChannel,
    getGbtRefBlocksFrom,
    handlerFactoriesMap,
};