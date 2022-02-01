import {__, env} from '@sivujetti-commons-for-edit-app';
import Icon from './commons/Icon.jsx';
import store, {observeStore, setOpQueue, selectOpQueue, selectFormStates} from './store.js';

let isUndoKeyListenersAdded = false;
let triggerUndo;

class SaveButton extends preact.Component {
    // queuedOps;
    /**
     * @param {Object} props
     */
    constructor(props) {
        super(props);
        this.state = {isVisible: false, formState: {}};
        this.queuedOps = [];
        triggerUndo = this.doUndo.bind(this);
        if (!isUndoKeyListenersAdded) {
            this.addUndoKeyListener();
            isUndoKeyListenersAdded = true;
        }
        observeStore(selectOpQueue, ops => {
            this.queuedOps = ops;
            if (ops.length && !this.state.isVisible)
                this.setState({isVisible: true});
            else if (!ops.length && this.state.isVisible)
                this.setState({isVisible: false});
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
    render (_, {isVisible, formState}) {
        if (!isVisible) return;
        return <button
            onClick={ this.execQueuedOps.bind(this) }
            disabled={ formState.isValidating || formState.isSubmitting || !formState.isValid }
            class="btn btn-link d-flex col-ml-auto"
            title={ __('Save changes') }
            style="margin-top: .08rem;">
            <Icon iconId="device-floppy"/>
            <span class="flex-centered mt-1 ml-1">*</span>
        </button>;
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
                    else store.dispatch(setOpQueue(queue));
                });
        };
        next(optimizeQueue(this.queuedOps.slice(0)));
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
    /**
     * @access private
     */
    doUndo() {
        const head = this.queuedOps[this.queuedOps.length - 1].command;
        if (!head.doUndo) return;
        head.doUndo(...head.args);
        store.dispatch(setOpQueue(this.queuedOps.slice(0, this.queuedOps.length - 1)));
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
 */
function optimizeQueue(queue) {
    const unifyBlockOpNames = queue => {
        queue.forEach(itm => {
            const opName = itm.opName;
            if (opName === 'append-page-block' ||
                opName === 'swap-page-blocks' ||
                opName === 'delete-page-block') {
                itm.opName = 'update-page-block';
            } else if (opName === 'append-globalBlockTree-block' ||
                       opName === 'swap-globalBlockTree-blocks' ||
                       opName === 'delete-globalBlockTree-block') {
                itm.opName = 'update-globalBlockTree-block';
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
export {optimizeQueue, triggerUndo};
