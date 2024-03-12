import {
    __,
    http,
    objectUtils,
} from '../../sivujetti-commons-unified.js';
import {treeToTransferable} from '../commons/block/utils.js';
import toasters from '../includes/toasters.jsx';

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
        },
        /**
         * @param {StateHistory} stateHistory
         * @param {Array<StateHistory>} _otherHistories
         * @returns {Promise<Boolean|any>}
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
         * @returns {Promise<Boolean|any>}
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
         * @returns {Promise<Boolean|any>}
         */
        syncToBackend(stateHistory, _otherHistories) {
            const saveable = createSaveableItems(stateHistory);
            return Promise.all(saveable.map(({arg}) =>
                http.put(`/api/global-block-trees/${arg.id}/blocks`, {blocks: arg.blocks})
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


/**
 * @template T
 * @param {StateHistory} stateHistory
 * @returns {Array<{type: 'upsert'; arg: T;}>}
 */
function createSaveableItems({initial, latest}) {
    const out = [];
    for (const entity of latest) {
        const fromInitial = initial.find(({id}) => id === entity.id);
        if (!fromInitial || JSON.stringify(fromInitial) !== JSON.stringify(entity))
            out.push({type: 'upsert', arg: entity});
    }
    const includeDeletables = false;
    if (includeDeletables) {
    for (const compactPage of initial) {
        const fromLatest = latest.find(({id}) => id === compactPage.id);
        if (!fromLatest)
            out.push({type: 'delete', arg: compactPage.id});
    }
    }
    return out;
}

/**
 * @param {Array<Array<RawBlock>>} blockTreeStates
 * @returns {Array<RawBlock>}
 */
function getRefBlocksThatHasGbtChanges(blockTreeStates) {
    const map = new Map;
    for (const item of blockTreeStates) {
        for (const block of item) {
            if (block.type === 'GlobalBlockReference' && !map.has(block.globalBlockTreeId))
                map.set(block.globalBlockTreeId, block);
        }
    }
    return [...map.values()];
}

/**
 * Returns a patched $latestState that contains all changes from $refBlocksThatHasGbtChanges.
 *
 * @param {Array<RawGlobalBlockTree>} latestState
 * @param {Array<RawBlock>} refBlocksThatHasGbtChanges
 * @returns {Array<RawGlobalBlockTree>}
 */
function createGbtState(latestState, refBlocksThatHasGbtChanges) {
    const patchedLatestState = refBlocksThatHasGbtChanges.reduce((patchedLatestState, globalBlockReferenceBlock) =>
        // Return new [<someGbt>, <someGbt>, ...] -> [<someGbt>, <someGbtWithTheChange>, ...]
        patchedLatestState.map(gbt =>
            gbt.id !== globalBlockReferenceBlock.globalBlockTreeId
                ? gbt
                : {
                    ...gbt,
                    ...{blocks: treeToTransferable(globalBlockReferenceBlock.__globalBlockTree.blocks)}
                }
        )
    , [...latestState]);
    return objectUtils.cloneDeep(patchedLatestState);
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
    getRefBlocksThatHasGbtChanges,
    handlerFactoriesMap,
};
