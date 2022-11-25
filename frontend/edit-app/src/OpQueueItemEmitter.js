import {http, signals} from '@sivujetti-commons-for-edit-app';
import blockTreeUtils from './left-panel/Block/blockTreeUtils.js';
import {saveExistingBlocksToBackend} from './left-panel/Block/createBlockTreeDndController.js';
import store, {pushItemToOpQueue} from './store.js';
import store2, {observeStore as observeStore2} from './store2';

/**
 * Listens various storeOn events, and emits/pushes tasks (save something to the
 * backend) to opQueue based on those events.
 */
class OpQueueItemEmitter {
    // unregistrables;
    // prevTree;
    // pushSaveOpTimeouts;
    /**
     */
    constructor() {
        this.unregistrables = [];
        this.pushSaveOpTimeouts = {};
    }
    /**
     * @access public
     */
    resetAndBegin() {
        this.unregistrables.forEach(unreg => unreg());
        //
        this.unregistrables = [observeStore2('theBlockTree', ({theBlockTree}, [event, data]) => {
            if (event === 'theBlockTree/init') {
                this.setPrevBlockTreeTree(theBlockTree);
            } else if (event === 'theBlockTree/applySwap' || event === 'theBlockTree/applyAdd(Drop)Block') {
                const oldTree = this.prevTree;
                const [_drag, target] = data; // [BlockDescriptorStub, BlockDescriptorStub]
                this.pushSaveBlockTreeToBackendOp(theBlockTree, oldTree, target.isStoredToTreeId, null);
            } else if (event === 'theBlockTree/deleteBlock') {
                const oldTree = this.prevTree;
                const [_id, blockIsStoredToTreeId, _wasCurrentlySelectedBlock] = data;
                this.pushSaveBlockTreeToBackendOp(theBlockTree, oldTree, blockIsStoredToTreeId, null);
            } else if (event === 'theBlockTree/undoAdd(Drop)Block') {
                // do nothing
            } else if (event === 'theBlockTree/updatePropsOf') {
                const [blockId, blockIsStoredToTreeId, _changes, hasErrors, debounceMillis] = data;
                if (hasErrors) return;
                if (this.pushSaveOpTimeouts[blockId]) clearTimeout(this.pushSaveOpTimeouts[blockId]);
                const oldTree = this.prevTree;
                const fn = () => { this.pushSaveBlockTreeToBackendOp(theBlockTree, oldTree, blockIsStoredToTreeId, blockId); };
                if (debounceMillis > 0) this.pushSaveOpTimeouts[blockId] = setTimeout(fn, debounceMillis);
                else fn();
            } else if (event === 'theBlockTree/cloneItem') {
                const oldTree = this.prevTree;
                const [clonedInf, _clonedFromInf] = data; // [SpawnDescriptor, BlockDescriptor]
                const cloned = clonedInf.block;
                this.pushSaveBlockTreeToBackendOp(theBlockTree, oldTree, cloned.isStoredToTreeId, null);
            }
        }),
        observeStore2('pagesListings', ({pagesListings}, [event, data]) => {
            if (event === 'pagesListings/addItem') {
                const snap = JSON.parse(JSON.stringify(pagesListings));
                const newItem = {...data[0]};
                const pageTypeName = data[1];
                store.dispatch(pushItemToOpQueue('quick-create-page', {
                    doHandle: () => http.post(`/api/pages/${pageTypeName}/quick`, newItem).then(resp => {
                        if (resp.ok !== 'ok') throw new Error('-'); // ??
                    }),
                    doUndo: () => {
                        snap.pop();
                        store2.dispatch('pagesListings/setAll', [snap]);
                    },
                    args: [],
                }));
            }
        })];
    }
    /**
     * @param {Array<RawBlock>} blockTrees
     * @param {Array<RawBlock>} oldTree
     * @param {String} blockIsStoredToTreeId
     * @param {String|null} updateOfBlockId
     * @access private
     */
    pushSaveBlockTreeToBackendOp(blockTrees, oldTree, blockIsStoredToTreeId, updateOfBlockId) {
        const rootOrInnerTree = blockTreeUtils.getRootFor(blockIsStoredToTreeId, blockTrees);
        if (updateOfBlockId) signals.emit('onOpQueueBeforePushItem', updateOfBlockId);
        store.dispatch(pushItemToOpQueue('update-block-tree##main', {
            doHandle: () => saveExistingBlocksToBackend(rootOrInnerTree, blockIsStoredToTreeId),
            doUndo: () => {
                store2.dispatch('theBlockTree/undo', [oldTree, updateOfBlockId, blockIsStoredToTreeId]);
                this.setPrevBlockTreeTree(oldTree);
            },
            args: [],
        }));
        this.setPrevBlockTreeTree(blockTrees);
    }
    /**
     * @param {Array<RawBlock>} blockTrees
     * @access private
     */
    setPrevBlockTreeTree(blockTrees) {
        this.prevTree = blockTrees;
    }
}

const singleton = new OpQueueItemEmitter;

export default singleton;
