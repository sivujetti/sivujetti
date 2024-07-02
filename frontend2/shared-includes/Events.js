class Events {
    /**
     */
    constructor() {
        this.listeners = new Map;
    }
    /**
     * @param {string} when
     * @param {(...any) => void} thenDo
     * @returns {Function} Call it to unregister this listener
     * @access public
     */
    on(when, thenDo) {
        const cur = this.listeners.get(when);
        this.listeners.set(when, cur ? cur.concat(thenDo) : [thenDo]);
        return () => {
            const fns = this.listeners.get(when);
            this.listeners.set(when, fns.filter(fn => fn !== thenDo));
        };
    }
    /**
     * @param {string} eventName
     * @param {...any} args
     * @access public
     */
    emit(eventName, ...args) {
        const fns = this.listeners.get(eventName);
        if (!fns) return;
        fns.forEach(fn => fn(...args));
    }
}

export default Events;
