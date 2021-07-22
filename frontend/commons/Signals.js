class Signals {
    /**
     */
    constructor() {
        this.listeners = new Map;
    }
    /**
     * @param {String} when
     * @param {(...any) => void} thenDo
     * @access public
     */
    on(when, thenDo) {
        const cur = this.listeners.get(when);
        this.listeners.set(when, cur ? cur.push(thenDo) : [thenDo]);
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
