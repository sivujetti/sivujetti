import blockTreeUtils from './blockTreeUtils.js';
import store, {createSelectBlockTree} from './store.js';
import {findRefBlockOf, isTreesOutermostBlock} from './Block/utils.js';

class BlockTreeDragDrop {
    // blockTree;
    // onDropped;
    // startEl;
    // dragOriginIsExternal;
    // startElChildUl;
    // startElParentUl;
    // startElDropGroup;
    // curDropTypeCandidate;
    // startLiDivRect;
    // dragEventReceiver;
    // externalElData;
    /**
     * @param {BlockTree} blockTree
     * @param {(mutationInfos: [SwapChangeEventData, SwapChangeEventData|null]) => void} onDropped
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
            this.externalElData = this.dragEventReceiver.draggedOverFirstTime(blockTreeUtils.findBlock(li.getAttribute('data-block-id'),
                createSelectBlockTree(li.getAttribute('data-trid'))(store.getState()).tree)[0]);
            return;
        }
        //
        const rect = div.getBoundingClientRect();
        const distance = this.getDistance(rect);
        if (!this.dragOriginIsExternal) {
        if (distance === 0 && this.curDropTypeCandidate.el === li)
            return;
        if (distance > 0 && this.startElChildUl && this.startElChildUl.contains(li))
            return;
        }
        // Enable handleDraggableDropped (developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations#specifying_drop_targets)
        e.preventDefault();
        //
        const newCandidate = {dropPosition: null, dragDirection: null, el: li};
        const edge = 10;
        //
        if (distance !== 0 || this.dragOriginIsExternal) {
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
        newCandidate.el.classList.add(`maybe-drop-${newCandidate.dropPosition}`);
        if (this.dragOriginIsExternal && newCandidate.dropPosition !== this.curDropTypeCandidate.dropPosition) {
            const mutationInfos = this.applySwap(newCandidate, this.externalElData);
            if (mutationInfos) this.dragEventReceiver.swappedBlocks(mutationInfos);
        }
        this.curDropTypeCandidate = newCandidate;
    }
    /**
     * @access public
     */
    handleDraggableDropped() {
        if (!this.curDropTypeCandidate) return;
        //
        const mutationInfos = this.applySwap(this.curDropTypeCandidate);
        if (mutationInfos) this.onDropped(...mutationInfos);
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
        if (!receiver && this.startEl)
            this.endDrag();
        this.dragEventReceiver = receiver;
    }
    /**
     * @param {HTMLLIElement} li
     * @param {Boolean} isExternal
     * @access private
     */
    beginDrag(li, isExternal) {
        this.startEl = li;
        this.dragOriginIsExternal = isExternal;
        this.startElChildUl = this.startEl.classList.contains('with-children') ? this.startEl.querySelector('ul') : null;
        this.startElParentUl = this.startEl.parentElement;
        this.startElDropGroup = this.startEl.getAttribute('data-drop-group');
        this.startLiDivRect = this.startEl.querySelector('.d-flex').getBoundingClientRect();
        this.curDropTypeCandidate = {dropPosition: 'self', dragDirection: null, el: null};
    }
    /**
     * @param {{blockId: String; trid: String;}} externalElData = {}
     * @returns {[SwapChangeEventData, SwapChangeEventData|null]}
     * @access private
     */
    applySwap(dropInfo, {blockId, trid} = {}) {
        let dragBlockTree, dragBlock, dragBranch;
        dragBlockTree = createSelectBlockTree(trid || this.startEl.getAttribute('data-trid'))(store.getState()).tree;
        blockId = blockId || this.startEl.getAttribute('data-block-id');
        [dragBlock, dragBranch] = blockTreeUtils.findBlock(blockId, dragBlockTree);
        if (dragBlock.isStoredToTreeId !== 'main' && isTreesOutermostBlock(blockId, dragBlockTree)) {
            dragBlockTree = createSelectBlockTree('main')(store.getState()).tree;
            const blockId2 = findRefBlockOf(dragBlock, dragBlockTree).id;
            [dragBlock, dragBranch] = blockTreeUtils.findBlock(blockId2, dragBlockTree);
        }
        let dropBlockTree, dropBlock, dropBranch, dropBlockParent;
        const {el} = dropInfo;
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
        //
        let mut1 = null;
        let mut2 = null;
        const isBefore = dropInfo.dropPosition === 'before';
        if (isBefore || dropInfo.dropPosition === 'after') {
            if (dragBranch === dropBranch) {
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
        } else if (dropInfo.dropPosition === 'as-child') {
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
        } else return null;
        return [mut1, mut2];
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
 * @returns {SwapChangeEventData}
 */
function createMutationInfo(dragBlock, dropBlock, dragBlockTree, doRevert, isBefore) {
    isBefore=true;
    return {
        trid: dragBlock.isStoredToTreeId,
        blockA: isBefore ? dragBlock : dropBlock,
        blockB: isBefore ? dropBlock : dragBlock,
        tree: dragBlockTree,
        doRevert,
    };
}

export default BlockTreeDragDrop;
