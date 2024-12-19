import {__, env, Events} from '@sivujetti-commons-for-edit-app';
import {getMetaKey} from '../../shared-inline.js';
import {historyInstance, isMainColumnViewUrl} from '../main-column/MainColumnViews.jsx';
import {
    createEventName,
    getLatestItemsOfEachChannel,
    handlerFactoriesMap,
    normalizeItem,
} from './SaveButtonFuncs.js';

const saveButtonEvents = new Events;
const saveButtonEvents2 = new Events;

class SaveButton {
    // states;
    // stateCursors;
    // channelImpls;
    // opHistory;
    // opHistoryCursor;
    // syncQueueFilters;
    // hotkeyUndoLockIsOn;
    // renderer;
    // unregisterUnsavedChangesAlert;
    /**
     */
    constructor() {
        this.doInvalidateAll();
        this.addUndoKeyListener();
        this.hotkeyUndoLockIsOn = false;
    }
    /**
     * @param {string} name
     * @param {(state: state, userCtx: StateChangeUserContext, context: stateChangeContext) => any} fn
     * @access public
     */
    subscribeToChannel(name, fn) {
        if (!handlerFactoriesMap[name]) {
            env.window.console.warn(`Unknown channel "${name}". Known: ${Object.keys(handlerFactoriesMap).join(', ')}`);
            return;
        }
        return saveButtonEvents.on(createEventName(name), fn);
    }
    /**
     * @param {string} name
     * @param {state} state
     * @param {boolean} broadcastInitialStateToListeners = false
     * @access public
     */
    initChannel(name, state, broadcastInitialStateToListeners = false) {
        const createHandler = handlerFactoriesMap[name];
        if (createHandler) {
            const handler = createHandler();
            this.channelImpls[name] = handler;

            this.clearStateOf(name, state);

            if (broadcastInitialStateToListeners)
                saveButtonEvents.emit(createEventName(name), state, null, 'initial');
        } else throw new Error(`Unknown channel name: ${name}`);
    }
    /**
     * @template T
     * @returns {T|null}
     * @access public
     */
    getChannelState(channelName) {
        return this.getHead(channelName);
    }
    /**
     * @param {string} channelName
     * @param {state} state
     * @param {StateChangeUserContext|null} userCtx = null
     * @param {blockPropValueChangeFlags} flags = null
     * @access public
     */
    pushOp(channelName, state, userCtx = null, flags = null) {
        const stateCursor = this.stateCursors[channelName];
        const stateArr = this.states[channelName];
        if (stateCursor < stateArr.length - 1)
            stateArr.splice(stateCursor + 1);

        this.stateCursors[channelName] = stateArr.push(state) - 1;
        this.emitStateChange(channelName, state, userCtx, 'push');

        const isNormalPush = !flags;
        if (isNormalPush || flags === 'is-throttled') {
            if (isNormalPush) {
                const latest = this.opHistory[this.opHistoryCursor - 1];
                const doMergeThrottled = latest?.flags === 'is-throttled';
                // rewrite/pack [<maybeUnrelated>, <firstThrottled>, ..., <lastThrottled>] -> [<maybeUnrelated>, <lastThrottled>]
                if (doMergeThrottled) {
                    const firstI = this.opHistory.findIndex(it => it.channelName === channelName && it.flags === 'is-throttled');
                    const delCount = this.opHistoryCursor - firstI;
                    this.opHistory = [...this.opHistory.slice(0, firstI)];
                    this.opHistoryCursor = this.opHistory.length;
                    this.states[channelName] = [
                        ...this.states[channelName].slice(0, this.stateCursors[channelName] - delCount),
                        this.states[channelName].at(-1),
                    ];
                    this.stateCursors[channelName] = this.states[channelName].length - 1;
                }
            }
            this.pushHistoryItem({channelName, userCtx, flags});
        }
    }
    /**
     * Pushes multiple ops to the history that will be undone/redone as a group when undo/redo is called.
     *
     * @param {[string, state, StateChangeUserContext|null, blockPropValueChangeFlags]} ...ops
     * @access public
     */
    pushOpGroup(...ops) {
        const group = ops.map(args => {
            this.pushOp(args[0], args[1], args[2], 'is-group');
            return {channelName: args[0], userCtx: args[2], flags: args[3]};
        });
        this.pushHistoryItem(group);
    }
    /**
     * @param {() => any} thenDo
     * @returns {Function} Unregister
     * @access public
     */
    onAfterItemsSynced(thenDo) {
        return saveButtonEvents2.on('after-items-synced', thenDo);
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
     * @param {isOn: boolean} isOn
     * @access public
     */
    setHotkeyUndoLockIsOn(isOn) {
        this.hotkeyUndoLockIsOn = isOn;
    }
    /**
     * @template T
     * @param {(queue: Array<StateHistory<T>>, activeState: Array<T>) => Array<StateHistory<T>>|null} fn
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
     * @param {fn(activeStates: Array<state>) => void} withFn
     * @returns {Array<state>}
     * @access public
     */
    mutateActiveStates(channelName, fn) {
        const activeStatesMut = this.getActiveState(channelName, 0);
        fn(activeStatesMut);
        return activeStatesMut;
    }
    /**
     * @access public
     */
    doUndo() {
        const head = this.opHistory[--this.opHistoryCursor];
        const norm = normalizeItem(head);
        norm.forEach(({channelName, userCtx}) => {
            const state = this.states[channelName][--this.stateCursors[channelName]];
            this.emitStateChange(channelName, state, userCtx, 'undo');
        });
        this.renderer.setState(this.createCanUndoAndRedo());
    }
    /**
     * @access public
     */
    doRedo() {
        const head = this.opHistory[this.opHistoryCursor++];
        normalizeItem(head).forEach(({channelName, userCtx}) => {
            const state = this.states[channelName][++this.stateCursors[channelName]];
            this.emitStateChange(channelName, state, userCtx, 'redo');
        });
        this.renderer.setState(this.createCanUndoAndRedo());
    }
    /**
     * @access public
     */
    async syncQueuedOpsToBackend() {
        this.unregisterAndClearUnsavedChagesAlertIfSet();
        this.renderer.setState({isSubmitting: true});

        const syncQueue = await this.createSynctobackendQueue();
        for (const top of syncQueue) {
            const handler = this.channelImpls[top.channelName];
            const result = await handler.syncToBackend(top, syncQueue);
            // If handler returns false -> stop processing. If it returns any other value
            // (undefined, true, etc.) -> interpret this as a success and continue
            const isStopSignal = result === false;
            if (isStopSignal) {
                this.removeOpHistoryItemsBetween(/*?, ? todo*/);
                this.renderer.setState({isSubmitting: false});
            }
        }

        this.reset(getLatestItemsOfEachChannel(syncQueue));
        saveButtonEvents2.emit('after-items-synced');
    }
    /**
     * @access public
     */
    getInstance() {
        return this;
    }
    /**
     * @param {preact.Component} renderer
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
        if (this.opHistoryCursor < this.opHistory.length)
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
                    const initialStates = queue.reduce((out, {channelName, initial}) => ({...out, [channelName]: initial}), {});
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
     * @param {state} state
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
     * @returns {state}
     * @access private
     */
    getHead(channelName) {
        const pool = this.states[channelName] || [];
        return pool[this.stateCursors[channelName]] || null;
    }
    /**
     * @param {string} channelName
     * @param {number} start = 1
     * @returns {Array<state>}
     * @access private
     */
    getActiveState(channelName, start = 1) {
        const pool = this.states[channelName];
        // ['initial', '1st', '2nd', '3rd'] -> ['1st']               (if cursor = 1)
        // ['initial', '1st', '2nd', '3rd'] -> ['1st', '2nd']        (if cursor = 2)
        // ['initial', '1st', '2nd', '3rd'] -> ['1st', '2nd', '3rd'] (if cursor = 3)
        const fromFirstToCursor = pool.slice(start, this.stateCursors[channelName] + 1);
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
     * @returns {[Array<StateHistory>, todo]}
     * @access private
     */
    createSyncQueuePre() {
        const channelNamesOrdered = this.getHistoryChannelNames();
        const activeStates = {};
        const out = channelNamesOrdered.map(channelName => {
            const fromFirstToCursor = this.getActiveState(channelName);
            activeStates[channelName] = fromFirstToCursor;
            return {
                channelName,
                initial: this.states[channelName][0], // Example 'initial'
                first: fromFirstToCursor[0],          // Example '1st'
                latest: fromFirstToCursor.at(-1)      // Example '3rd' (if cursor = 3)
            };
        });
        return [out, activeStates];
    }
    /**
     * @param {{[channelName]: state;}} syncedStates Latest / synced states that were just saved to the backend
     * @param {boolean} emitChange = false
     * @access private
     */
    reset(syncedStates, emitChange = false) {
        this.opHistory = [];
        this.opHistoryCursor = 1;

        for (const channelName in this.states) {
            const initialState = syncedStates[channelName] || this.getHead(channelName);
            this.clearStateOf(channelName, initialState);
            if (emitChange)
                this.emitStateChange(channelName, initialState, {}, 'undo');
        }
        this.renderer.resetState();
    }
    /**
     * @param {string} channelName
     * @param {state} initialState
     * @access private
     */
    clearStateOf(channelName, initialState) {
        this.states[channelName] = [initialState];
        this.stateCursors[channelName] = 0;
    }
    /**
     * @param {number} from
     * @param {number} to
     * @access private
     */
    removeOpHistoryItemsBetween(from, to) {
        // todo
    }
    /**
     * @returns {Array<string>}
     * @access private
     */
    getHistoryChannelNames() {
        const map = new Map;
        for (let i = 0; i < this.opHistoryCursor; ++i) {
            normalizeItem(this.opHistory[i]).forEach(({channelName}) => {
                map.set(channelName, 1);
            });
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
        const activeHistory = this.opHistory.slice(this.opHistoryCursor);
        return {
            canUndo: this.opHistoryCursor > 0,
            canRedo: activeHistory.length > 0,
        };
    }
    /**
     * @access private
     */
    doInvalidateAll() {
        this.states = {};
        this.stateCursors = {};
        this.channelImpls = {};

        this.opHistory = [];
        this.opHistoryCursor = 1;
    }
}

/**
 * @typedef {any} state
 *
 * @typedef HistoryItem
 * @prop {string} channelName
 * @prop {any} userCtx
 * @prop {blockPropValueChangeFlags} flags
 */

export default SaveButton;
