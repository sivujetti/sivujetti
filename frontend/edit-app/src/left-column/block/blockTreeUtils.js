export default {
    /**
     * @param {String} id
     * @param {Array<RawBlock>} branch
     * @param {RawBlock=} parentBlock = null
     * @returns {[Block|null, Array<RawBlock>|null, Block|null]} [block, containingBranch, parentBlock]
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
     * @param {String} blockId
     * @param {Array<RawBlock>} theBlockTree
     * @returns {String|null}
     * @access public
     */
    getIsStoredToTreeId(blockId, theBlockTree) {
        const [b, _, __, root] = this.findBlockSmart(blockId, theBlockTree);
        if (!b) return null;
        return root === theBlockTree ? 'main' : root.id;
    },
    /**
     * @param {String} id
     * @param {Array<RawBlock>} tree
     * @param {RawBlock=} _parentBlock = null
     * @param {RawGlobalBlockTree|Array<RawBlock>} _root = null
     * @returns {[Block|null, Array<RawBlock>|null, Block|null, RawGlobalBlockTree|Array<RawBlock>|null]} [block, containingBranch, parentBlock, root]
     * @access public
     */
    findBlockSmart(id, tree, _parentBlock = null, _root = null) { // todo return {block, containingBranch, paren, root} ?
        for (const b of tree) {
            if (b.id === id) return [b, tree, _parentBlock, _root || tree];
            if (b.type !== 'GlobalBlockReference') {
                const c = b.children;
                if (c.length) {
                    const sub = this.findBlockSmart(id, c, b, _root || tree);
                    if (sub[0]) return sub;
                }
            } else {
                const c = b.__globalBlockTree.blocks;
                if (c.length) {
                    const sub = this.findBlockSmart(id, c, b, b.__globalBlockTree);
                    if (sub[0]) return sub;
                }
            }
        }
        return [null, null, null, null];
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
     * @param {(item: Object, i: Number) => any} fn
     * @returns {Array<Object>}
     * @access public
     */
    mapRecursivelyManual(branch, fn) {
        return branch.map((b, i) => {
            const child = b.children.length ? this.mapRecursivelyManual(b.children, fn) : [];
            return fn(b, i, child);
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
     * @param {(item: Object, i: Number, parent: Object|null, parentIdPath: String) => any} fn
     * @param {Number} parentI = 0
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
    /**
     * @param {String} trid 'main' or 'id-of-some-global-block-tree'
     * @param {Array<RawBlock>} from
     * @returns {Array<RawBlock>|null}
     */
    findTree(trid, from) {
        if (trid === 'main')
            return from;
        const refBlock = this.findRecursively(from, block =>
            block.type === 'GlobalBlockReference' && block.__globalBlockTree.id === trid
        );
        return refBlock ? refBlock.__globalBlockTree.blocks : null;
    },
};
