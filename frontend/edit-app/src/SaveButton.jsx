import {__} from '@sivujetti-commons';
import Icon from '../../commons/Icon.jsx';
import store, {observeStore, setOpQueue, selectOpQueue, selectFormStates} from './store.js';

class SaveButton extends preact.Component {
    // queuedOps;
    /**
     * @param {Object} props
     */
    constructor(props) {
        super(props);
        this.state = {isVisible: false, formState: {}};
        this.queuedOps = [];
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
            class="btn btn-link pr-1"
            title={ __('Save changes') }>
            <Icon iconId="save" className="size-sm"/> *
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
            } else if (opName === 'append-layout-block' ||
                       opName === 'swap-layout-blocks' ||
                       opName === 'delete-layout-block') {
                itm.opName = 'update-layout-block';
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
