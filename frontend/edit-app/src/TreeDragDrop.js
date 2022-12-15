const edge = 6;

class TreeDragDrop {
    // ul;
    // ulAsArr;
    // eventController;
    // start;
    // startIdx;
    // lastAcceptedIdx;
    // startDepth;
    // curCandVisual;
    // curCandReal;
    // curAccept;
    // mouseIsCurrentlyInside;
    // dragOriginIsExternal;
    // firstLiBounds;
    // ulBounds;
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
        this.setStartSelfOrigin(norm(e));
        this.start.classList.add('dragging');
    }
    /**
     * @param {DragEvent} e
     * @param {Boolean} isExt = false
     * @access public
     */
    handleDrag(e, isExt = false) {
        if (isExt && this.start === 'setting-it')
            return;
        //
        const {clientX, clientY} = e;
        const newIsInside = (clientX > this.ulBounds.left && clientX < this.ulBounds.right) &&
                             (clientY > this.firstLiBounds.top && clientY < this.ulBounds.bottom);
        if (!newIsInside && this.mouseIsCurrentlyInside) {
            this.mouseIsCurrentlyInside = false;
            this.curAccept = false;
            this.fromright = clientX >= this.ulBounds.right;
            if (isExt) {
                this.clearCls();
                if (clientX > this.ulBounds.left) // Not exited from left
                    return;
                this.eventController.dragOut(this.curCandReal);
                this.start = null;
            }
        } else if (newIsInside && !this.mouseIsCurrentlyInside) {
            this.mouseIsCurrentlyInside = true;
            this.curAccept = true;
            if (this.start === null) this.start = 'setting-it';
        }
    }
    /**
     * @param {any} ctx
     * @access public
     */
    handleDragStartedFromOutside(ctx) {
        if (!this.ul) throw new Error('!this.ul');
        this.setBounds();
        this.start = 'setting-it';
        this.dragOriginIsExternal = true;
        this.eventController.setExternalOriginData(ctx);
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
        if (this.dragOriginIsExternal) {
            if (this.start === 'setting-it') {
                const last = !li.getAttribute('data-last') ? null : getOutermostParent(li.previousElementSibling);
                let nextVisual, nextReal;
                if (!last) {
                    const rect = li.getBoundingClientRect();
                    const isUpperHalf = e.clientY < rect.top + (rect.height * 0.5);
                    nextVisual = {li, pos: null};
                    if (isUpperHalf) nextVisual.pos = e.clientY > rect.top + edge ? 'as-child' : 'before';
                    else nextVisual.pos = e.clientY < rect.bottom - edge ? 'as-child' : 'after';
                    nextReal = Object.assign({}, nextVisual);
                } else {
                    nextReal = {pos: 'after', li: last};
                    nextVisual = {pos: 'before', li};
                    this.curCandIsLastItem = true;
                }
                const doAcceptBegin = this.eventController.begin(Object.assign({}, nextReal));
                if (doAcceptBegin) { // Do 2., 4., 5. and 6. manually here
                    e.preventDefault();
                    this.setStartExternalOrigin(nextVisual, nextReal);
                    nextVisual.li.classList.add(`maybe-drop-${nextVisual.pos}`);
                }
                return;
            } else if (this.curCandIsLastItem) {
                const mouseIsStillUnderLast = this.curCandVisual.li === li;
                if (mouseIsStillUnderLast) { // is still, accept
                    e.preventDefault();
                    return;
                } // else no longer last -> clear and fall through
                this.curCandIsLastItem = false;
            }
        }

        // 1. Create initial nextCands
        const nextCandVisual = {li, pos: null};
        let isBefore = false;
        let isAfter = false;
        let idx = 0;
        let accept = true;

        if (li !== this.start || this.dragOriginIsExternal) {
            const rect = li.getBoundingClientRect();
            idx = this.getIdx(li);
            isBefore = idx < this.startIdx;
            isAfter = idx > this.startIdx;
            if (isBefore) {
                // mouse is in upper area
                if (e.clientY < rect.top + edge) {
                    nextCandVisual.pos = 'before';
                // mouse is in the middle area
                } else if (e.clientY < rect.top + rect.height - edge) {
                    nextCandVisual.pos = 'as-child';
                } else {
                    nextCandVisual.pos = 'after';
                }
            } else if (isAfter) {
                // mouse is in lower area
                if (e.clientY > rect.top + rect.height - edge) {
                    nextCandVisual.pos = 'after';
                // mouse is in the middle area
                } else if (e.clientY > rect.top + edge) {
                    nextCandVisual.pos = 'as-child';
                } else {
                    nextCandVisual.pos = 'before';
                }
            } else nextCandVisual.pos = 'as-child';
        } else {
            nextCandVisual.pos = 'initial';
            accept = this.curCandVisual.pos !== 'initial';
        }

        // 2. Substitute ('before' li[data-last]) with ('after' li[data-last].previous)
        const nextCandReal = !nextCandVisual.li.getAttribute('data-last')
            ? Object.assign({}, nextCandVisual)
            : {li: getOutermostParent(nextCandVisual.li.previousElementSibling), pos: 'after'};

        // 3. Do reject tests
        if (this.checkIfBeyondLastMarker(nextCandVisual) ||
            (nextCandVisual.pos !== 'before' && !this.dragOriginIsExternal && this.checkIfDraggingToOwnParent(li, idx)) ||
            (!this.dragOriginIsExternal && this.checkIfDraggingInsideItself(isAfter, li, idx)) ||
            (!this.dragOriginIsExternal && this.checkIfTooClose(isBefore, nextCandVisual, li, isAfter, idx))) {
            accept = false;
        }

        // 4. Do replacements
        if (accept) {
            // -- Replace "after of .has-children" with "before of .has-children:first-child" ---
            if (nextCandVisual.pos === 'after' && li.getAttribute('data-has-children') && !li.classList.contains('collapsed')) {
                nextCandVisual.pos = 'before';
                nextCandVisual.li = li.nextElementSibling;
                nextCandReal.pos = nextCandVisual.pos;
                nextCandReal.li = nextCandVisual.li;
            }
        }

        // 4.1 Try to swap
        if (accept)
            accept = nextCandVisual.pos !== this.curCandVisual.pos || this.curAccept;
        if (accept && (nextCandVisual.pos !== this.curCandVisual.pos && nextCandVisual.pos !== 'initial'))
            accept = this.eventController.swap(nextCandReal, this.curCandReal, this.getStartLi()) !== false;

        // 5. All checks passsed, accept
        if (accept) {
            e.preventDefault();
            this.lastAcceptedIdx = idx;
        }

        // 6. Handle visuals
        if (!accept || nextCandVisual.pos !== this.curCandVisual.pos)
            this.clearCls();
        if (accept && nextCandVisual.pos !== this.curCandVisual.pos)
            nextCandVisual.li.classList.add(`maybe-drop-${nextCandVisual.pos}`);

        // Update
        this.curCandVisual = nextCandVisual;
        this.curCandReal = nextCandReal;
        this.curAccept = accept;
    }
    /**
     * @access public
     */
    handleDragLeave(_e) {
        //
    }
    /**
     * @access public
     */
    handleDraggableDropped() {
        if (!this.start) return;
        this.eventController.drop(this.curCandReal, this.getStartLi());
        this.clearS();
        if (this.dragOriginIsExternal) this.start = 'setting-it';
        this.curCandIsLastItem = false;
    }
    /**
     * @access public
     */
    handleDragEnded() {
        if (!this.start) return;
        const {lastAcceptedIdx} = this;
        this.clearS();
        this.eventController.end(lastAcceptedIdx);
        this.curCandIsLastItem = false;
    }
    /**
     * @param {HTMLLIElement} li
     * @access private
     */
    setStartSelfOrigin(li) {
        this.setStartLi(li);
        this.startIdx = this.getIdx(this.start);
        this.curCandVisual = {pos: 'initial', li: this.start};
        this.curCandReal = {pos: 'initial', li: this.start};
        this.curAccept = false;
        this.resetEventController();
        this.eventController.begin(Object.assign({}, this.curCandReal));
        this.mouseIsCurrentlyInside = true;
    }
    /**
     * @param {DragDropInfo} nextCandVisual
     * @param {DragDropInfo} nextReal
     * @access private
     */
    setStartExternalOrigin(nextCandVisual, nextCandReal) {
        this.setStartLi(nextCandVisual.li);
        this.startIdx = nextCandVisual.pos !== 'before' ? Infinity : -Infinity;
        this.curCandVisual = nextCandVisual;
        this.curCandReal = nextCandReal;
        this.curAccept = true;
        this.mouseIsCurrentlyInside = false;
    }
    /**
     * @param {HTMLLIElement} li
     * @access private
     */
    setStartLi(li) {
        this.start = li;
        this.lastAcceptedIdx = null;
        this.startDepth = this.start.getAttribute('data-depth');
    }
    /**
     * @param {HTMLLIElement} li
     * @param {Number} _idx Index of target li
     * @returns {Boolean}
     * @access private
     */
    checkIfDraggingToOwnParent(li, _idx) {
        return li.getAttribute('data-has-children') && this.start.getAttribute('data-is-children-of') ===  li.getAttribute('data-block-id');
        /* ??
        if (!this.start.getAttribute('data-has-children') ||
            idx <= this.startIdx ||
            li.getAttribute('data-depth') <= this.start.getAttribute('data-depth')) {
            return false;
        }
        let curLi = this.start.nextElementSibling;
        while (curLi) {
            if (curLi === li) return true;
            if (curLi.getAttribute('data-depth') === this.startDepth) break;
            curLi = curLi.nextElementSibling;
        }
        return false;
        ?? */
    }
    /**
     * @param {Boolean} isAfter Is target li after this.start
     * @param {HTMLLIElement} li
     * @param {Number} idx Index of target li
     * @returns {Boolean}
     * @access private
     */
    checkIfDraggingInsideItself(isAfter, li, idx) {
        if (!isAfter || !this.start.getAttribute('data-has-children') || this.start.classList.contains('collapsed'))
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
     * @param {Boolean} isBefore Is target li before this.start
     * @param {DragDropInfo} nextCandVisual
     * @param {HTMLLIElement} li
     * @param {Boolean} isAfter Is target li after this.start
     * @param {Number} idx Index of target li
     * @returns {Boolean}
     * @access private
     */
    checkIfTooClose(isBefore, nextCandVisual, li, isAfter, idx) {
        if (this.dragOriginIsExternal)
            return false;
        if (isBefore && nextCandVisual.pos === 'after') {
            if (li.getAttribute('data-depth') === this.startDepth) { // same level
                let t = false;
                if (!li.getAttribute('data-has-children') && idx - this.startIdx === -1) { // no children in between
                    t = true;
                } else if (this.ulAsArr[this.startIdx - 1]) { // children in between
                    const sameLevel = Array.from(this.ul.querySelectorAll(`li[data-depth="${this.startDepth}"]`));
                    const sameLevelTargetIdx = sameLevel.indexOf(li);
                    const sameLevelStartLiIdx = sameLevel.indexOf(this.start);
                    if (sameLevelTargetIdx - sameLevelStartLiIdx === -1) t = true;
                }
                if (t) return true;
            } else if (this.start.getAttribute('data-is-children-of') === li.getAttribute('data-block-id') && idx - this.startIdx === -1) // from inner to outer
                return true;
        }
        if (isAfter && nextCandVisual.pos === 'before' && li.getAttribute('data-depth') === this.startDepth) {
            if (idx - this.startIdx === 1) return true;
            if (this.ulAsArr[this.startIdx + 1]) { // depth?
                const sameLevel = Array.from(this.ul.querySelectorAll(`li[data-depth="${this.startDepth}"]`));
                const sameLevelTargetIdx = sameLevel.indexOf(li);
                const sameLevelStartLiIdx = sameLevel.indexOf(this.start);
                if (sameLevelTargetIdx - sameLevelStartLiIdx === 1) return true;
            }
        }
        if (nextCandVisual.li.getAttribute('data-last') && idx - this.startIdx === 1)
            return true;
        return false;
    }
    /**
     * @param {DragDropInfo} nextCandVisual
     * @returns {Boolean}
     * @access private
     */
    checkIfBeyondLastMarker({pos, li}) {
        return pos === 'after' && !!li.getAttribute('data-last');
    }
    /**
     * @access private
     */
    setBounds() {
        const lis = this.ul.querySelectorAll('[data-draggable]');
        this.firstLiBounds = lis[0].getBoundingClientRect();
        this.ulBounds = this.ul.getBoundingClientRect();
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
        if (this.curCandVisual) this.clearCls();
        this.curCandVisual = null;
        this.curCandReal = null;
        this.curAccept = false;
    }
    /**
     * @access private
     */
    clearCls() {
        Array.from(this.ul.querySelectorAll('[class*="maybe-drop-"]')).forEach(li => {
            const cls = li ? Array.from(li.classList).find(c => c.startsWith('maybe-drop-')) : null;
            if (cls) li.classList.remove(cls);
        });
    }
    /**
     * @access private
     */
    resetEventController() {
        this.dragOriginIsExternal = false;
        this.eventController.setExternalOriginData(null);
    }
    /**
     * @returns {HTMLLIElement|null}
     * @access private
     */
    getStartLi() {
        return !this.dragOriginIsExternal ? this.start : null;
    }
}

/**
 * @param {Event} e
 * @returns {HTMLLIElement|null}
 */
function norm(e) {
    return e.target.nodeName === 'LI'
        ? e.target
        : (e.target.nodeName !== '#text' ? e.target : e.target.parentElement).closest('li');
}

/**
 * @param {HTMLLIElement|null} li
 * @param {Number} nth = 0 For internal use
 * @returns {HTMLLIElement|null} null, li:last-child or li:last-child's parent
 */
function getOutermostParent(li, i = 0) {
    if (!li && i === 0) // Empty tree
        return null;
    const parentBlockId = li.getAttribute('data-is-children-of');
    return !parentBlockId ? li : getOutermostParent(li.closest('ul').querySelector(`li[data-block-id="${parentBlockId}"]`), i + 1);
}

export default TreeDragDrop;
