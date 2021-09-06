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
            top.handler()
                .then(doProceed => {
                    // Truthy value -> clear item from the queue and proceed
                    if (doProceed !== false) { queue.shift(); next(queue); }
                    // false -> do not clear the item and stop
                    else store.dispatch(setOpQueue(queue));
                });
        };
        next(optimizeQueueTEMP(this.queuedOps.slice(0)));
    }
}

function optimizeQueueTEMP(queue) {
    if (queue[0].opName === 'create-new-page')
        return [queue[0]];
    if (queue[0].opName === 'append-block-to-tree' ||
        queue[0].opName === 'delete-block-from-tree' ||
        queue[0].opName === 'update-tree-block' ||
        queue[0].opName === 'swapped-blocks-in-tree' ||
        queue[0].opName === 'update-page-basic-info')
        return [queue[queue.length - 1]];
    throw new Error();
}

export default SaveButton;
