import {api, http, signals} from '@sivujetti-commons-for-edit-app';
import {HAS_ERRORS, NO_OP_QUEUE_EMIT} from './block/dom-commons.js';
import {treeToTransferable} from './block/utils.js';
import blockTreeUtils from './left-column/block/blockTreeUtils.js';
import {saveExistingBlocksToBackend} from './left-column/block/createBlockTreeDndController.js';
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
                this.setPrevBlockTree(theBlockTree);
            } else if (event === 'theBlockTree/applySwap' || event === 'theBlockTree/applyAdd(Drop)Block') {
                const oldTree = this.prevTree;
                const [drag, target, dropPos, treeTransfer] = data; // [BlockDescriptor, BlockDescriptor, dropPosition, treeTransferType]
                const {isStoredToTreeId} = !(target.isGbtRef && dropPos === 'as-child') ? target : {isStoredToTreeId: target.data.refTreeId};
                if (treeTransfer === 'none' || event === 'theBlockTree/applyAdd(Drop)Block')
                    this.pushSaveBlockTreeToBackendOp(theBlockTree, oldTree, isStoredToTreeId, null);
                else if (treeTransfer === 'out-of-gbt')
                    this.pushDoubleSaveOps(
                        blockTreeUtils.getRootFor(drag.isStoredToTreeId, theBlockTree), drag.isStoredToTreeId, // 1.
                        theBlockTree, isStoredToTreeId                                                         // 2.
                    );
                else if (treeTransfer === 'into-gbt')
                    this.pushDoubleSaveOps(
                        theBlockTree, 'main',           // 1.
                        theBlockTree, isStoredToTreeId  // 2.
                    );
            } else if (event === 'theBlockTree/deleteBlock') {
                const oldTree = this.prevTree;
                const [_id, blockIsStoredToTreeId, _wasCurrentlySelectedBlock] = data;
                this.pushSaveBlockTreeToBackendOp(theBlockTree, oldTree, blockIsStoredToTreeId, null);
            } else if (event === 'theBlockTree/undoAdd(Drop)Block') {
                // do nothing
            } else if (event === 'theBlockTree/updatePropsOf') {
                const [blockId, blockIsStoredToTreeId, _changes, flags, debounceMillis] = data;
                if ((flags & HAS_ERRORS) || (flags && NO_OP_QUEUE_EMIT)) return;
                if (this.pushSaveOpTimeouts[blockId]) clearTimeout(this.pushSaveOpTimeouts[blockId]);
                const oldTree = this.prevTree;
                const fn = () => { this.pushSaveBlockTreeToBackendOp(theBlockTree, oldTree, blockIsStoredToTreeId, blockId); };
                if (debounceMillis > 0) this.pushSaveOpTimeouts[blockId] = setTimeout(fn, debounceMillis);
                else fn();
            } else if (event === 'theBlockTree/updateDefPropsOf') {
                const [blockId, blockIsStoredToTreeId, _changes, isOnlyStyleClassesChange] = data;
                const oldTree = this.prevTree;
                this.pushSaveBlockTreeToBackendOpDefProps(theBlockTree, oldTree, blockIsStoredToTreeId, blockId, isOnlyStyleClassesChange);
            } else if (event === 'theBlockTree/cloneItem') {
                const oldTree = this.prevTree;
                const [clonedInf, _clonedFromInf] = data; // [SpawnDescriptor, BlockDescriptor]
                const cloned = clonedInf.block;
                this.pushSaveBlockTreeToBackendOp(theBlockTree, oldTree, cloned.isStoredToTreeId, null);
            } else if (event === 'theBlockTree/convertToGbt') {
                // Push 1.
                const [originalBlockId, idForTheNewBlock, newGbtWithoutBlocks] = data;
                const newGbtRef = blockTreeUtils.findBlock(idForTheNewBlock, theBlockTree)[0];
                const dt = {id: newGbtWithoutBlocks.id, name: newGbtWithoutBlocks.name,
                                blocks: treeToTransferable(newGbtRef.__globalBlockTree.blocks)};
                store.dispatch(pushItemToOpQueue('convert-block-to-global', {
                    doHandle: () => http.post('/api/global-block-trees', dt).then(resp => {
                        if (resp.ok !== 'ok') throw new Error('-');
                    }),
                    doUndo: () => {
                        // do nothing
                    },
                    args: [],
                }));

                // Push 2.
                const oldTree = this.prevTree;
                this.pushSaveBlockTreeToBackendOp(theBlockTree, oldTree, 'main', originalBlockId, true, () => {
                    setTimeout(() => {
                        // Remove 1. op from the queue
                        api.saveButton.triggerUndo();
                    }, 100);
                });
            }
        }),
        observeStore2('reusableBranches', (_state, [event, data]) => {
            if (event === 'reusableBranches/addItem') {
                const [newReusableBranch, associatedBlockId] = data;
                const postData = {...newReusableBranch};
                const {id} = newReusableBranch;
                store.dispatch(pushItemToOpQueue('create-reusable-branch', {
                    doHandle: () => http.post('/api/reusable-branches', postData).then(resp => {
                        if (resp.ok !== 'ok') throw new Error('-');
                    }),
                    doUndo: () => {
                        store2.dispatch('reusableBranches/removeItem', [id]);
                        // the title of this block was changed just before emitting reusableBranches/addItem, undo it also
                        if (associatedBlockId) setTimeout(() => { api.saveButton.triggerUndo(); }, 100);
                    },
                    args: [],
                }));
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
     * @param {Array<RawBlock>} theBlockTree
     * @param {Array<RawBlock>} oldTree
     * @param {String} blockIsStoredToTreeId
     * @param {String|null} updateOfBlockId
     * @param {Boolean} isUndoOfConvertToGlobal = false
     * @param {() => any} onUndo = null
     * @access private
     */
    pushSaveBlockTreeToBackendOp(theBlockTree, oldTree, blockIsStoredToTreeId, updateOfBlockId, isUndoOfConvertToGlobal = false, onUndo = null) {
        const rootOrInnerTree = blockTreeUtils.getRootFor(blockIsStoredToTreeId, theBlockTree);
        if (updateOfBlockId) signals.emit('op-queue-before-push-item', updateOfBlockId);
        store.dispatch(pushItemToOpQueue(`update-block-tree##${blockIsStoredToTreeId}`, {
            doHandle: () => saveExistingBlocksToBackend(rootOrInnerTree, blockIsStoredToTreeId),
            doUndo: () => {
                store2.dispatch('theBlockTree/undo', [oldTree, updateOfBlockId, blockIsStoredToTreeId,
                                                        isUndoOfConvertToGlobal]);
                this.setPrevBlockTree(oldTree);
                if (onUndo) onUndo();
            },
            args: [],
        }));
        this.setPrevBlockTree(theBlockTree);
    }
    /**
     * @param {Array<RawBlock>} theBlockTree
     * @param {Array<RawBlock>} oldTree
     * @param {String} blockIsStoredToTreeId
     * @param {String|null} updateOfBlockId
     * @param {Boolean} isOnlyStyleClassesChange
     * @access private
     */
    pushSaveBlockTreeToBackendOpDefProps(theBlockTree, oldTree, blockIsStoredToTreeId, updateOfBlockId, isOnlyStyleClassesChange) {
        const rootOrInnerTree = blockTreeUtils.getRootFor(blockIsStoredToTreeId, theBlockTree);
        store.dispatch(pushItemToOpQueue(`update-block-tree##${blockIsStoredToTreeId}`, {
            doHandle: () => saveExistingBlocksToBackend(rootOrInnerTree, blockIsStoredToTreeId),
            doUndo: () => {
                store2.dispatch('theBlockTree/undoUpdateDefPropsOf', [oldTree, updateOfBlockId, blockIsStoredToTreeId, isOnlyStyleClassesChange]);
                this.setPrevBlockTree(oldTree);
            },
            args: [],
        }));
        this.setPrevBlockTree(theBlockTree);
    }
    /**
     * @param {Array<RawBlock>} tree1
     * @param {String} tree1Id
     * @param {Array<RawBlock>} tree2
     * @param {String} tree2Id
     * @access private
     */
    pushDoubleSaveOps(tree1, tree1Id, tree2, tree2Id) {
        // Push 1.
        store.dispatch(pushItemToOpQueue(`update-block-tree##${tree1Id}`, {
            doHandle: () => saveExistingBlocksToBackend(tree1, tree1Id),
            doUndo: () => {
                // do nothing
            },
            args: [],
        }));

        // Push 2.
        const oldTree = this.prevTree;
        this.pushSaveBlockTreeToBackendOp(tree2, oldTree, tree2Id, null, undefined, () => {
            setTimeout(() => {
                // Remove 1. op from the queue
                api.saveButton.triggerUndo();
            }, 100);
        });
    }
    /**
     * @param {Array<RawBlock>} theBlockTree
     * @access private
     */
    setPrevBlockTree(theBlockTree) {
        this.prevTree = theBlockTree;
    }
}

const singleton = new OpQueueItemEmitter;

export default singleton;
