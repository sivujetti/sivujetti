import blockTreeUtils, {isGlobalBlockTreeRefOrPartOfOne} from './blockTreeUtils.js';
import store, {createSelectBlockTree} from './store.js';

class BlockTreeDragDrop {
    // blockTree;
    // onDropped;
    // startEl;
    // startElChildUl;
    // startElParentUl;
    // startElDropGroup;
    // curDropTypeCandidate;
    // startLiDivRect;
    /**
     * @param {BlockTree} blockTree
     * @param {(mutatedBlockTree: Array<Block>, dragBlock: Block, dropBlock: Block, dropInfo: {dropPosition: 'before'|'after'|'as-child'; dragBlockBranchBefore: Array<Block>;}) => void} onDropped
     */
    constructor(blockTree, onDropped) {
        this.blockTree = blockTree;
        this.onDropped = onDropped;
    }
    /**
     * @param {DragEvent} e
     * @access public
     */
    handleDragStarted(e) {
        this.startEl = e.target;
        this.startElChildUl = this.startEl.classList.contains('with-children') ? this.startEl.querySelector('ul') : null;
        this.startElParentUl = this.startEl.parentElement;
        this.startElDropGroup = this.startEl.getAttribute('data-drop-group');
        this.startEl.classList.add('dragging');
        this.startLiDivRect = this.startEl.querySelector('.d-flex').getBoundingClientRect();
        this.curDropTypeCandidate = {dropPosition: 'self', dragDirection: null, el: null};
    }
    /**
     * @param {DragEvent} e
     * @access public
     */
    handleDraggedOver(e) {
        if (!this.startEl)
            return;
        const li = e.target.nodeName === 'LI' ? e.target : e.target.closest('li');
        if (!li)
            return;
        const div = li.querySelector('.d-flex');
        if (!div)
            return;
        //
        const rect = div.getBoundingClientRect();
        const distance = this.getDistance(rect);
        if (distance === 0 && this.curDropTypeCandidate.el === li)
            return;
        if (distance > 0 && this.startElChildUl && this.startElChildUl.contains(li))
            return;
        // Enable handleDraggableDropped (developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations#specifying_drop_targets)
        e.preventDefault();
        //
        const newCandidate = {dropPosition: null, dragDirection: null, el: li};
        const edge = 10;
        //
        if (distance !== 0) {
            /*
                       ___________________________
                  /   |            10             |  <- Last if
                 |    | ------------------------- |
                /     .                           .
            30 -      |            20             |  <- Second if
                \     .                           .
                 |    | _________________________ |
                  \   |            10             | <- First if
                      `---------------------------`
            */
            if (e.clientY > rect.top + rect.height - edge) {
                newCandidate.dropPosition = distance !== -1 ? 'after' : 'as-child';
            } else if (e.clientY > rect.top + edge) {
                newCandidate.dropPosition = 'as-child';
            } else { // if (e.clientY > rect.top) {
                newCandidate.dropPosition = distance !== 1 ? 'before' : 'as-child';
            }
        } else {
            newCandidate.dropPosition = 'self';
        }
        //
        const {el} = newCandidate;
        if (!el.getAttribute('data-last')) {
            if (newCandidate.dropPosition === this.curDropTypeCandidate.dropPosition &&
                el === this.curDropTypeCandidate.el) return;
            // Disallow no-move
            if (this.startElChildUl && (newCandidate.dropPosition === 'before' &&
                el === this.startEl.nextElementSibling) ||
                (newCandidate.dropPosition === 'after' &&
                el === this.startEl.previousElementSibling))
                return;
            // Disallow child > parent drops
            if (newCandidate.dropPosition === 'as-child' && el.classList.contains('with-children') &&
                this.startElParentUl === el.querySelector('ul'))
                return;
        } else {
            newCandidate.dropPosition = 'after';
            newCandidate.el = newCandidate.el.previousElementSibling;
         }
        //
        if (this.curDropTypeCandidate.el && this.curDropTypeCandidate.dropPosition !== 'self') {
            this.clearPreviousDroppableBorder(this.curDropTypeCandidate);
        }
        if (newCandidate.dropPosition !== 'self') {
            newCandidate.el.classList.add(`maybe-drop-${newCandidate.dropPosition}`);
        }
        this.curDropTypeCandidate = newCandidate;
    }
    /**
     * @access public
     */
    handleDraggableDropped() {
        if (!this.curDropTypeCandidate) return;
        //
        let dragBlockTree, dragBlock, dragBranch;
        if (!window.useReduxBlockTree) { // @featureFlagConditionUseReduxBlockTree
        const dragTreeId = this.startEl.getAttribute('data-block-tree-id');
        dragBlockTree = !dragTreeId ? this.blockTree.state.blockTree : this.blockTree.getGlobalTrees().get(dragTreeId);
        [dragBlock, dragBranch] = blockTreeUtils.findBlock(
            this.startEl.getAttribute('data-base-block-id') ||
            this.startEl.getAttribute('data-block-id'),
            dragBlockTree
        );
        } else {
        dragBlockTree = createSelectBlockTree(this.startEl.getAttribute('data-trid'))(store.getState()).tree;
        [dragBlock, dragBranch] = blockTreeUtils.findBlock(this.startEl.getAttribute('data-block-id'),
            dragBlockTree);
        }
        let dropBlockTree, dropBlock, dropBranch, dropBlockParent;
        if (!window.useReduxBlockTree) { // @featureFlagConditionUseReduxBlockTree
        const dropTreeId = this.curDropTypeCandidate.el.getAttribute('data-block-tree-id');
        dropBlockTree = !dropTreeId ? this.blockTree.state.blockTree : this.blockTree.getGlobalTrees().get(dropTreeId);
        const {el} = this.curDropTypeCandidate;
        [dropBlock, dropBranch, dropBlockParent] = !el.getAttribute('data-last') ? blockTreeUtils.findBlock(
            el.getAttribute('data-base-block-id') || el.getAttribute('data-block-id'),
            dropBlockTree
        ) : [
            dropBlockTree[dropBlockTree.length - 1],
            dropBlockTree,
            null,
        ];
        } else {
        dropBlockTree = createSelectBlockTree(this.startEl.getAttribute('data-trid'))(store.getState()).tree;
        const {el} = this.curDropTypeCandidate;
        [dropBlock, dropBranch, dropBlockParent] = !el.getAttribute('data-last') ? blockTreeUtils.findBlock(
            el.getAttribute('data-block-id'),
            dropBlockTree
        ) : [
            dropBlockTree[dropBlockTree.length - 1],
            dropBlockTree,
            null,
        ];
        }
        //
        let doRevert = null;
        const isBefore = this.curDropTypeCandidate.dropPosition === 'before';
        const revertInfo = {revertPosition: null, referenceBlock: null};
        if (this.startElParentUl.children.length === 1) {
            revertInfo.revertPosition = 'as-child';
            revertInfo.referenceBlock = dropBlockParent;
        } else {
            const hasBlocksAfter = this.startEl.nextElementSibling;
            revertInfo.revertPosition = hasBlocksAfter ? 'before' : 'after';
            revertInfo.referenceBlock = dragBranch[dragBranch.indexOf(dragBlock) + (hasBlocksAfter ? 1 : -1)];
        }
        //
        let mut1 = null;
        let mut2 = null;
        if (isBefore || this.curDropTypeCandidate.dropPosition === 'after') {
            if (dragBranch === dropBranch) {
                if (!window.useReduxBlockTree) { // @featureFlagConditionUseReduxBlockTree
                const toIdx = dragBranch.indexOf(dropBlock);
                const fromIndex = dragBranch.indexOf(dragBlock);
                const realTo = isBefore ? toIdx : toIdx + 1;
                // Mutates (this.blockTree.state.blockTree || globalBlockTrees.someTree) x 2
                dragBranch.splice(realTo, 0, dragBlock);
                dragBranch.splice(fromIndex + (fromIndex > realTo ? 1 : 0), 1);
                // Mutates (this.blockTree.state.blockTree || globalBlockTrees.someTree) x 2
                doRevert = () => {
                    dragBranch.splice(fromIndex + (fromIndex > realTo ? 1 : 0), 0, dragBlock);
                    dragBranch.splice(realTo, 1);
                    return revertInfo;
                };
                } else {
                const toIdx = dragBranch.indexOf(dropBlock);
                const fromIndex = dragBranch.indexOf(dragBlock);
                const realTo = isBefore ? toIdx : toIdx + 1;
                // Mutates tree x 2
                dragBranch.splice(realTo, 0, dragBlock);
                dragBranch.splice(fromIndex + (fromIndex > realTo ? 1 : 0), 1);
                //
                mut1 = {
                    trid: dragBlock.isStoredToTreeId,
                    dragBlock,
                    dropBlock,
                    tree: dragBlockTree,
                    // Mutates tree x 2
                    doRevert: () => {
                        dragBranch.splice(fromIndex + (fromIndex > realTo ? 1 : 0), 0, dragBlock);
                        dragBranch.splice(realTo, 1);
                        return dragBlockTree;
                    }
                };
                }
            } else {
            if (!window.useReduxBlockTree) { // @featureFlagConditionUseReduxBlockTree
                const a = isGlobalBlockTreeRefOrPartOfOne(dragBlock);
                const b = dropBlock.isStoredTo === 'globalBlockTree';
                if (!a && b) {
                    this.handleDropNotAllowed('Normal > Global drop not supported yet');
                    return;
                } else if ((!b && a) || (a && dropBlock.type === 'GlobalBlockReference' && dropBlock.globalBlockTreeId === dragBlock.globalBlockTreeId)) {
                    this.handleDropNotAllowed('Global > Normal drop not supported yet');
                    return;
                } else if (a && b && dragBlock.globalBlockTreeId !== dropBlock.globalBlockTreeId) {
                    this.handleDropNotAllowed('Drop between global blocks banches supported yet');
                    return;
                }
                const dragBranchIdx = dragBranch.indexOf(dragBlock);
                const dropBranchIdx = dropBranch.indexOf(dropBlock);
                const pos = dropBranchIdx + (isBefore ? 0 : 1);
                // Mutates (this.blockTree.state.blockTree || globalBlockTrees.someTree) x 2
                dropBranch.splice(pos, 0, dragBlock);
                dragBranch.splice(dragBranchIdx, 1);
                // Mutates (this.blockTree.state.blockTree || globalBlockTrees.someTree) x 2
                doRevert = () => {
                    dragBranch.splice(dragBranchIdx, 0, dragBlock);
                    dropBranch.splice(pos, 1);
                    return revertInfo;
                };
            } else {
                if (dragBlock.isStoredToTreeId !== dropBlock.isStoredToTreeId) {
                    this.handleDropNotAllowed('todo');
                    return;
                }
                const dragBranchIdx = dragBranch.indexOf(dragBlock);
                const dropBranchIdx = dropBranch.indexOf(dropBlock);
                const pos = dropBranchIdx + (isBefore ? 0 : 1);
                // Mutates tree x 2
                dropBranch.splice(pos, 0, dragBlock);
                dragBranch.splice(dragBranchIdx, 1);
                //
                mut1 = {
                    trid: dragBlock.isStoredToTreeId,
                    dragBlock,
                    dropBlock,
                    tree: dragBlockTree,
                    // Mutates tree x 2
                    doRevert: () => {
                        dragBranch.splice(dragBranchIdx, 0, dragBlock);
                        dropBranch.splice(pos, 1);
                        return dragBlockTree;
                    }
                };
            }
            }
        } else if (this.curDropTypeCandidate.dropPosition === 'as-child') {
            if (!window.useReduxBlockTree) { // @featureFlagConditionUseReduxBlockTree
            const a = isGlobalBlockTreeRefOrPartOfOne(dropBlock);
            const b = isGlobalBlockTreeRefOrPartOfOne(dragBlock);
            if (a !== b) {
                this.handleDropNotAllowed('Normal > Global drop not supported yet');
                return;
            } else if (a && b && dropBlock.globalBlockTreeId !== dragBlock.globalBlockTreeId) {
                this.handleDropNotAllowed('Nested global blocks not allowed');
                return;
            }
            // Mutates (this.blockTree.state.blockTree || globalBlockTrees.someTree) x 2
            dropBlock.children.push(dragBlock);
            const pos = dragBranch.indexOf(dragBlock);
            dragBranch.splice(pos, 1);
            // Mutates (this.blockTree.state.blockTree || globalBlockTrees.someTree) x 2
            doRevert = () => {
                dropBlock.children.pop();
                dragBranch.splice(pos, 0, dragBlock);
                return revertInfo;
            };
            } else {
            if (dragBlock.isStoredToTreeId !== dropBlock.isStoredToTreeId) {
                this.handleDropNotAllowed('todo');
                return;
            }
            // Mutates tree x 2
            dropBlock.children.push(dragBlock);
            const pos = dragBranch.indexOf(dragBlock);
            dragBranch.splice(pos, 1);
            //
            mut1 = {
                trid: dragBlock.isStoredToTreeId,
                dragBlock,
                dropBlock,
                tree: dragBlockTree,
                // Mutates tree x 2
                doRevert: () => {
                    dropBlock.children.pop();
                    dragBranch.splice(pos, 0, dragBlock);
                    return dragBlockTree;
                }
            };
            }
        } else return;
        if (!window.useReduxBlockTree) { // @featureFlagConditionUseReduxBlockTree
        this.onDropped(this.blockTree.state.blockTree, {
            dragBlock,
            dropBlock,
            dropPosition: this.curDropTypeCandidate.dropPosition,
            doRevert,
        });
        } else {
        this.onDropped(mut1, mut2);
        }
        this.clearPreviousDroppableBorder(this.curDropTypeCandidate);
        this.curDropTypeCandidate = null;
        this.clearDragEl();
    }
    /**
     * @access public
     */
    handleDragEnded() {
        if (!this.startEl) return;
        if (this.curDropTypeCandidate) this.clearPreviousDroppableBorder(this.curDropTypeCandidate);
        this.clearDragEl();
    }
    /**
     * @param {ClientRect} toRect
     * @returns {Number}
     * @access private
     */
    getDistance(toRect) {
        const {top, height} = this.startLiDivRect;
        const diff = toRect.top - top;
        return diff / height;
    }
    /**
     * @param {DOMRect} rect
     * @access private
     */
    getCenter(rect) {
        return rect.top + rect.height / 2;
    }
    /**
     * @param {{dropPosition: 'before'|'after'; dragDirection: 'upwards'|'downwards'|null; el: HTMLElement;}} previousDropCandidate
     * @access private
     */
    clearPreviousDroppableBorder(previousDropCandidate) {
        previousDropCandidate.el.classList.remove(`maybe-drop-${previousDropCandidate.dropPosition}`);
    }
    /**
     * @access private
     */
    clearDragEl() {
        this.startEl.classList.remove('dragging');
        this.startEl = null;
    }
    /**
     * @param {String} message
     * @access private
     */
    handleDropNotAllowed(message) {
        this.clearPreviousDroppableBorder(this.curDropTypeCandidate);
        this.curDropTypeCandidate = null;
        this.clearDragEl();
        alert(message);
    }
}

export default BlockTreeDragDrop;
