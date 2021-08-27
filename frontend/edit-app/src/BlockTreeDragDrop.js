import blockTreeUtils from './blockTreeUtils.js';

class BlockTreeDradDrop {
    // blockTree;
    // onDropped;
    // startEl;
    // startLiIndex;
    // curDropTypeCandidate;
    /**
     * @param {BlockTree} blockTree
     * @param {(mutatedBlockTree: Array<Block>, dragBlock: Block, dropBlock: Block, dropPosition: 'before'|'after'|'as-child') => void} onDropped
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
        this.startEl.classList.add('dragging');
        this.startLiIndex = this.getLiIndex(this.startEl);
        this.curDropTypeCandidate = {dropPosition: 'self', dragDirection: null, el: null};
    }
    /**
     * @param {DragEvent} e
     * @access public
     */
    handleDraggedOver(e) {
        const li = e.target.nodeName === 'LI' ? e.target : e.target.closest('li');
        if (!li || li.getAttribute('data-drop-group') !== '1')
            return;
        // Enable handleDraggableDropped (developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations#drop)
        e.preventDefault();
        //
        const distance = this.getLiIndex(li) - this.startLiIndex;
        if (distance === 0 && this.curDropTypeCandidate.el === li)
            return;
        //
        const newCandidate = {dropPosition: null, dragDirection: null, el: li};
        const edge = 10;
        const rect = newCandidate.el.getBoundingClientRect();
        //
        if (distance !== 0) {
            /*
                       ___________________________
                  /   |            10             |  <- First if
                 |    | ------------------------- |
                /     .                           .
            30 -      |            20             |  <- Second if
                \     .                           .
                 |    | _________________________ |
                  \   |            10             | <- Last if
                      `---------------------------`
            */
            if (e.clientY < rect.top + edge) {
                newCandidate.dropPosition = distance !== 1 ? 'before' : 'as-child';
            } else if (e.clientY > rect.top + edge && e.clientY < rect.top + rect.height - edge) {
                newCandidate.dropPosition = 'as-child';
            } else if (e.clientY > this.getCenter(rect)) {
                newCandidate.dropPosition = distance !== -1 ? 'after' : 'as-child';
            }
        } else {
            newCandidate.dropPosition = 'self';
        }
        //
        if (newCandidate.dropPosition === this.curDropTypeCandidate.dropPosition &&
            newCandidate.el === this.curDropTypeCandidate.el) return;
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
        const [dragBlock, dragBranch] = blockTreeUtils.findBlock(this.startEl.getAttribute('data-block-id'),
                                                                 this.blockTree.state.blockTree);
        const [dropBlock, dropBranch] = blockTreeUtils.findBlock(this.curDropTypeCandidate.el.getAttribute('data-block-id'),
                                                                 this.blockTree.state.blockTree);
        if (dragBranch !== dropBranch) {
            this.curDropTypeCandidate = null;
            alert('Swap between arrays not implemented yet');
            return;
        }
        //
        const isBefore = this.curDropTypeCandidate.dropPosition === 'before';
        if (isBefore || this.curDropTypeCandidate.dropPosition === 'after') {
            const refIndex = dragBranch.indexOf(dropBlock);
            const fromIndex = dragBranch.indexOf(dragBlock);
            // Mutates this.blockTree.state.blockTree x 2
            dragBranch.splice(refIndex + (!isBefore ? 1 : 0), 0, dragBlock);
            dragBranch.splice(fromIndex + (isBefore ? 1 : 0), 1);
            this.onDropped(this.blockTree.state.blockTree, dragBlock, dropBlock, this.curDropTypeCandidate.dropPosition);
        } else if (this.curDropTypeCandidate.dropPosition === 'as-child') {
            // Mutates this.blockTree.state.blockTree x 3
            dragBlock.parentBlockIdPath = `${dropBlock.parentBlockIdPath}/${dropBlock.id}`; // todo verify this
            dropBlock.children.push(dragBlock);
            dragBranch.splice(dragBranch.indexOf(dragBlock), 1);
            this.onDropped(this.blockTree.state.blockTree, dragBlock, dropBlock, this.curDropTypeCandidate.dropPosition);
        }
        this.clearPreviousDroppableBorder(this.curDropTypeCandidate);
        this.startEl.classList.remove('dragging');
        this.curDropTypeCandidate = null;
    }
    /**
     * https://stackoverflow.com/a/23528539
     * @param {HTMLElement} el
     * @access private
     */
    getLiIndex(el) {
        return Array.prototype.indexOf.call(el.parentElement.children, el);
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
}

export default BlockTreeDradDrop;