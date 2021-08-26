import blockTreeUtils from './blockTreeUtils.js';

class BlockTreeDradDrop {
    // blockTree;
    // onDropped;
    // startEl;
    // startLiIndex;
    // curDropTypeCandidate;
    /**
     * @param {BlockTree} blockTree
     * @param {(mutatedBlockTree: Array<Block>, dragBlock: Block, dropBlock: Block, dropPosition: 'before'|'after') => void} onDropped
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
        this.startLiIndex = this.getLiIndex(this.startEl);
        this.curDropTypeCandidate = {dropPosition: null, el: null};
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
        const newCandidate = {dropPosition: null, el: li};
        if (distance < 0) {
            newCandidate.dropPosition = 'before';
        } else if (distance > 0) {
            newCandidate.dropPosition = 'after';
        } // else dropPosition remains null
        //
        if ((newCandidate.dropPosition === this.curDropTypeCandidate.dropPosition &&
            newCandidate.el === this.curDropTypeCandidate.el)) return;
        //
        const transitToBeforeOrAfter = newCandidate.dropPosition === 'before' && e.clientY < this.getCenter(newCandidate.el) ||
                                       newCandidate.dropPosition === 'after' && e.clientY > this.getCenter(newCandidate.el);
        if (transitToBeforeOrAfter || newCandidate.dropPosition === null) {
            if (this.curDropTypeCandidate.el) {
                this.clearPreviousDroppableBorder(this.curDropTypeCandidate);
            }
            if (transitToBeforeOrAfter) {
                newCandidate.el.classList.add(`maybe-drop-${newCandidate.dropPosition}`);
            }
            this.curDropTypeCandidate = newCandidate;
        }
    }
    /**
     * @access public
     */
    handleDraggableDropped() {
        if (!this.curDropTypeCandidate) return;
        //
        const [dragBlock, branchA] = blockTreeUtils.findBlock(this.startEl.getAttribute('data-block-id'),
                                                              this.blockTree.state.blockTree);
        const [dropBlock, branchB] = blockTreeUtils.findBlock(this.curDropTypeCandidate.el.getAttribute('data-block-id'),
                                                              this.blockTree.state.blockTree);
        if (branchA !== branchB) {
            this.curDropTypeCandidate = null;
            alert('Swap between arrays not implemented yet');
            return;
        }
        //
        const isBefore = this.curDropTypeCandidate.dropPosition === 'before';
        if (isBefore || this.curDropTypeCandidate.dropPosition === 'after') {
            const refIndex = branchA.indexOf(dropBlock);
            const fromIndex = branchA.indexOf(dragBlock);
            // Mutates this.blockTree.state.blockTree
            branchA.splice(refIndex + (!isBefore ? 1 : 0), 0, dragBlock);
            branchA.splice(fromIndex + (isBefore ? 1 : 0), 1);
            this.onDropped(this.blockTree.state.blockTree, dragBlock, dropBlock, this.curDropTypeCandidate.dropPosition);
        }
        this.clearPreviousDroppableBorder(this.curDropTypeCandidate);
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
     * @access private
     */
    getCenter(el) {
        const r = el.getBoundingClientRect();
        return r.top + r.height / 2;
    }
    /**
     * @param {{dropPosition: 'before'|'after'; el: HTMLElement;}} previousDropCandidate
     * @access private
     */
    clearPreviousDroppableBorder(previousDropCandidate) {
        previousDropCandidate.el.classList.remove(`maybe-drop-${previousDropCandidate.dropPosition}`); // todo lookupMap
    }
}

export default BlockTreeDradDrop;
