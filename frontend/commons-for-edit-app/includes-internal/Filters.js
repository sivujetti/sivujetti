class Filters {
    /**
     */
    constructor() {
        this.filters = new Map;
    }
    /**
     * @template T
     * @param {string} forWhat
     * @param {(item: T, ...args: any[]) => T} fn
     * @returns {number}
     */
    addFilter(forWhat, fn) {
        if (!this.filters.has(forWhat))
            this.filters.set(forWhat, []);
        return this.filters.get(forWhat).push(fn);
    }
    /**
     * @template T
     * @param {string} forWhat
     * @param {T} ret Note: may be mutated
     * @param {any[]} args
     * @returns {T}
     */
    applyFilters(forWhat, ret, ...args) {
        for (const fn of (this.filters.get(forWhat) || []))
            ret = fn(ret, ...args);
        return ret;
    }
}

export default Filters;
