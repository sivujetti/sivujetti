import blockTreeUtils, {isGlobalBlockTreeRefOrPartOfOne} from './blockTreeUtils.js';
import store, {createSelectBlockTree} from './store.js';
import {findRefBlockOf, isTreesOutermostBlock} from './Block/utils.js';

class BlockTreeDragDrop {
    // blockTree;
    // onDropped;
    // startEl;
    // startElIsExternal;
    // startElChildUl;
    // startElParentUl;
    // startElDropGroup;
    // curDropTypeCandidate;
    // startLiDivRect;
    // dragEventReceiver;
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
        this.beginDrag(e.target, false);
        this.startEl.classList.add('dragging');
    }
    /**
     * @param {DragEvent} e
     * @access public
     */
    handleDraggedOver(e) {
        if (!this.startEl && !this.dragEventReceiver)
            return;
        const li = e.target.nodeName === 'LI' ? e.target : e.target.closest('li');
        if (!li)
            return;
        const div = li.querySelector('.d-flex');
        if (!div)
            return;
        if (this.dragEventReceiver && !this.startEl) {
            this.beginDrag(li, true);
            this.dragEventReceiver.draggedOverFirstTime(li);
            return;
        }
        //
        const rect = div.getBoundingClientRect();
        const distance = this.getDistance(rect);
        if (!this.startElIsExternal) {
        if (distance === 0 && this.curDropTypeCandidate.el === li)
            return;
        if (distance > 0 && this.startElChildUl && this.startElChildUl.contains(li))
            return;
        }
        // Enable handleDraggableDropped (developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations#specifying_drop_targets)
        e.preventDefault();
        //
        const newCandidate = {dropPosition: null, dragDirection: null, el: li};
        //
        if (distance !== 0) {
            newCandidate.dropPosition = determinePosition(e.clientY, rect, distance);
        } else if (!this.startElIsExternal) {
            newCandidate.dropPosition = 'self';
        } else {
            newCandidate.dropPosition = determinePosition(e.clientY, rect, distance);
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
        newCandidate.el.classList.add(`maybe-drop-${newCandidate.dropPosition}`);
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
        const blockId = this.startEl.getAttribute('data-block-id');
        [dragBlock, dragBranch] = blockTreeUtils.findBlock(blockId, dragBlockTree);
        if (dragBlock.isStoredToTreeId !== 'main' && isTreesOutermostBlock(blockId, dragBlockTree)) {
            dragBlockTree = createSelectBlockTree('main')(store.getState()).tree;
            const blockId2 = findRefBlockOf(dragBlock, dragBlockTree).id;
            [dragBlock, dragBranch] = blockTreeUtils.findBlock(blockId2, dragBlockTree);
        }
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
        const {el} = this.curDropTypeCandidate;
        dropBlockTree = createSelectBlockTree(el.getAttribute('data-trid'))(store.getState()).tree;
        if (!el.getAttribute('data-last')) {
            const blockId = el.getAttribute('data-block-id');
            [dropBlock, dropBranch, dropBlockParent] = blockTreeUtils.findBlock(blockId, dropBlockTree);
            if (dropBlock.isStoredToTreeId !== 'main' && isTreesOutermostBlock(blockId, dropBlockTree)) {
                dropBlockTree = createSelectBlockTree('main')(store.getState()).tree;
                const blockId2 = findRefBlockOf(dropBlock, dropBlockTree).id;
                [dropBlock, dropBranch, dropBlockParent] = blockTreeUtils.findBlock(blockId2, dropBlockTree);
            }
        } else {
            [dropBlock, dropBranch, dropBlockParent] = [
                dropBlockTree[dropBlockTree.length - 1],
                dropBlockTree,
                null,
            ];
        }
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
                dragBranch.splice(realTo, 0, dragBlock);
                dragBranch.splice(fromIndex + (fromIndex > realTo ? 1 : 0), 1);
                //
                mut1 = createMutationInfo(dragBlock, dropBlock, dragBlockTree, () => {
                    dragBranch.splice(fromIndex + (fromIndex > realTo ? 1 : 0), 0, dragBlock);
                    dragBranch.splice(realTo, 1);
                    return dragBlockTree;
                }, isBefore);
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
                const aIsNorm = dragBlock.isStoredToTreeId === 'main';
                const bIsNorm = dropBlock.isStoredToTreeId === 'main';
                if (aIsNorm && !bIsNorm && dropBlock.id !== dropBlockTree[0].id) {
                    this.handleDropNotAllowed('Normal > Global drop not supported yet');
                    return;
                } else if (bIsNorm && !aIsNorm && dragBlock.id !== dragBlockTree[0].id) {
                    this.handleDropNotAllowed('Global > Normal drop not supported yet');
                    return;
                }
                //
                const dragBranchIdx = dragBranch.indexOf(dragBlock);
                const dropBranchIdx = dropBranch.indexOf(dropBlock);
                const pos = dropBranchIdx + (isBefore ? 0 : 1);
                dropBranch.splice(pos, 0, dragBlock);
                dragBranch.splice(dragBranchIdx, 1);
                //
                mut1 = createMutationInfo(dragBlock, dropBlock, dragBlockTree, () => {
                    dragBranch.splice(dragBranchIdx, 0, dragBlock);
                    dropBranch.splice(pos, 1);
                    return dragBlockTree;
                }, isBefore);
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
            if (dropBlock.type === 'GlobalBlockReference' || dropBlock.isStoredTo === 'globalBlockTree') {
                this.handleDropNotAllowed('Global > Normal drop not supported yet');
                return;
            } else if (dragBlock.isStoredToTreeId !== 'main' && dropBlock.isStoredToTreeId === 'main') {
                this.handleDropNotAllowed('Global > Normal (as child) drop not supported yet');
                return;
            }
            dropBlock.children.push(dragBlock);
            const pos = dragBranch.indexOf(dragBlock);
            dragBranch.splice(pos, 1);
            //
            mut1 = createMutationInfo(dragBlock, dropBlock, dragBlockTree, () => {
                dropBlock.children.pop();
                dragBranch.splice(pos, 0, dragBlock);
                return dragBlockTree;
            }, true);
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
        this.endDrag();
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
     * @param {DragEventReceiver|null} receiver
     * @access public
     */
    setDragEventReceiver(receiver) {
        if (!receiver && this.startEl) {
            this.endDrag();
        }
        this.dragEventReceiver = receiver;
    }
    /**
     * @param {HTMLLIElement} li
     * @param {Boolean} isExternal
     * @access private
     */
    beginDrag(li, isExternal) {
        this.startEl = li;
        this.startElIsExternal = isExternal;
        this.startElChildUl = this.startEl.classList.contains('with-children') ? this.startEl.querySelector('ul') : null;
        this.startElParentUl = this.startEl.parentElement;
        this.startElDropGroup = this.startEl.getAttribute('data-drop-group');
        this.startLiDivRect = this.startEl.querySelector('.d-flex').getBoundingClientRect();
        this.curDropTypeCandidate = {dropPosition: 'self', dragDirection: null, el: null};
    }
    /**
     * @access private
     */
    endDrag() {
        this.clearPreviousDroppableBorder(this.curDropTypeCandidate);
        this.curDropTypeCandidate = null;
        this.clearDragEl();
    }
    /**
     * @param {DOMRect} toRect
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
        this.endDrag();
        alert(message);
    }
}

/**
 * @param {RawBlock2} dragBlock
 * @param {RawBlock2} dropBlock
 * @param {Array<RawBlock2>} dragBlockTree
 * @param {() => Array<RawBlock2>} doRevert
 * @param {Boolean} isBefore
 */
function createMutationInfo(dragBlock, dropBlock, dragBlockTree, doRevert, isBefore) {
    return {
        trid: dragBlock.isStoredToTreeId,
        blockA: isBefore ? dragBlock : dropBlock,
        blockB: isBefore ? dropBlock : dragBlock,
        tree: dragBlockTree,
        doRevert,
    };
}

/**
 * @param {Number} mousePos
 * @param {DOMRect} rect
 * @param {Number} distance
 * @param {Number} edgeMargin = 10
 * @returns {'before'|'after'|'as-child'}
 */
function determinePosition(mousePos, rect, distance, edgeMargin = 10) {
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
    if (mousePos > rect.top + rect.height - edgeMargin)
        return distance !== -1 ? 'after' : 'as-child';
    if (mousePos > rect.top + edgeMargin)
        return 'as-child';
    return distance !== 1 ? 'before' : 'as-child';
}

export default BlockTreeDragDrop;
