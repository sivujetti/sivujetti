import blockTreeUtils from './blockTreeUtils.js';

class BlockTreeDradDrop {
    // blockTree;
    // onDropped;
    // startEl;
    // startLiIndex;
    // curDropTypeCandiate;
    // distance;
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
        this.curDropTypeCandiate = {dropPosition: null, liEl: null};
    }
    /**
     * @param {DragEvent} e
     * @access public
     */
    handleDraggedOver(e) {
        let li = e.target;
        if (li.nodeName !== 'LI') li = e.target.closest('li');
        //
        if (!li || li.getAttribute('data-drop-group') !== '1')
            return;
        //
        const distance = this.getLiIndex(li) - this.startLiIndex;
        if (distance === 0 && this.distance === 0) return;
        // Enable handleDraggableDropped (developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations#drop)
        e.preventDefault();
        this.distance = distance; // ??
        //
        let newCandiate = {dropPosition: null, liEl: null};
        if (distance < 0) {
            newCandiate.dropPosition = 'before';
            newCandiate.liEl = li;
        } else if (distance > 0) {
            newCandiate.dropPosition = 'after';
            newCandiate.liEl = li;
        }
        //
        if (!newCandiate.dropPosition ||
            (this.curDropTypeCandiate.dropPosition === newCandiate.dropPosition &&
            this.curDropTypeCandiate.liEl === newCandiate.liEl)) return;
        //
        if (newCandiate.dropPosition === 'before' && e.clientY < this.getCenter(newCandiate.liEl) ||
            newCandiate.dropPosition === 'after' && e.clientY > this.getCenter(newCandiate.liEl)) {
            if (this.curDropTypeCandiate.liEl) {
                this.clearPreviousDroppableBorder(this.curDropTypeCandiate);
            }
            newCandiate.liEl.classList.add(`maybe-drop-${newCandiate.dropPosition}`);
            this.curDropTypeCandiate = newCandiate;
        }
    }
    /**
     * @access public
     */
    handleDraggableDropped() {

        if (!this.curDropTypeCandiate) return;

        const [dragBlock, branchA] = blockTreeUtils.findBlock(this.startEl.getAttribute('data-fos'), this.blockTree.state.blockTree);
        const [dropBlock, branchB] = blockTreeUtils.findBlock(this.curDropTypeCandiate.liEl.getAttribute('data-fos'), this.blockTree.state.blockTree);

        if (branchA.liEl !== branchB.liEl)
            throw new Error('Swap between arrays not implemented yet');

        let s = null;

        if (this.curDropTypeCandiate.dropPosition === 'before') {
            const refIndex = branchA.indexOf(dropBlock);
            const fromIndex = branchA.indexOf(dragBlock);
            // Mutates this.blockTree.state.blockTree
            branchA.splice(refIndex, 0, dragBlock);
            branchA.splice(fromIndex + 1, 1);
            s = this.blockTree.state.blockTree;
        }

        this.curDropTypeCandiate.liEl.classList.remove('maybe-drop-before'); // todo lookupMap
        this.curDropTypeCandiate.liEl.classList.remove('maybe-drop-after');

        if (s) {
            this.onDropped(s, dragBlock, dropBlock, this.curDropTypeCandiate.dropPosition);
        }

        this.curDropTypeCandiate = null;
    }
    /**
     * https://stackoverflow.com/a/23528539
     * @access private
     */
    getLiIndex(liEl) {
        return Array.prototype.indexOf.call(liEl.parentElement.children, liEl);
    }
    /**
     * @access private
     */
    getCenter(el) {
        const r = el.getBoundingClientRect();
        return r.top + r.height / 2;
    }
    /**
     * @param {{dropPosition: 'before'|'after'; liEl: HTMLLIElement;}} previousDropCandidate
     * @access private
     */
    clearPreviousDroppableBorder(previousDropCandidate) {
        previousDropCandidate.liEl.classList.remove(`maybe-drop-${previousDropCandidate.dropPosition}`); // todo lookupMap
    }
}

export default BlockTreeDradDrop;
