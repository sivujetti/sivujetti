class Signals {
    /**
     */
    constructor() {
        this.listeners = new Map;
    }
    /**
     * @param {String} when
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
     * @param {String} signalName
     * @param {...any} args
     * @access public
     */
    emit(signalName, ...args) {
        const fns = this.listeners.get(signalName);
        if (!fns) return;
        fns.forEach(fn => fn(...args));
    }
}

export default Signals;
