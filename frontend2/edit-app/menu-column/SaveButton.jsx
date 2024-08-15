import {__, env, Icon, Events} from '@sivujetti-commons-for-edit-app';
import {getMetaKey} from '../../shared-inline.js';
import {historyInstance, isMainColumnViewUrl} from '../main-column/MainColumnViews.jsx';
import {
    getLatestItemsOfEachChannel,
    handlerFactoriesMap,
    createSignalName,
    normalizeItem,
    createInitialState,
    globalBlockTreeSaveOpFilter,
} from './SaveButtonFuncs.js';

const saveButtonEvents = new Events;
const saveButtonEvents2 = new Events;

const useStickiedClsChangeUpdater = false;

class SaveButton extends preact.Component {
    // states;
    // stateCursors;
    // channelImpls;
    // opHistory;
    // opHistoryCursor;
    // unregisterUnsavedChangesAlert;
    // syncQueueFilters;
    /**
     * @param {SaveButtonProps} props
     */
    constructor(props) {
        super(props);
        this.doInvalidateAll();
        this.state = createInitialState();
        this.addUndoKeyListener();
    }
    /**
     * @param {String} name
     * @param {(state: state, userCtx: StateChangeUserContext, context: stateChangeContext) => any} fn
     * @access public
     */
    subscribeToChannel(name, fn) {
        if (!handlerFactoriesMap[name]) {
            env.console.warn(`Unknown channel "${name}". Known: ${Object.keys(handlerFactoriesMap).join(', ')}`);
            return;
        }
        return saveButtonEvents.on(createSignalName(name), fn);
    }
    /**
     * @param {String} name
     * @param {state} state
     * @param {Boolean} broadcastInitialStateToListeners = false
     * @access public
     */
    initChannel(name, state, broadcastInitialStateToListeners = false) {
        const createHandler = handlerFactoriesMap[name];
        if (createHandler) {
            const handler = createHandler();
            this.channelImpls[name] = handler;

            this.clearStateOf(name, state);

            if (broadcastInitialStateToListeners)
                saveButtonEvents.emit(createSignalName(name), state, null, 'initial');
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
     * @param {String} channelName
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

        if (!flags || flags === 'is-throttled') {
            if (!flags) { // normal push, check if there's mergeable items before this one
                // todo
                this.pushHistoryItem({channelName, userCtx, flags});
            }
            else
               this.pushHistoryItem({channelName, userCtx, flags});
        }
    }
    /**
     * Pushes multiple ops to the history that will be undone/redone as a group when undo/redo is called.
     *
     * @param {[String, state, StateChangeUserContext|null, blockPropValueChangeFlags]} ...ops
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
     * @param {() => any} fn
     * @returns {Function} Unregister
     * @access public
     */
    onAfterItemsSynced(fn) {
        return saveButtonEvents2.on('after-items-synced', fn);
    }
    /**
     * @access public
     */
    invalidateAll() {
        this.unregisterAndClearUnsavedChagesAlertIfSet();
        this.doInvalidateAll();
        this.setState(createInitialState());
        this.syncQueueFilters = [globalBlockTreeSaveOpFilter.bind(this)];
    }
    /**
     * @access protected
     */
    componentDidMount() {
        if (useStickiedClsChangeUpdater)
            this.props.editAppOuterEl.addEventListener('scroll', e => {
                if (e.target.scrollTop > 21 && !this.state.isStickied)
                    this.setState({isStickied: true});
                else if (e.target.scrollTop < 21 && this.state.isStickied)
                    this.setState({isStickied: false});
            });
        this.syncQueueFilters = [globalBlockTreeSaveOpFilter.bind(this)];
    }
    /**
     * @param {SaveButtonProps} props
     * @access protected
     */
    render(_, {isVisible, canUndo, canRedo, isSubmitting, isStickied}) {
        if (!isVisible) return;
        const cls = !isStickied ? '' : ' stickied pl-1';
        const icon = <Icon iconId="arrow-back-up" className={ `${!isStickied ? 'size-sm' : 'size-xs'} color-dimmed3` }/>;
        return <div class={ `save-button d-flex col-ml-auto flex-centered${cls}` }>
            <button
                onClick={ this.doUndo.bind(this) }
                class="btn btn-link px-1 pt-2"
                title={ __('Undo latest change') }
                disabled={ !canUndo }>
                <span class="d-flex">{ icon }</span>
            </button>
            <button
                onClick={ this.doRedo.bind(this) }
                class="btn btn-link px-1 pt-2"
                title={ __('Redo') }
                disabled={ !canRedo }>
                <span class="d-flex flipped-undo-icon">{ icon }</span>
            </button>
            <button
                onClick={ this.syncQueuedOpsToBackend.bind(this) }
                class="btn btn-link flex-centered px-2"
                title={ __('Save changes') }
                disabled={ isSubmitting }>
                <Icon iconId="device-floppy" className={ !isStickied ? '' : 'size-sm' }/>
                <span class="mt-1 ml-1">*</span>
            </button>
        </div>;
    }
    /**
     * @param {HistoryItem|Array<HistoryItem>} item
     * @access private
     */
    pushHistoryItem(item) {
        if (this.opHistoryCursor < this.opHistory.length)
            this.opHistory.splice(this.opHistoryCursor);
        this.opHistoryCursor = this.opHistory.push(item);
        this.setState({isVisible: true, canUndo: true});
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
     * @param {String} channelName
     * @param {state} state
     * @param {StateChangeUserContext|null} userCtx
     * @param {stateChangeContext} context
     * @access private
     */
    emitStateChange(channelName, state, userCtx, context) {
        const handler = this.channelImpls[channelName];
        handler.handleStateChange(state, userCtx, context);
        saveButtonEvents.emit(createSignalName(channelName), state, userCtx, context);
    }
    /**
     * @access private
     */
    doUndo() {
        const head = this.opHistory[--this.opHistoryCursor];
        const norm = normalizeItem(head);
        norm.forEach(({channelName, userCtx}) => {
            const state = this.states[channelName][--this.stateCursors[channelName]];
            this.emitStateChange(channelName, state, userCtx, 'undo');
        });
        this.setState(this.createCanUndoAndRedo());
    }
    /**
     * @access private
     */
    doRedo() {
        const head = this.opHistory[this.opHistoryCursor++];
        normalizeItem(head).forEach(({channelName, userCtx}) => {
            const state = this.states[channelName][++this.stateCursors[channelName]];
            this.emitStateChange(channelName, state, userCtx, 'redo');
        });
        this.setState(this.createCanUndoAndRedo());
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
    async syncQueuedOpsToBackend() {
        this.unregisterAndClearUnsavedChagesAlertIfSet();
        const next = (queue, i) => {
            const top = queue[i];
            if (top) {
                const handler = this.channelImpls[top.channelName];
                handler.syncToBackend(top, queue).then(doProceed => {
                    const hadRecoverableException = doProceed === false; // Note: false = recoverableException, anyOtherValue = ok
                    // Promise returned any value other than false (undefined, true, etc.) -> interpret this as a success and continue
                    if (!hadRecoverableException)
                        next(queue, i + 1);
                    // Handler returned false (i.e., a recoverable error occurred) -> do not call next() and stop
                    else {
                        this.removeOpHistoryItemsBetween(/*?, ? todo*/);
                        this.setState({isSubmitting: false});
                    }
                });
            } else { // Got them all
                this.reset(getLatestItemsOfEachChannel(queue));
                saveButtonEvents2.emit('after-items-synced');
            }
        };
        this.setState({isSubmitting: true});
        const syncQueue = await this.createSynctobackendQueue();
        next(syncQueue, 0);
    }
    /**
     * @template T
     * @param {(queue: Array<StateHistory<T>>, activeState: Array<T>) => Array<StateHistory<T>>|null} fn
     * @param {Boolean} toEnd
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
     * @returns {state}
     * @access private
     */
    getHead(channelName) {
        const pool = this.states[channelName] || [];
        return pool[this.stateCursors[channelName]] || null;
    }
    /**
     * @param {String} channelName
     * @returns {Array<state>}
     * @access private
     */
    getActiveState(channelName) {
        const pool = this.states[channelName];
        const afterInitial = 1;
        // ['initial', '1st', '2nd', '3rd'] -> ['1st']               (if cursor = 1)
        // ['initial', '1st', '2nd', '3rd'] -> ['1st', '2nd']        (if cursor = 2)
        // ['initial', '1st', '2nd', '3rd'] -> ['1st', '2nd', '3rd'] (if cursor = 3)
        const fromFirstToCursor = pool.slice(afterInitial, this.stateCursors[channelName] + afterInitial);
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
     * @param {Boolean} emitChange = false
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
        this.setState(createInitialState());
    }
    /**
     * @param {String} channelName
     * @param {state} initialState
     * @access private
     */
    clearStateOf(channelName, initialState) {
        this.states[channelName] = [initialState];
        this.stateCursors[channelName] = 0;
    }
    /**
     * @param {Number} from
     * @param {Number} to
     * @access private
     */
    removeOpHistoryItemsBetween(from, to) {
        // todo
    }
    /**
     * @returns {Array<String>}
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
                if (shiftKeyIsPressed && this.state.canRedo) {
                    e.preventDefault(); // Prevent active input's onInput
                    this.doRedo();
                } else if (!shiftKeyIsPressed && this.state.canUndo) {
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
    doInvalidateAll() {
        this.states = {};
        this.stateCursors = {};
        this.channelImpls = {};

        this.opHistory = [];
        this.opHistoryCursor = 1;
    }
}

/**
 * @typedef SaveButtonProps
 * @prop {HTMLElement} editAppOuterEl
 *
 * @typedef {any} state
 *
 * @typedef HistoryItem
 * @prop {String} channelName
 * @prop {any} userCtx
 * @prop {blockPropValueChangeFlags} flags
 */

export default SaveButton;
