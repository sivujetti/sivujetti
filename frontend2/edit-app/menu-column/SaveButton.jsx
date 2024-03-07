import {__, env, Icon, Signals} from '../../sivujetti-commons-unified.js';
import {handlerFactoriesMap} from './SaveButtonFuncs.js';

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
     * @param {(state: any, userCtx: StateChangeUserContext, context: stateChangeContext) => any} fn
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
     * @param {any} state
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
     * @param {any} state
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
     * @access public
     */
    pushOpGroup(...ops) {
        //
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
     * @param {any} state
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
                this.reset();
                saveButtonSignals2.emit('after-items-synced');
            }
        };
        this.setState({isSubmitting: true});
        const syncQueue = this.createSynctobackendQueue();
        next(syncQueue, 0);
    }
    /**
     * @returns {any}
     * @access private
     */
    getHead(channelName) {
        return (this.states[channelName] || [])[this.stateCursors[channelName]] || null;
    }
    /**
     * @returns {Array<StateHistory>}
     * @access private
     */
    createSynctobackendQueue() {
        const tmpmap = new Map;
        for (let i = 0; i < this.opHistoryCursor; ++i) {
            normalizeItem(this.opHistory[i]).forEach(({channelName}) => {
                // histV1: if (flags === 'is-initial') return;
                tmpmap.set(channelName, 1);
            });
        }
        const ordered = [...tmpmap.keys()];

        return ordered.map(channelName => {
            const pool = this.states[channelName];
            const afterInitial = 1;
            const fromFirstToCursor = pool.slice(afterInitial, this.stateCursors[channelName] + afterInitial);
            return {
                channelName,
                initial: pool[0],               // Example 'initial'
                first: fromFirstToCursor[0],    // Example '1st'
                latest: fromFirstToCursor.at(-1)  // Example '3rd' (if cursor = 3)
            };
        });
    }
    /**
     * @access private
     */
    reset() {
        // todo
    }
    /**
     * @param {String} channelName
     * @param {any} initialState
     * @access private
     */
    clearStateOf(channelName, initialState) {
        this.states[channelName] = [initialState];
        this.stateCursors[channelName] = 0;
    }
    removeOpHistoryItemsBetween(from, to) {
        // todo
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
 * @typedef HistoryItem
 * @prop {String} channelName
 * @prop {any} userCtx
 * @prop {blockPropValueChangeFlags} flags
 */

export default SaveButton;
