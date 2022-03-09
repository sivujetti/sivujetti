import blockTreeUtils from './blockTreeUtils.js';

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
                // Disallow 'after + :last-child' -drops outside the tree
                if (newCandidate.dropPosition === 'after' && distance !== 0 &&
                    li.parentElement !== this.startElParentUl &&
                    li.parentElement.lastElementChild === li)
                    return;
            } else if (e.clientY > rect.top + edge) {
                newCandidate.dropPosition = 'as-child';
            } else { // if (e.clientY > rect.top) {
                newCandidate.dropPosition = distance !== 1 ? 'before' : 'as-child';
            }
        } else {
            newCandidate.dropPosition = 'self';
        }
        //
        if (newCandidate.dropPosition === this.curDropTypeCandidate.dropPosition &&
            newCandidate.el === this.curDropTypeCandidate.el) return;
        // Disallow child > parent drops
        if (newCandidate.dropPosition === 'as-child' && newCandidate.el.classList.contains('with-children') &&
            this.startElParentUl === newCandidate.el.querySelector('ul'))
            return;
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
        const dragTreeId = this.startEl.getAttribute('data-block-tree-id');
        const dragBlockTree = dragTreeId === '' ? this.blockTree.state.blockTree : this.blockTree.getGlobalTrees().get(dragTreeId);
        const [dragBlock, dragBranch] = blockTreeUtils.findBlock(
            this.startEl.getAttribute('data-base-block-id') ||
            this.startEl.getAttribute('data-block-id'),
            dragBlockTree
        );
        const dropTreeId = this.curDropTypeCandidate.el.getAttribute('data-block-tree-id');
        const dropBlockTree = dropTreeId === '' ? this.blockTree.state.blockTree : this.blockTree.getGlobalTrees().get(dropTreeId);
        const [dropBlock, dropBranch] = blockTreeUtils.findBlock(
            this.curDropTypeCandidate.el.getAttribute('data-base-block-id') ||
            this.curDropTypeCandidate.el.getAttribute('data-block-id'),
            dropBlockTree
        );
        if (dragBranch !== dropBranch && this.curDropTypeCandidate.dropPosition !== 'as-child') {
            this.curDropTypeCandidate = null;
            alert('Swap between arrays not implemented yet, please reload page');
            return;
        }
        const dragBlockBranchBefore = dragBranch.slice(0);
        //
        const isBefore = this.curDropTypeCandidate.dropPosition === 'before';
        if (isBefore || this.curDropTypeCandidate.dropPosition === 'after') {
            const refIndex = dragBranch.indexOf(dropBlock);
            const fromIndex = dragBranch.indexOf(dragBlock);
            // Mutates (this.blockTree.state.blockTree || globalBlockTrees.someTree) x 2
            dragBranch.splice(refIndex + (!isBefore ? 1 : 0), 0, dragBlock);
            dragBranch.splice(fromIndex + (fromIndex > refIndex ? 1 : 0), 1);
        } else if (this.curDropTypeCandidate.dropPosition === 'as-child') {
            if (dropBlock.type === 'GlobalBlockReference') {
                this.curDropTypeCandidate = null;
                this.clearDragEl();
                alert('Normal > Global drop not implemented yet');
                return;
            }
            // Mutates (this.blockTree.state.blockTree || globalBlockTrees.someTree) x 3
            dragBlock.parentBlockIdPath = `${dropBlock.parentBlockIdPath}/${dropBlock.id}`; // todo verify this
            dropBlock.children.push(dragBlock);
            dragBranch.splice(dragBranch.indexOf(dragBlock), 1);
        }
        this.onDropped(this.blockTree.state.blockTree, dragBlock, dropBlock, {
            dropPosition: this.curDropTypeCandidate.dropPosition,
            dragBlockBranchBefore,
        });
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
}

export default BlockTreeDragDrop;
