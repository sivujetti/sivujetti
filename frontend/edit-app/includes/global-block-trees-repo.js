class GlobalBlockTreesRepo {
    /**
     * @param {Array<GlobalBlockTree>} gbts = []
     */
    constructor(gbts = []) {
        this.setTrees(gbts);
    }
    /**
     * @param {Array<GlobalBlockTree>} gbts
     */
    setTrees(gbts) {
        this._gbts = gbts;
    }
    /**
     * @returns {Array<GlobalBlockTree>}
     */
    getTrees() {
        return this._gbts;
    }
}

/** @typedef {{
 *   setTrees(gbts: Array<GlobalBlockTree>): void;
 *   getTrees(): Array<GlobalBlockTree>;
 * }} GlobalBlockTreesRepository */

export default GlobalBlockTreesRepo;
