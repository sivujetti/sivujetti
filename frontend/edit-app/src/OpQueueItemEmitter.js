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
    // pushSaveOpTimeout;
    /**
     */
    constructor() {
        this.unregistrables = [];
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
                const [_drag, target] = data;
                this.pushSaveBlockTreeToBackendOp(theBlockTree, oldTree, target.isStoredToTreeId, null);
            } else if (event === 'theBlockTree/deleteBlock') {
                const oldTree = this.prevTree;
                const [_id, blockIsStoredToTreeId, _what, _wasCurrentlySelectedBlock] = data;
                this.pushSaveBlockTreeToBackendOp(theBlockTree, oldTree, blockIsStoredToTreeId, null);
            } else if (event === 'theBlockTree/undoAdd(Drop)Block') {
                // do nothing
            } else if (event === 'theBlockTree/updatePropsOf') {
                const [blockId, blockIsStoredToTreeId, _changes, hasErrors, debounceMillis] = data;
                if (debounceMillis > 0) { // mitä jos edellinen vielä 
                    if (this.pushSaveOpTimeout) clearTimeout(this.pushSaveOpTimeout);
                    if (hasErrors) { console.log('has errors, skipping emit op'); return; }
                    const oldTree = this.prevTree;
                    //console.log('start time', JSON.parse(JSON.stringify(l)));
                    const fn = () => { /*console.log('run time', JSON.parse(JSON.stringify(l)));*/ this.pushSaveBlockTreeToBackendOp(theBlockTree, oldTree, blockIsStoredToTreeId, blockId); };
                    this.pushSaveOpTimeout = setTimeout(fn, debounceMillis);
                } else {
                    // todo mitä jos this.pushSaveOpTimeout ?
                    const oldTree = this.prevTree;
                    this.pushSaveBlockTreeToBackendOp(theBlockTree, oldTree, blockIsStoredToTreeId, blockId);
                }
            } else if (event === 'theBlockTree/cloneItem') {
                const oldTree = this.prevTree;
                const [eee] = data;
                const cloned = eee.block;
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
                //console.log('revert to', JSON.parse(JSON.stringify(oldTree)), this.prevTree === oldTree);
                store2.dispatch('theBlockTree/undo', [oldTree, updateOfBlockId, blockIsStoredToTreeId]);
                this.setPrevBlockTreeTree(oldTree);
                //console.log('set bef', JSON.parse(JSON.stringify(this.prevTree)));
            },
            args: [],
        }));
        this.setPrevBlockTreeTree(blockTrees); // ? 
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
