export default {
    /**
     * @param {Array<Block>} branch
     * @returns {Array<Block>}
     * @access public
     */
    setParentIdPaths(branch) {
        this.traverseRecursively(branch, (b, _i, _parent, parentIdPath) => {
            b.parentBlockIdPath = parentIdPath;
        });
        return branch;
    },
    /**
     * @param {String} id
     * @param {Array<Block>} branch
     * @param {Block=} parentBlock = null
     * @returns {[Block|null, Array<Block>|null, Block|null]} [block, containingBranch, parentBlock]
     * @access public
     */
    findBlock(id, branch, parentBlock = null) {
        for (const b of branch) {
            if (b.id === id) return [b, branch, parentBlock];
            if (b.children.length) {
                const c = this.findBlock(id, b.children, b);
                if (c[0]) return c;
            }
        }
        return [null, null, null];
    },
    /**
     * @param {Array<Object>} branch
     * @param {(item: Object, i: Number) => any} fn
     * @returns {Array<Object>}
     * @access public
     */
    mapRecursively(branch, fn) {
        return branch.map((b, i) => {
            const out = fn(b, i);
            out.children = b.children.length
                ? this.mapRecursively(b.children, fn)
                : [];
            return out;
        });
    },
    /**
     * @param {Array<Object>} branch
     * @param {(item: Object, i: Number) => Boolean} fn
     * @returns {Object}
     * @access public
     */
    findRecursively(branch, fn) {
        for (let i = 0; i < branch.length; ++i) {
            const b = branch[i];
            if (fn(b, i)) return b;
            if (b.children.length) {
                const c = this.findRecursively(b.children, fn);
                if (c) return c;
            }
        }
        return null;
    },
    /**
     * @param {Array<Object>} branch
     * @param {(item: Object, i: Number, parent: Object|null) => any} fn
     * @param {Object|null} parent = null
     * @param {String} parentIdPath = ''
     * @returns {Array<Object>}
     * @access public
     */
    traverseRecursively(branch, fn, parent = null, parentIdPath = '') {
        branch.forEach((b, i) => {
            fn(b, i, parent, parentIdPath);
            if (b.children.length) {
                this.traverseRecursively(b.children, fn, b, `${parentIdPath}/${b.id}`);
            }
        });
    },
};
