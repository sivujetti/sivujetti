import {__, api, env, Events, objectUtils} from '@sivujetti-commons-for-edit-app';
import {getMetaKey} from '../../shared-inline.js';
import {historyInstance, isMainColumnViewUrl} from '../main-column/MainColumnViews.jsx';
import {
    createEventName,
    getLatestItemsOfEachChannel,
    handlerFactoriesMap,
    normalizeItem,
} from './SaveButtonFuncs.js';
/** @typedef {import('./SaveButtonFuncs.js').HistoryItem} HistoryItem */

const saveButtonEvents = new Events;
const saveButtonEvents2 = new Events;

class SaveButton {
    /** @type {undefined} */
    static DEFERRED = undefined;
    /**
     */
    constructor() {
        this.doInvalidateAll();
        this.addUndoKeyListener();
        this.hotkeyUndoLockIsOn = false;
    }
    /**
     * @param {string} name
     * @param {(state: sbState, userCtx: StateChangeUserContext, context: stateChangeContext) => any} fn
     * @returns {Function}
     * @access public
     */
    subscribeToChannel(name, fn) {
        if (!handlerFactoriesMap[name]) {
            env.window.console.warn(`Unknown channel "${name}". Known: ${Object.keys(handlerFactoriesMap).join(', ')}`);
            return () => {};
        }
        return saveButtonEvents.on(createEventName(name), fn);
    }
    /**
     * @param {string} name
     * @param {sbState|undefined} syncedState
     * @param {boolean} broadcastInitialStateToListeners = false
     * @access public
     */
    initChannel(name, syncedState, broadcastInitialStateToListeners = false) {
        const createHandler = handlerFactoriesMap[name];
        if (createHandler) {
            if (!this.channelImpls[name]) {
                const handler = createHandler();
                this.channelImpls[name] = handler;
            }
            this.clearStateOf(name, syncedState);
            if (broadcastInitialStateToListeners)
                saveButtonEvents.emit(createEventName(name), syncedState, null, 'initial');
        } else throw new Error(`Unknown channel name: ${name}`);
    }
    /**
     * @template T
     * @param {boolean} includeSynced = true
     * @returns {T|null}
     * @access public
     */
    getChannelState(channelName, includeSynced = true) {
        return this.getHead(channelName, includeSynced);
    }
    /**
     * @param {string} channelName
     * @param {sbState} state
     * @param {StateChangeUserContext} userCtx = null
     * @param {blockPropValueChangeFlags} flags = null
     * @access public
     */
    pushOp(channelName, state, userCtx = null, flags = null) {
        const stateCursor = this.stateCursors[channelName];
        const stateArr = this.states[channelName];
        //      cursor
        //        \/
        // ['a', 'b', 'undone1', 'undone2', ...] -> ['a', 'b']
        if (stateArr.length - 1 > stateCursor)
            stateArr.splice(stateCursor);

        this.stateCursors[channelName] = stateArr.push(state);
        this.emitStateChange(channelName, state, userCtx, 'push');

        // rewrite/pack [<maybeUnrelated>, <firstThrottled>, ..., <lastThrottled>] -> [<maybeUnrelated>, <lastThrottled>]
        const isNormalPush = !flags;
        // @ts-ignore allow [].flags -> undefined
        const prevPushIsThrottled = this.opHistoryCursor > 0 && this.opHistory[this.opHistoryCursor - 1].flags === 'is-throttled';
        const isThrottlePushTerminator = isNormalPush && prevPushIsThrottled;
        if (isThrottlePushTerminator) {
            // @ts-ignore allow [].channelName -> undefined (throttled items are always single push 'theBlockTree' states
            const firstI = this.opHistory.findIndex(it => it.channelName === channelName && it.flags === 'is-throttled');
            const lenBef = this.opHistoryCursor;
            this.opHistory = [
                ...this.opHistory.slice(0, firstI),
                {channelName, userCtx, flags}
            ];
            this.opHistoryCursor = this.opHistory.length;

            const delta = lenBef - this.opHistoryCursor + 2;
            this.states[channelName] = [
                ...this.states[channelName].slice(0, this.stateCursors[channelName] - delta),
                this.states[channelName].at(-1),
            ];
            this.stateCursors[channelName] = this.states[channelName].length;
        } else if (flags !== 'is-group') {
            this.pushHistoryItem({channelName, userCtx, flags});
        }
    }
    /**
     * Pushes multiple ops to the history that will be undone/redone as a group when undo/redo is called.
     *
     * @param {Array<[string, sbState, StateChangeUserContext|null, blockPropValueChangeFlags]>} ops
     * @access public
     */
    pushOpGroup(...ops) {
        const group = ops.map(args => {
            this.pushOp(args[0], args[1], args[2], 'is-group');
            return {channelName: args[0], userCtx: args[2], flags: args[3] || null};
        });
        this.pushHistoryItem(group);
    }
    /**
     * @template T
     * @param {string} channelName
     * @param {T} data
     * @access public
     */
    setSyncedState(channelName, data) {
        if (!Object.hasOwn(this.syncedStates, channelName))
            throw new Error(`Unknown channel "${channelName}"`); 
        this.syncedStates[channelName] = data;
    }
    /**
     * @template T
     * @param {string} channelName
     * @returns {T}
     * @access public
     */
    getSyncedState(channelName) {
        if (!Object.hasOwn(this.syncedStates, channelName))
            throw new Error(`Unknown channel "${channelName}"`); 
        return this.syncedStates[channelName];
    }
    /**
     * @param {'before-items-synced'|'after-items-synced'|string} when
     * @param {(...any) => void} thenDo
     * @returns {Function} Unregister
     * @access public
     */
    on(when, thenDo) {
        return saveButtonEvents2.on(when, thenDo);
    }
    /**
     * @access public
     */
    invalidateAll() {
        this.unregisterAndClearUnsavedChagesAlertIfSet();
        this.doInvalidateAll();
        this.renderer.resetState();
        this.syncQueueFilters = [];
    }
    /**
     * @param {boolean} isOn
     * @access public
     */
    setHotkeyUndoLockIsOn(isOn) {
        this.hotkeyUndoLockIsOn = isOn;
    }
    /**
     * @template T
     * @param {(queue: Array<StateHistory<T>>, activeState: StateMap) => Promise<Array<StateHistory<T>>|null>} fn
     * @param {boolean} toEnd
     * @returns {() => void} Unregister
     * @access public
     */
    registerSyncQueueFilter(fn, toEnd = true) {
        if (toEnd) this.syncQueueFilters.push(fn);
        else this.syncQueueFilters.unshift(fn);
        return () => {
            this.syncQueueFilters = this.syncQueueFilters.filter(fn2 => fn2 !== fn);
        };
    }
    /**
     * @param {string} channelName
     * @param {(channelState: Array<sbState>) => Array<sbState>} createNewState
     * @access public
     */
    replaceStateOf(channelName, createNewState) {
        this.states[channelName] = createNewState([...this.states[channelName]]);
    }
    /**
     * @access public
     */
    doUndo() {
        if (!this.canUndo()) return;
        this.opHistoryCursor -= 1;
        const head = this.opHistory[this.opHistoryCursor];
        for (const {channelName, userCtx} of normalizeItem(head)) {
            this.stateCursors[channelName] -= 1;
            const state = this.getHead(channelName, true);
            this.emitStateChange(channelName, state, userCtx, 'undo');
        }
        this.renderer.setState(this.createCanUndoAndRedo());
    }
    /**
     * @access public
     */
    doRedo() {
        if (!this.canRedo()) return;
        const head = this.opHistory[this.opHistoryCursor];
        this.opHistoryCursor += 1;
        for (const {channelName, userCtx} of normalizeItem(head)) {
            const state = this.states[channelName][this.stateCursors[channelName]];
            this.stateCursors[channelName] += 1;
            this.emitStateChange(channelName, state, userCtx, 'redo');
        }
        this.renderer.setState(this.createCanUndoAndRedo());
    }
    /**
     * @access public
     */
    async syncQueuedOpsToBackend() {
        saveButtonEvents2.emit('before-items-synced');
        this.renderer.setState({isSubmitting: true});

        const syncQueue = await this.createSynctobackendQueue();

        const results = [];
        for (const item of syncQueue) {
            const handler = this.channelImpls[item.channelName];
            const result = await handler.syncToBackend(item, syncQueue);
            results.push({result, queueItem: item});
            // If handler returns false -> stop processing. If it returns any other value
            // (undefined, true, etc.) -> interpret this as a success and continue
            const isStopSignal = result.wasSuccess === false;
            if (isStopSignal) {
                this.partiallyReset(syncQueue, item, result.causeHttpStatus);
                saveButtonEvents2.emit('after-items-synced', true, results);
                return;
            }
        }

        this.unregisterAndClearUnsavedChagesAlertIfSet();
        if (this.lastAttemptHistory.length)
            api.toasters.editAppMain(__('Changes saved'), 'success');
        this.reset(getLatestItemsOfEachChannel(syncQueue));
        saveButtonEvents2.emit('after-items-synced', false, results);
    }
    /**
     * @access public
     */
    getInstance() {
        return this;
    }
    /**
     * @param {preact.Component & {resetState(keepButtonVisible?: boolean): void;}} renderer
     * @access public
     */
    linkRenderer(renderer) {
        this.renderer = renderer;
        this.syncQueueFilters = [];
    }
    /**
     * @param {HistoryItem|Array<HistoryItem>} item
     * @access private
     */
    pushHistoryItem(item) {
        //      cursor
        //        \/
        // ['a', 'b', 'undone1', 'undone2', ...] -> ['a', 'b']
        if (this.opHistory.length - 1 > this.opHistoryCursor)
            this.opHistory.splice(this.opHistoryCursor);
        this.opHistoryCursor = this.opHistory.push(item);
        this.renderer.setState({isVisible: true, canUndo: true, canRedo: false});
        if (!this.unregisterUnsavedChangesAlert) {
            // #1 Register a function that will prompt the user for confirmation during the next navigation
            const unregisterBlocker = historyInstance.block(__('You have unsaved changes, do you want to navigate away?'));
            // #2 Register a function that calls this.reset() if the user accepted the confirmation from #1
            const unregisterClearer = historyInstance.listen(({pathname}) => {
                if (isMainColumnViewUrl(pathname) && !historyInstance.doRevertNextHashChange) {
                    const queue = this.createSyncQueuePre()[0];
                    const initialStates = queue.reduce((out, {channelName}) => ({...out, [channelName]: null}), {});
                    this.reset(initialStates, true);
                    this.unregisterAndClearUnsavedChagesAlertIfSet();
                }
            });
            this.unregisterUnsavedChangesAlert = () => {
                unregisterBlocker();
                unregisterClearer();
            };
        }
    }
    /**
     * @param {string} channelName
     * @param {sbState} state
     * @param {StateChangeUserContext|null} userCtx
     * @param {stateChangeContext} context
     * @access private
     */
    emitStateChange(channelName, state, userCtx, context) {
        const handler = this.channelImpls[channelName];
        handler.handleStateChange(state, userCtx, context);
        saveButtonEvents.emit(createEventName(channelName), state, userCtx, context);
    }
    /**
     * @template T
     * @returns {sbState|T|null}
     * @access private
     */
    getHead(channelName, includeSynced = false) {
        const c = this.stateCursors[channelName];
        if (c > 0)
            return this.states[channelName][c - 1];
        return includeSynced
            ? this.syncedStates[channelName]
            : null;
    }
    /**
     * @param {string} channelName
     * @param {number} start = 1
     * @returns {Array<sbState>}
     * @access private
     */
    getActiveState(channelName, start = 0) {
        const pool = this.states[channelName];
        // []                    -> []                    (if cursor = 0)
        // ['1st', '2nd', '3rd'] -> ['1st', '2nd', '3rd'] (if cursor = 3 / at the end)
        // ['1st', '2nd', '3rd'] -> ['1st', '2nd']        (if cursor = 2)
        // ['1st', '2nd', '3rd'] -> ['1st']               (if cursor = 1)
        const fromFirstToCursor = pool.slice(start, this.stateCursors[channelName]);
        return fromFirstToCursor;
    }
    /**
     * @returns {Promise<Array<StateHistory>>}
     * @access private
     */
    async createSynctobackendQueue() {
        let [out, activeStates] = this.createSyncQueuePre();
        //
        for (const fn of this.syncQueueFilters) {
            const resolved = await fn(out, activeStates);
            if (resolved) out = resolved;
        }
        //
        return Promise.resolve(out);
    }
    /**
     * @returns {[Array<StateHistory>, StateMap]}
     * @access private
     */
    createSyncQueuePre() {
        const channelNamesOrdered = this.getNonSyncedChannelNames();
        /** @type {StateMap} */
        const activeStates = {};
        const out = channelNamesOrdered.map(channelName => {
            const fromFirstToCursor = this.getActiveState(channelName);
            activeStates[channelName] = fromFirstToCursor;
            return {
                channelName,
                initial: this.syncedStates[channelName],
                first: fromFirstToCursor[0],
                latest: fromFirstToCursor.at(-1)
            };
        });
        return [out, activeStates];
    }
    /**
     * @param {StateMap} latesStates The states that were just saved to the backend
     * @param {boolean} emitChange = false
     * @access private
     */
    reset(latesStates, emitChange = false) {
        this.opHistory = [];
        this.lastAttemptHistory = [];
        this.opHistoryCursor = 0;

        for (const channelName in this.states) {
            const newSyncedState = Object.hasOwn(latesStates, channelName)
                ? latesStates[channelName]
                : this.getHead(channelName);
            this.clearStateOf(channelName, newSyncedState);
            if (emitChange) {
                const revertState = this.getHead(channelName, true);
                this.emitStateChange(channelName, revertState, {}, 'undo');
            }
        }

        this.renderer.resetState();
    }
    /**
     * @param {Array<StateHistory>} syncQueue
     * @param {StateHistory} stopItem
     * @param {number} causeHttpStatus
     */
    partiallyReset(syncQueue, stopItem, causeHttpStatus) {
        const pos = syncQueue.indexOf(stopItem);
        const before = syncQueue.slice(0, pos);
        const stopItemAndAfter = syncQueue.slice(pos);
        const latestStates = getLatestItemsOfEachChannel(syncQueue);

        // before -> update syncedState and clear state
        for (const {channelName} of before) {
            const latestState = latestStates[channelName];
            this.clearStateOf(channelName, latestState);
        }

        // stopItem + after -> keep syncedState and set `state = [latestItem]`
        for (const {channelName} of stopItemAndAfter) {
            const latestState = latestStates[channelName];
            this.states[channelName] = [latestState];
            this.stateCursors[channelName] = 1;
        }
        // Don't preserve 'reusableBranches' state if httpStatus was 400 (since it won't pass on the next attempt either)
        const stopWasDueToInvalidReusable = stopItemAndAfter[0].channelName === 'reusableBranches' && causeHttpStatus === 400;
        if (stopWasDueToInvalidReusable)
            this.clearStateOf('reusableBranches', null);

        // Add a history item for the stop item
        const firstStopItemChannelHistoryItem = this.opHistory.find(it => normalizeItem(it).some(({channelName}) => channelName === stopItem.channelName));
        const pos2 = this.opHistory.indexOf(firstStopItemChannelHistoryItem);
        this.lastAttemptHistory = !stopWasDueToInvalidReusable
            ? this.opHistory.slice(pos2)      // [stopItem, ...afterStopitem]
            : this.opHistory.slice(pos2 + 1); // [...afterStopitem]
        this.opHistory = [];
        this.opHistoryCursor = !stopWasDueToInvalidReusable
            ? this.opHistory.push(firstStopItemChannelHistoryItem)
            : 0;

        this.renderer.resetState(this.opHistoryCursor > 0);
    }
    /**
     * @param {string} channelName
     * @param {sbState|null} newSyncedState
     * @access private
     */
    clearStateOf(channelName, newSyncedState) {
        if (newSyncedState)
            this.syncedStates[channelName] = newSyncedState;
        this.states[channelName] = [];
        this.stateCursors[channelName] = 0;
    }
    /**
     * @returns {Array<string>}
     * @access private
     */
    getNonSyncedChannelNames() {
        const map = new Map;
        for (const item of [...this.lastAttemptHistory, ...this.opHistory]) {
            for (const {channelName} of normalizeItem(item)) {
                map.set(channelName, 1);
            }
        }
        return [...map.keys()];
    }
    /**
     * @access private
     */
    addUndoKeyListener() {
        const metaKey = getMetaKey();
        const undoKey = 'z';
        let metaKeyIsPressed = false;
        let shiftKeyIsPressed = false;
        env.window.addEventListener('keydown', e => {
            if (e.key === metaKey) {
                metaKeyIsPressed = true;
            } else if (e.key === 'Shift') {
                shiftKeyIsPressed = true;
            } else if (metaKeyIsPressed && e.key === undoKey) {
                if (shiftKeyIsPressed && this.renderer?.state.canRedo && !this.hotkeyUndoLockIsOn) {
                    e.preventDefault(); // Prevent active input's onInput
                    this.doRedo();
                } else if (!shiftKeyIsPressed && this.renderer?.state.canUndo && !this.hotkeyUndoLockIsOn) {
                    e.preventDefault(); // Prevent active input's onInput
                    this.doUndo();
                }
            }
        });
        env.window.addEventListener('keyup', e => {
            if (e.key === metaKey)
                metaKeyIsPressed = false;
            else if (e.key === 'Shift')
                shiftKeyIsPressed = false;
        });
    }
    /**
     * @access private
     */
    unregisterAndClearUnsavedChagesAlertIfSet() {
        if (this.unregisterUnsavedChangesAlert) {
            this.unregisterUnsavedChangesAlert();
            this.unregisterUnsavedChangesAlert = null;
        }
    }
    /**
     * @access private
     */
    createCanUndoAndRedo() {
        return {
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
        };
    }
    /**
     * @returns {boolean}
     * @access private
     */
    canUndo() {
        return this.opHistoryCursor > 0;
    }
    /**
     * @returns {boolean}
     * @access private
     */
    canRedo() {
        // []     0 -> false
        // [1]    1 -> false
        // [1, 2] 2 -> false
        // [1, 2] 1 -> true
        // [1, 2] 0 -> true
        return this.opHistoryCursor < this.opHistory.length;
    }
    /**
     * @access private
     */
    doInvalidateAll() {
        /** @type {{[name: string]: Array<sbState>;}} */
        this.states = {};
        /** @type {{[name: string]: Object;}} */
        this.syncedStates = {};
        /** @type {{[name: string]: number;}} */
        this.stateCursors = {};
        /** @type {{[name: string]: SaveButtonChannelHandler;}} */
        this.channelImpls = {};
        /** @type {Array<HistoryItem|Array<HistoryItem>>} */
        this.opHistory = [];
        /** @type {Array<HistoryItem|Array<HistoryItem>>} */
        this.lastAttemptHistory = [];
        this.opHistoryCursor = 0;
    }
}

export default SaveButton;
