import {__, env, signals, Icon} from '@sivujetti-commons-for-edit-app';
import store, {observeStore, setOpQueue, selectOpQueue, selectFormStates} from './store.js';

let isUndoKeyListenersAdded = false;

class SaveButton extends preact.Component {
    // queuedOps;
    // opQueueMutator;
    /**
     * @param {{mainPanelOuterEl: HTMLElement; initialLeftPanelWidth: Number;}} props
     */
    constructor(props) {
        super(props);
        this.state = {isVisible: false, hasUndoableOps: false, formState: {},
                        isStickied: false, leftPanelWidth: props.initialLeftPanelWidth, isSubmitting: false};
        this.queuedOps = [];
        if (!isUndoKeyListenersAdded) {
            this.addUndoKeyListener();
            isUndoKeyListenersAdded = true;
        }
        observeStore(selectOpQueue, ops => {
            this.queuedOps = ops;
            if (ops.length && !this.state.isVisible)
                this.setState({isVisible: true});
            else if (!ops.length && this.state.isVisible)
                this.setState({isVisible: false, isSubmitting: false});
            this.setState({hasUndoableOps: ops.length ? ops.some(({command}) => !!command.doUndo) : false});
        });
        observeStore(selectFormStates, formStates => {
            let aggregated = {isValid: true};
            for (const key in formStates) {
                aggregated = formStates[key];
                if (!aggregated.isValid) break;
            }
            this.setState({formState: aggregated});
        });
    }
    /**
     * @access protected
     */
    componentDidMount() {
        signals.on('left-panel-width-changed', w => {
            if (this.state.leftPanelWidth !== w)
                this.setState({leftPanelWidth: w});
        });
        this.props.mainPanelOuterEl.addEventListener('scroll', e => {
            if (e.target.scrollTop > 27 && !this.state.isStickied)
                this.setState({isStickied: true});
            else if (e.target.scrollTop < 27 && this.state.isStickied)
                this.setState({isStickied: false});
        });
    }
    /**
     * @access public
     */
    doUndo() {
        const head = this.queuedOps[this.queuedOps.length - 1].command;
        if (!head.doUndo) return;
        head.doUndo(...head.args);
        store.dispatch(setOpQueue(this.queuedOps.slice(0, this.queuedOps.length - 1)));
    }
    /**
     * @param {((queue: Array<OpQueueOp>) => Array<OpQueueOp>)|null} fn
     * @access public
     */
    setOnBeforeProcessQueueFn(fn) {
        this.opQueueMutator = fn;
    }
    /**
     * @access protected
     */
    render (_, {isVisible, hasUndoableOps, formState, isStickied, leftPanelWidth, isSubmitting}) {
        if (!isVisible) return;
        const saveBtnIsDisabled = formState.isValidating || formState.isSubmitting || !formState.isValid || isSubmitting;
        const undoButtonIsHidden = saveBtnIsDisabled ? true : hasUndoableOps === false;
        const [cls, css] = !isStickied ? ['', ''] : [' stickied', `left: ${leftPanelWidth - 95}px`];
        return <div class={ `d-flex col-ml-auto flex-centered${cls}` } style={ css }>
            <button
                onClick={ this.doUndo.bind(this) }
                class={ `btn btn-link px-1 pt-2${!undoButtonIsHidden ? '' : ' d-none'}` }
                title={ __('Undo latest change') }>
				<span class="d-flex" style="transform: rotate(181deg)">
                    <Icon iconId="rotate" className={ `${!isStickied ? 'size-sm' : 'size-xs'} color-dimmed3` }/>
                </span>
			</button>
            <button
                onClick={ this.execQueuedOps.bind(this) }
                disabled={ saveBtnIsDisabled }
                class="btn btn-link flex-centered px-2"
                title={ __('Save changes') }>
                <Icon iconId="device-floppy" className={ !isStickied ? '' : 'size-sm' }/>
                <span class="mt-1 ml-1">*</span>
            </button>
        </div>;
    }
    /**
     * @access private
     */
    execQueuedOps() {
        const next = queue => {
            const top = queue[0];
            if (!top) {
                store.dispatch(setOpQueue([]));
                return;
            }
            top.command.doHandle(...top.command.args)
                .then(doProceed => {
                    // Truthy value -> clear item from the queue and proceed
                    if (doProceed !== false) { queue.shift(); next(queue); }
                    // false -> do not clear the item and stop
                    else { this.setState({isSubmitting: false}); store.dispatch(setOpQueue(queue)); }
                });
        };
        this.setState({isSubmitting: true});
        const q = optimizeQueue(this.queuedOps.slice(0));
        next(!this.opQueueMutator ? q : this.opQueueMutator(q));
    }
    /**
     * @access private
     */
    addUndoKeyListener() {
        const metaKey = getMetaKey();
        const undoKey = 'z';
        let metaKeyIsPressed = false;
        env.window.addEventListener('keydown', e => {
            if (e.key === metaKey) {
                metaKeyIsPressed = true;
                return;
            }
            if (metaKeyIsPressed && e.key === undoKey && this.queuedOps.length) {
                e.preventDefault(); // Prevent active input's onInput
                this.doUndo();
            }
        });
        env.window.addEventListener('keyup', e => {
            if (e.key === metaKey) {
                metaKeyIsPressed = false;
            }
        });
    }
}

/**
 * @returns {String} 'Meta' if macOS, 'Control' if Windows or anything else
 */
function getMetaKey() {
    return ((navigator.userAgentData && navigator.userAgentData.platform === 'macOS') ||
            (navigator.platform === 'MacIntel')) ? 'Meta' : 'Control';
}

/**
 * Note: may mutate queue.*.opName
 *
 * @param {Array<OpQueueOp>} queue
 * @returns {Array<OpQueueOp>}
 */
function optimizeQueue(queue) {
    const unifyBlockOpNames = queue => {
        queue.forEach(itm => {
            const opName = itm.opName;
            // 'something#<trid>' -> 'update-block-tree#<trid>'
            if (opName.startsWith('append-block-to-tree#') ||
                opName.startsWith('swap-blocks-of-tree#') ||
                opName.startsWith('delete-block-from-tree#')) {
                itm.opName = `update-block-tree#${opName.split('#')[1]}`;
            }
        });
        return queue;
    };
    const findLastSimilar = (itm, state) => {
        let last = null;
        queue.forEach((cand, i) => {
            if (cand.opName === itm.opName) {
                last = cand;
                state[i].appended = true;
            }
        });
        return last;
    };
    //
    const out = [];
    queue = queue.filter(({command}) => command.doHandle !== null);
    const state = queue.map(() => ({appended: false}));
    unifyBlockOpNames(queue).forEach((itm, i) => {
        if (state[i].appended) return;
        out.push(findLastSimilar(itm, state) || itm);
        state[i].appended = true;
    });
    return out;
}

export default SaveButton;
export {optimizeQueue};
