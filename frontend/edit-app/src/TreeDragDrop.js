const edge = 6;

class TreeDragDrop {
    // ul;
    // ulAsArr;
    // eventController;
    // start;
    // startIdx;
    // startDepth;
    // curCand;
    /**
     * @param { } blockTree
     * @param { } eventController
     */
    constructor(eventController) {
        this.ul = null;
        this.ulAsArr = null;
        this.eventController = eventController;
    }
    attachOrUpdate(ul) {
        this.ul = ul;
        this.ulAsArr = Array.from(ul.children);
    }
    setOrClearExternalDragStart(receiver) {
        if (receiver) {
            this.dragOriginIsExternal = true;
            this.start = 'waiting';
        } else { // ??
            this.dragOriginIsExternal = false;
        }
    }
    /**
     * @param {DragEvent} e
     * @access public
     */
    handleDragStarted(e) {
        if (!this.ul) return;
        this.setStart(norm(e));
    }
    /**
     * @param {DragEvent} e
     * @access public
     */
    handleDraggedOver(e) {
        if (!this.start || e.target.nodeName === 'UL')
            return;
        const li = norm(e);
        if (!li || !li.getAttribute('data-draggable'))
            return;

        // 0. Handle setStart if external el
        if (this.dragOriginIsExternal && this.start === 'waiting') {
            const nextCand = {li, pos: null};
            const rect = li.getBoundingClientRect();
            const isUpperHalf = e.clientY < rect.top + (rect.height * 0.5);
            if (isUpperHalf) nextCand.pos = e.clientY > rect.top + edge ? 'as-child' : 'before';
            else nextCand.pos = e.clientY < rect.bottom - edge ? 'as-child' : 'after';
            this.setStart(li, nextCand.pos);
            // Do 4. manually here
            e.preventDefault();
            nextCand.li.classList.add(`maybe-drop-${nextCand.pos}`);
            this.curCand = nextCand;
            return;
        }

        // 1. Create initial nextCand
        const nextCand = {li, pos: null};
        let applyCls = true;
        let triggerEvent = true;
        let ib = false;
        let ia = false;
        let idx = 0;
        if (li !== this.start || this.dragOriginIsExternal) {
            const rect = li.getBoundingClientRect();
            idx = !this.dragOriginIsExternal ? this.getIdx(li) : li === this.start ? 0 : this.getIdx(li);
            ib = idx < this.startIdx;
            ia = idx > this.startIdx;
            if (ib) {
                // mouse is in upper area
                if (e.clientY < rect.top + edge) {
                    nextCand.pos = 'before';
                // mouse is in the middle area
                } else if (e.clientY < rect.top + rect.height - edge) {
                    nextCand.pos = 'as-child';
                } else {
                    nextCand.pos = 'after';
                }
            } else if (ia) {
                // mouse is in lower area
                if (e.clientY > rect.top + rect.height - edge) {
                    nextCand.pos = 'after';
                // mouse is in the middle area
                } else if (e.clientY > rect.top + edge) {
                    nextCand.pos = 'as-child';
                } else {
                    nextCand.pos = 'before';
                }
            } else nextCand.pos = 'as-child';
        } else {
            nextCand.pos = 'initial';
            applyCls = this.curCand.pos !== 'initial';
        }

        // 2. Do reject tests
        if (this.checkIfDraggingToOwnParent(nextCand, li) ||
            this.checkIfDraggingInsideItself(ia, li, idx) ||
            this.checkIfTooClose(ia, li, idx)) {
            applyCls = false;
            triggerEvent = false;
        }

        // 3. Do replacements
        // -- Replace "after of .has-children" with "before of .has-children:first-child" ---
        if (nextCand.pos === 'after' && li.getAttribute('data-has-children') && !li.classList.contains('collapsed')) {
            nextCand.pos = 'before';
            nextCand.li = li.nextElementSibling;
        }

        // 4. Apply
        if (applyCls) {
            e.preventDefault();
            nextCand.li.classList.add(`maybe-drop-${nextCand.pos}`);
        }
        if (this.curCand && this.curCand.pos !== nextCand.pos)
            this.clearCls();
        if (triggerEvent && this.curCand && this.curCand.pos !== nextCand.pos)
            this.eventController.swap(nextCand, this.curCand);

        this.curCand = nextCand; // May or may not change curCand.pos|li
    }
    /**
     * @access public
     */
    handleDraggableDropped() {
        if (!this.start) return;
        this.clearS();
        this.eventController.drop();
    }
    /**
     * @access public
     */
    handleDragEnded() {
        if (!this.start) return;
        this.clearS();
        this.eventController.end();
    }
    /**
     * @param {HTMLLIElement} li
     * @param {String} pos = 'initial'
     * @access private
     */
    setStart(li, pos = 'initial') {
        this.start = li;
        this.startIdx = this.getIdx(this.start);
        this.startDepth = this.start.getAttribute('data-depth');
        this.curCand = {pos, li: this.start};
        this.eventController.begin(Object.assign({}, this.curCand));
    }
    /**
     * @param {Object} nextCand
     * @param {HTMLLIElement} li
     * @returns {Boolean}
     * @access private
     */
    checkIfDraggingToOwnParent(nextCand, li) {
        return nextCand.pos === 'as-child' && li.getAttribute('data-has-children') &&
            this.start.getAttribute('data-is-children-of') === li.getAttribute('data-block-id');
    }
    /**
     * @param {Number} ia Is target li after this.start
     * @param {HTMLLIElement} li
     * @param {Number} idx Index of target li
     * @returns {Boolean}
     * @access private
     */
    checkIfDraggingInsideItself(ia, li, idx) {
        if (!ia || !this.start.getAttribute('data-has-children') || this.start.classList.contains('collapsed'))
            return false;

        if (li.getAttribute('data-is-children-of') === this.start.getAttribute('data-block-id'))
            return true; // immediate

        if (li.getAttribute('data-depth') > this.startDepth &&
            idx <= this.getIdx(Array.from(this.ul.querySelectorAll(`li[data-is-children-of="${this.start.getAttribute('data-block-id')}"]`)).pop())) {
            for (let i = idx; i > this.startIdx; --i) {
                const li2 = this.ulAsArr[i];
                if (li2.getAttribute('data-is-children-of') === this.start.getAttribute('data-block-id'))
                    return true; // inner-child
            }
        }
    }
    /**
     * @param {Number} ib Is target li before this.start
     * @param {Object} nextCand
     * @param {HTMLLIElement} li
     * @param {Number} ia Is target li after this.start
     * @param {Number} idx Index of target li
     * @returns {Boolean}
     * @access private
     */
    checkIfTooClose(ib, nextCand, li, ia, idx) {
        if (ib && nextCand.pos === 'after') {
            if (li.getAttribute('data-depth') === this.startDepth) { // same level
                let t = false;
                if (!li.getAttribute('data-has-children') && idx - this.startIdx === -1) { // no children in between
                    t = true;
                } else if (this.ulAsArr[this.startIdx - 1]) { // children in between
                    const sameLevel = Array.from(this.ul.querySelectorAll(`[data-depth="${this.startDepth}"]`));
                    const sameLevelTargetIdx = sameLevel.indexOf(li);
                    const sameLevelStartLiIdx = sameLevel.indexOf(this.start);
                    if (sameLevelTargetIdx - sameLevelStartLiIdx === -1) t = true;
                }
                if (t) return true;
            } else if (this.start.getAttribute('data-is-children-of') === li.getAttribute('data-block-id') && idx - this.startIdx === -1) // from inner to outer
                return true;
        }
        if (ia && nextCand.pos === 'before' && li.getAttribute('data-depth') === this.startDepth) {
            if (idx - this.startIdx === 1) return true;
            if (this.ulAsArr[this.startIdx + 1]) { // depth?
                const sameLevel = Array.from(this.ul.querySelectorAll(`[data-depth="${this.startDepth}"]`));
                const sameLevelTargetIdx = sameLevel.indexOf(li);
                const sameLevelStartLiIdx = sameLevel.indexOf(this.start);
                if (sameLevelTargetIdx - sameLevelStartLiIdx === 1) return true;
            }
        }
        return false;
    }
    /**
     * @param {HTMLLIElement} li
     * @returns {Number}
     * @access private
     */
    getIdx(li) {
        return this.ulAsArr.indexOf(li);
    }
    /**
     * @access private
     */
    clearS() {
        this.start = null;
        if (this.curCand) this.clearCls();
        this.curCand = null;
    }
    /**
     * @access private
     */
    clearCls() {
        const {curCand} = this;
        curCand.li.classList.remove(`maybe-drop-${curCand.pos}`);
    }
}

function norm(e) {
    return e.target.nodeName === 'LI' ? e.target : e.target.closest('li');
}

export default TreeDragDrop;
