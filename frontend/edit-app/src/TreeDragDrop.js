const edge = 6;

class TreeDragDrop {
    // ul;
    // ulAsArr;
    // eventController;
    // start;
    // startIdx;
    // startDepth;
    // curCand;
    // dragOriginIsExternal;
    // firstLiBounds;
    /**
     * @param {DragDropEventController} eventController
     */
    constructor(eventController) {
        this.ul = null;
        this.ulAsArr = null;
        this.eventController = eventController;
    }
    /**
     * @param {HTMLUListElement} ul
     * @access public
     */
    attachOrUpdate(ul) {
        this.ul = ul;
        this.ulAsArr = Array.from(ul.children);
    }
    /**
     * @param {DragEvent} e
     * @access public
     */
    handleDragStarted(e) {
        if (!this.ul) return;
        this.setBounds();
        this.setStart(norm(e));
        this.start.classList.add('dragging');
    }
    /**
     * @access public
     */
    setDragStartedFromOutside() {
        if (!this.ul) throw new Error('!this.ul');
        this.setBounds();
        this.start = 'setting-it';
        this.dragOriginIsExternal = true;
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
        if (this.dragOriginIsExternal && this.start === 'setting-it') {
            const nextCand = {li, pos: null};
            const rect = li.getBoundingClientRect();
            const isUpperHalf = e.clientY < rect.top + (rect.height * 0.5);
            if (isUpperHalf) nextCand.pos = e.clientY > rect.top + edge ? 'as-child' : 'before';
            else nextCand.pos = e.clientY < rect.bottom - edge ? 'as-child' : 'after';
            const doAccept = this.eventController.fromExternalDragOverFirstTime(nextCand);
            if (!doAccept) return;
            //
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
            this.checkIfTooClose(ib, nextCand, li, ia, idx)) {
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
            this.eventController.swap(nextCand, this.curCand, this.dragOriginIsExternal);

        this.curCand = nextCand; // May or may not change curCand.pos|li
    }
    /**
     * @access public
     */
    handleDraggedOut(e) {
        if (e.target !== (this.curCand || {}).li) return;
        const {clientX, clientY} = e;
        if (!(clientX > this.firstLiBounds.left && clientX < this.firstLiBounds.right &&
              clientY > this.firstLiBounds.top && clientY < this.lastLiBounds.bottom)) {
            this.clearCls();
            this.eventController.dragOut(this.curCand, this.dragOriginIsExternal);
            if (this.dragOriginIsExternal) this.start = 'setting-it';
        }
    }
    /**
     * @access public
     */
    handleDraggableDropped() {
        if (!this.start) return;
        this.clearS();
        this.eventController.drop(this.dragOriginIsExternal);
        if (this.dragOriginIsExternal) this.start = 'setting-it';
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
        if (pos === 'initial') this.dragOriginIsExternal = false;
        this.eventController.begin(Object.assign({}, this.curCand), this.dragOriginIsExternal);
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
     * @access private
     */
    setBounds() {
        const lis = this.ul.querySelectorAll('[data-draggable]');
        this.firstLiBounds = lis[0].getBoundingClientRect();
        this.lastLiBounds = lis[lis.length - 1].getBoundingClientRect();
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
        this.start.classList.remove('dragging');
        this.start = null;
        this.firstLiBounds = null;
        this.lastLiBounds = null;
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
