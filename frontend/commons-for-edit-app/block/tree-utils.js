import {api} from '../edit-app-singletons.js';
import {objectUtils} from '../utils.js';

const blockTreeUtils = {
    /** @type {Array<GlobalBlockTree>} */
    _allGlobalBlockTrees: [],
    /**
     * @param {string} id
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
     * @param {string} blockId
     * @param {Array<Block>} theBlockTree
     * @returns {string|null}
     * @access public
     */
    getIsStoredToTreeId(blockId, theBlockTree) {
        const [b, _branch, _parent, root] = this.findBlockMultiTree(blockId, theBlockTree);
        if (!b) return null;
        return this.getIdFor(root);
    },
    /**
     * @param {string} id
     * @param {Array<Block>} tree
     * @param {Block=} _parentBlock = null
     * @param {GlobalBlockTree|Array<Block>} _root = null
     * @returns {[Block|null, Array<Block>|null, Block|null, GlobalBlockTree|Array<Block>|null]} [block, containingBranch, parentBlock, root]
     * @access public
     */
    findBlockMultiTree(id, tree, _parentBlock = null, _root = null) {
        for (const b of tree) {
            if (b.id === id) return [b, tree, _parentBlock, _root || tree];
            if (b.type !== 'GlobalBlockReference') {
                const c = b.children;
                if (c.length) {
                    const sub = this.findBlockMultiTree(id, c, b, _root || tree);
                    if (sub[0]) return sub;
                }
            } else {
                const gbt = this.getTree(b.globalBlockTreeId);
                const c = gbt.blocks;
                if (c.length) {
                    const sub = this.findBlockMultiTree(id, c, b, gbt);
                    if (sub[0]) return sub;
                }
            }
        }
        return [null, null, null, null];
    },
    /**
     * @param {GlobalBlockTree|Array<Block>} input
     * @returns {string} 'main' or <pushId>
     * @access public
     */
    getIdFor(root) {
        return this.isMainTree(root) ? 'main' : root.id;
    },
    /**
     * @param {GlobalBlockTree|Array<Block>} input
     * @returns {boolean}
     * @access public
     */
    isMainTree(root) {
        return Array.isArray(root);
    },
    /**
     * @param {Array<Object>} branch
     * @param {(item: Object, i: number) => any} fn
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
     * @param {(item: Object, i: number) => any} fn
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
     * @param {(item: Object, i: number) => boolean} fn
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
     * @param {(item: Object, i: number, parent: Object|null, parentIdPath: string) => any} fn
     * @param {Object} parent = null
     * @param {string} parentIdPath = ''
     * @returns {Array<Object>}
     * @access public
     */
    traverseWithIdRecursively(branch, fn, parent = null, parentIdPath = '') {
        branch.forEach((b, i) => {
            fn(b, i, parent, parentIdPath);
            if (b.children.length) {
                this.traverseWithIdRecursively(b.children, fn, b, `${parentIdPath}/${b.id}`);
            }
        });
    },
    /**
     * @param {string} trid
     * @param {Array<GlobalBlockTree>} storeState = null
     * @returns {Array<Block>|GlobalBlockTree|undefined}
     */
    getTree(trid, storeState = null) {
        if (trid === 'main')
            return api.saveButton.getInstance().getChannelState('theBlockTree');
        const fromSaveButtonState = (storeState|| api.saveButton.getInstance().getChannelState('globalBlockTrees')).find((({id}) => id === trid));
        if (fromSaveButtonState) return fromSaveButtonState;
        const fromBackend = this._allGlobalBlockTrees.find((({id}) => id === trid));
        return fromBackend;
    },
    /**
     * @param {string} trid 'main' or 'id-of-some-global-block-tree'
     * @param {Array<Block>} from
     * @returns {Array<Block>|null}
     * @access public
     */
    findTree(trid, from) {
        if (trid === 'main')
            return from;
        const refBlock = this.findRecursively(from, block =>
            block.type === 'GlobalBlockReference' && block.globalBlockTreeId === trid
        );
        return refBlock ? this.getTree(refBlock.globalBlockTreeId).blocks : null;
    },
    /**
     * @param {Array<GlobalBlockTree>} allTrees
     * @access public
     */
    setAllGlobalBlockTrees(allTrees) {
        this._allGlobalBlockTrees = allTrees;
    },
    /**
     * @param {Array<Block>} theTree
     * @param {(newTreeCopyFreeToMutate: Array<Block>) => Array<Block>} mutator
     * @returns {Array<Block>} Mutated $newTreeCopyFreeToMutate
     * @access public
     */
    createMutation(theTree, mutator) {
        return objectUtils.cloneDeepWithChanges(theTree, mutator);
    }
};

export default blockTreeUtils;
