import {__, env, Icon, Signals} from '../../sivujetti-commons-unified.js';
import {fetchOrGet as fetchOrGetGlobalBlockTrees} from '../includes/global-block-trees/repository.js';
import {createGbtState, getLatestItemsOfEachChannel, getRefBlocksThatHasGbtChanges, handlerFactoriesMap} from './SaveButtonFuncs.js';

const saveButtonSignals = new Signals;
const saveButtonSignals2 = new Signals;

class SaveButton extends preact.Component {
    // states;
    // stateCursors;
    // channelImpls;
    // opHistory;
    // opHistoryCursor;
    /**
     * @param {SaveButtonProps} props
     */
    constructor(props) {
        super(props);
        this.invalidateAll();
        this.state = {canUndo: false, canRedo: false};
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
        return saveButtonSignals.on(createSignalName(name), fn);
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
                saveButtonSignals.emit(createSignalName(name), state, null, 'initial');
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
        return saveButtonSignals2.on('after-items-synced', fn);
    }
    /**
     * @access public
     */
    invalidateAll() {
        this.states = {};
        this.stateCursors = {};
        this.channelImpls = {};

        this.opHistory = [];
        this.opHistoryCursor = 1;
    }
    }
    /**
     * @access protected
     */
    componentDidMount() {
        this.props.editAppOuterEl.addEventListener('scroll', e => {
            if (e.target.scrollTop > 21 && !this.state.isStickied)
                this.setState({isStickied: true});
            else if (e.target.scrollTop < 21 && this.state.isStickied)
                this.setState({isStickied: false});
        });
    }
    /**
     * @param {SaveButtonProps} props
     * @access protected
     */
    render(_, {isStickied, canUndo, canRedo}) {
        const saveBtnIsDisabled = false;
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
                disabled={ canRedo }>
				<span class="d-flex flipped-undo-icon">{ icon }</span>
			</button>
            <button
                onClick={ this.syncQueuedOpsToBackend.bind(this) }
                class="btn btn-link flex-centered px-2"
                title={ __('Save changes') }
                disabled={ saveBtnIsDisabled }>
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
        this.setState({canUndo: true});
    }
    /**
     * @param {String} channelName
     * @param {state} state
     * @param {StateChangeUserContext|null} userCtx
     * @param {stateChangeContext} context
     * @access private
     */
    emitStateChange(channelName, state, userCtx, context) { // todo 
        const handler = this.channelImpls[channelName];
        handler.handleStateChange(state, userCtx, context);
        saveButtonSignals.emit(createSignalName(channelName), state, userCtx, context);
    }
    /**
    /**
     * @access private
     */
    doUndo() {
    }
    /**
     * @access private
     */
    doRedo() {
    }
    /**
     * @access private
     */
    syncQueuedOpsToBackend() {
        const next = (queue, i) => {
            const top = queue[i];
            if (top) {
                const handler = this.channelImpls[top.channelName];
                handler.syncToBackend(top, queue).then(doProceed => {
                    const hadRecoverableException = doProceed === false; // Note: false = recoverableException, anyOtherValue = ok
                    // Promise returned any value other than false (undefined, true, etc.) -> intepret this as a success and continue
                    if (!hadRecoverableException)
                        next(queue, i + 1);
                    // Handler returned false -> this menas that it encountered a recoverable error -> do not call next() and stop
                    else {
                        this.removeOpHistoryItemsBetween(/*this.opHistoryCursor - 1, this.opHistoryCursor - 1 + i todo*/);
                        this.setState({isSubmitting: false});
                    }
                });
            } else { // Got them all
                this.reset(getLatestItemsOfEachChannel(queue));
                saveButtonSignals2.emit('after-items-synced');
            }
        };
        this.setState({isSubmitting: true});
        this.createSynctobackendQueue().then(syncQueue => {
            next(syncQueue, 0);
        });
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
    createSynctobackendQueue() {
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
        const blockTreeStates = activeStates['theBlockTree'];
        // Found block changes, check if any of them is a global block tree block
        if (blockTreeStates) {
            const refBlocksThatHasGbtChanges = getRefBlocksThatHasGbtChanges(blockTreeStates);
            // Some were -> dynamically create, or patch $out's 'globalBlockTrees' item
            if (refBlocksThatHasGbtChanges.length) {
                return fetchOrGetGlobalBlockTrees().then(latestState => {
                    const dynamicallyCreatedPatchedLatestState = createGbtState(latestState, refBlocksThatHasGbtChanges);

                    const gbtsHistoryItem = out.find(({channelName}) => channelName === 'globalBlockTrees');
                    if (!gbtsHistoryItem) { // $out didn't even contain 'globalBlockTrees' item, add it
                        return [...out, {
                            channelName: 'globalBlockTrees',
                            initial: this.states['globalBlockTrees'][0],
                            first: this.getActiveState('globalBlockTrees')[0],
                            latest: dynamicallyCreatedPatchedLatestState
                        }];
                    } else { // patch it
                        return out.map(item => item !== gbtsHistoryItem ? item : {
                            ...item,
                            ...{latest: dynamicallyCreatedPatchedLatestState}
                        });
                    }
                });
            }
        }
        //
        return Promise.resolve(out);
    }
    /**
     * @param {{[channelName]: state;}} syncedStates Latest / sunced states that were just saved to the backend
     * @access private
     */
    reset(syncedStates) {
        this.opHistory = [];
        this.opHistoryCursor = 1;

        this.setState({canUndo: false, canRedo: false});
        for (const channelName in this.states) {
            this.clearStateOf(channelName, syncedStates[channelName] || this.getHead(channelName));
        }
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
}

/**
 * @param {HistoryItem|Array<HistoryItem>} ir
 * @returns {Array<HistoryItem>}
 */
function normalizeItem(ir) {
    return Array.isArray(ir) ? ir : [ir];
}
}

/**
 * @param {String} channelName
 * @returns {String}
 */
function createSignalName(channelName) {
    return `${channelName} mutated`;
}
}

/**
 * @typedef SaveButtonProps
 * @prop {HTMLElement} editAppOuterEl
 *
 *
 * @typedef {any} state
 *
 * @typedef HistoryItem
 * @prop {String} channelName
 * @prop {any} userCtx
 * @prop {blockPropValueChangeFlags} flags
 */

export default SaveButton;
