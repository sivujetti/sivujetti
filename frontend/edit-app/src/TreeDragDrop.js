const edge = 6;

class TreeDragDrop {
    // ul;
    // ulAsArr;
    // eventController;
    // start;
    // startIdx;
    // lastAcceptedIdx;
    // startDepth;
    // curCand;
    // curAccept;
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
            const target = getLastTarget(li); // null, li:last-child or li:last-child's parent
            if (this.start === 'setting-it') {
                const nextCand = {li, pos: null};
                let p;
                if (!target) {
                    const rect = li.getBoundingClientRect();
                    const isUpperHalf = e.clientY < rect.top + (rect.height * 0.5);
                    if (isUpperHalf) nextCand.pos = e.clientY > rect.top + edge ? 'as-child' : 'before';
                    else nextCand.pos = e.clientY < rect.bottom - edge ? 'as-child' : 'after';
                    p = nextCand;
                } else {
                    if (target === li) p = {pos: 'after', li: target};
                    else p = {pos: 'before', li};
                    this.curCandIsLastItem = true;
                }
                if (!(window.useStoreonBlockTree !== false)) {
                const doAccept = this.eventController.fromExternalDragOverFirstTime(p);
                if (!doAccept) return;
                }
                // Do 4. and 5. manually here
                e.preventDefault();
                this.setStart(nextCand.li, nextCand.pos);
                p.li.classList.add(`maybe-drop-${p.pos}`);
                return;
            } else if (this.curCandIsLastItem) {
                if (this.curCand.li === li) {
                    e.preventDefault();
                    return;
                }// else no longer last -> clear and fall through
                this.curCandIsLastItem = false;
            }
        }

        // 1. Create initial nextCand
        const nextCand = {li, pos: null};
        let ib = false;
        let ia = false;
        let idx = 0;
        let accept = true;

        if (li !== this.start || this.dragOriginIsExternal) {
            const rect = li.getBoundingClientRect();
            idx = this.getIdx(li);
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
            accept = this.curCand.pos !== 'initial';
        }

        // 2. Do reject tests
        if (this.checkIfBeyondLastMarker(nextCand) ||
            (nextCand.pos !== 'before' && this.checkIfDraggingToOwnParent(li, idx)) ||
            this.checkIfDraggingInsideItself(ia, li, idx) ||
            (!this.dragOriginIsExternal && this.checkIfTooClose(ib, nextCand, li, ia, idx))) {
            accept = false;
        }

        // 3. Do replacements
        if (accept) {
            // -- Replace "after of .has-children" with "before of .has-children:first-child" ---
            if (nextCand.pos === 'after' && li.getAttribute('data-has-children') && !li.classList.contains('collapsed')) {
                nextCand.pos = 'before';
                nextCand.li = li.nextElementSibling;
            }
        }

        // 3.1 Try to swap
        if (accept)
            accept = nextCand.pos !== this.curCand.pos || this.curAccept;
        if (accept && (nextCand.pos !== this.curCand.pos && nextCand.pos !== 'initial'))
            accept = this.eventController.swap(nextCand, this.curCand, this.getStartLi()) !== false;

        // 4. All checks passsed, accept
        if (accept) {
            e.preventDefault();
            this.lastAcceptedIdx = idx;
        }

        // 5. Handle visuals
        if (!accept || nextCand.pos !== this.curCand.pos)
            this.clearCls();
        if (accept && nextCand.pos !== this.curCand.pos)
            nextCand.li.classList.add(`maybe-drop-${nextCand.pos}`);

        // Update
        this.curCand = nextCand;
        this.curAccept = accept;
    }
    /**
     * @access public
     */
    handleDraggedOut(e) {
        if (e.target !== (this.curCand || {}).li) return;
        const {clientX, clientY} = e;
        const curLiLeft = this.curCand.li.getBoundingClientRect().left;
        const isInsideXCoord = clientX > curLiLeft && clientX < this.firstLiBounds.right;
        if (!(isInsideXCoord &&
              clientY > this.firstLiBounds.top && clientY < this.lastLiBounds.bottom)) {
            this.clearCls();
            this.curAccept = false;
            if (isInsideXCoord && clientY < this.firstLiBounds.top)
                return;
            this.eventController.dragOut(this.curCand);
            if (this.dragOriginIsExternal) this.start = 'setting-it';
        }
    }
    /**
     * @access public
     */
    handleDraggableDropped() {
        if (!this.start) return;
        this.eventController.drop(this.curCand, this.getStartLi());
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
     * @param {String} pos = 'initial'
     * @access private
     */
    setStart(li, pos = 'initial') {
        this.start = li;
        this.startIdx = this.getIdx(this.start) + (pos === 'before' ? -1 : pos === 'after' ? 1 : 0);
        this.lastAcceptedIdx = null;
        this.startDepth = this.start.getAttribute('data-depth');
        this.curCand = {pos, li: this.start};
        this.curAccept = pos !== 'initial';
        if (pos === 'initial') this.resetEventController();
        this.eventController.begin(Object.assign({}, this.curCand));
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
     * @param {DragDropInfo} nextCand
     * @param {HTMLLIElement} li
     * @param {Number} ia Is target li after this.start
     * @param {Number} idx Index of target li
     * @returns {Boolean}
     * @access private
     */
    checkIfTooClose(ib, nextCand, li, ia, idx) {
        if (this.dragOriginIsExternal)
            return false;
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
     * @param {DragDropInfo} nextCand
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
    return e.target.nodeName === 'LI' ? e.target : e.target.closest('li');
}

/**
 * @param {HTMLLIElement} li
 * @returns {HTMLLIElement|null}
 */
function getLastTarget(li) {
    if (!li.getAttribute('data-last')) return null;

    const realLast = li.previousElementSibling;
    if (!realLast) return null; // Empty tree

    const childrenOf = realLast.getAttribute('data-is-children-of');
    return childrenOf === '-'
        ? realLast
        : realLast.parentElement.querySelector(`li[data-block-id="${childrenOf}"]`);
}

export default TreeDragDrop;
