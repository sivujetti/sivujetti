import {__, signals, http, env} from './commons/main.js';
import ContextMenu from './commons/ContextMenu.jsx';
import Icon from './commons/Icon.jsx';
import toasters from './commons/Toaster.jsx';
import BlockTypeSelector, {normalizeGlobalBlockTreeBlock} from './BlockTypeSelector.jsx';
import Block from './Block.js';
import blockTreeUtils from './blockTreeUtils.js';
import store, {pushItemToOpQueue} from './store.js';
import BlockTreeDragDrop from './BlockTreeDragDrop.js';
import floatingDialog from './FloatingDialog.jsx';
import ConvertBlockToGlobalDialog from './ConvertBlockToGlobalBlockTreeDialog.jsx';
import {t} from './block-types/block-types.js';

let BlockTrees;
const globalBlockTreeBlocks = new Map;

class BlockTree extends preact.Component {
    // selectedRoot;
    // contextMenu;
    // lastRootBlockMarker;
    // unregisterSignalListener;
    // dragDrop;
    // onDragStart;
    // onDragOver;
    // onDrop;
    /**
     * @param {{blocksInput: Array<RawBlock>; onChangesApplied?: (blockTree: Array<Block>, blockIsStoredTo: 'page'|'globalBlockTree', globalBlockTreeId: String|null) => Promise<Boolean>; BlockTrees: preact.ComponentClass;}} props
     */
    constructor(props) {
        super(props);
        this.state = {blockTree: null, treeState: null, blockWithNavOpened: null};
        this.selectedRoot = null;
        this.contextMenu = preact.createRef();
        this.lastRootBlockMarker = null;
        this.dragDrop = new BlockTreeDragDrop(this, (mutatedTree, dragBlock, dropBlock, dropPosition) => {
            this.setState({blockTree: mutatedTree});
            BlockTrees.currentWebPage.reOrderBlocksInDom(dragBlock, dropBlock, dropPosition);
            store.dispatch(pushItemToOpQueue(`swap-${dragBlock.isStoredTo}-blocks`, {
                doHandle: this.props.onChangesApplied,
                args: dragBlock.isStoredTo !== 'globalBlockTree'
                    ? [mutatedTree, dragBlock.isStoredTo, null]
                    : [this.getTreeFor(dragBlock, true), dragBlock.isStoredTo, dragBlock.globalBlockTreeId],
            }));
        });
        BlockTrees = props.BlockTrees;
    }
    /**
     * @param {Block} block After
     * @param {Boolean} autoFocus = true
     * @access public
     */
    appendBlockToTreeAfter(block, autoFocus = true) {
        this.doAppendBlockAndUpdateState(block, 'after', autoFocus);
    }
    /**
     * @param {Block} block The parent block
     * @param {Boolean} autoFocus = true
     * @access public
     */
    appendBlockToTreeAsChildOf(block, autoFocus = true) {
        this.doAppendBlockAndUpdateState(block, 'as-child', autoFocus);
    }
    /**
     * @param {Block|Array<Block>|undefined} context = this.state.blockTree
     * @param {'after'|'as-child'} position = 'after'
     * @returns {Promise<Block>}
     * @access public
     */
    appendNewBlockPlaceholder(context = this.state.blockTree,
                              position = 'after',
                              alterState = null) {
        let toArr;
        let after = context;
        //
        if (position === 'after' && context instanceof Block) {
            const branch = blockTreeUtils.findBlock(context.id, this.getTreeFor(context))[1];
            toArr = branch;
        } else if (position === 'after' && Array.isArray(context)) {
            toArr = context;
            if (toArr !== this.state.blockTree) throw new Error();
            after = toArr.length
                ? getLastPageBlock(this.state.blockTree)
                : this.lastRootBlockMarker;
        } else if (position === 'as-child' && context instanceof Block) {
            toArr = context.children;
            after = this.getAfter(toArr, context);
        } else if (position === 'as-child' && Array.isArray(context)) {
            throw new Error('Invalid usage (arr, "as-child"), should be (arr[position], "as-child")');
        }
        //
        const newBlock = Block.fromType(
            'Paragraph',
            undefined, // data
            undefined, // id
            context instanceof Block ? context.globalBlockTreeId : undefined
        );
        return BlockTrees.currentWebPage.appendBlockToDom(newBlock, after).then(_cref => {
            newBlock._cref = _cref;
            toArr.splice(toArr.indexOf(after) + 1, 0, newBlock); // Note: mutates this.state.blockTree or globalBlockTreeBlocks.someTree
            //
            this.setState((alterState || function (s, _) { return s; })({
                blockTree: this.state.blockTree,
                treeState: Object.assign(this.state.treeState,
                    {[newBlock.id]: createTreeStateItem({isNew: true})})
            }, newBlock));
            //
            return newBlock;
        });
    }
    /**
     * @returns {Array<Block>}
     * @access public
     */
    getTree() {
        return this.state.blockTree;
    }
    /**
     * @returns {Map<string, Array<Block>>}
     * @access public
     */
    getGlobalTrees() {
        return globalBlockTreeBlocks;
    }
    /**
     * @param {Block} block
     * @param {Boolean} expectGlobalBlock = false
     * @returns {Array<Block>}
     * @throws {Error} If block is not valid or no tree was found
     * @access public
     */
    getTreeFor(block, expectGlobalBlock = false) {
        if (!expectGlobalBlock && block.isStoredTo !== 'globalBlockTree')
            return this.state.blockTree;
        if (block.isStoredTo !== 'globalBlockTree' || !block.globalBlockTreeId)
            throw new Error('Expected $block to be a child of a GlobalBlockReference block');
        const tree = globalBlockTreeBlocks.get(block.globalBlockTreeId);
        if (!tree)
            throw new Error(`Global block tree #${block.globalBlockTreeId} not found.`);
        return tree;
    }
    /**
     * @access protected
     */
    componentWillMount(props = this.props) {
        const blockRefs = BlockTrees.currentWebPageBlockRefs;
        const treeState = {};
        const createBlockAndPutToState = blockRaw => {
            const block = Block.fromObject(blockRaw);
            block._cref = blockRefs.find(({blockId}) => blockId === block.id);
            treeState[block.id] = createTreeStateItem();
            return block;
        };
        globalBlockTreeBlocks.clear();
        const blockTree = blockTreeUtils.mapRecursively(props.blocksInput, blockRaw => {
            const out = createBlockAndPutToState(blockRaw);
            if (blockRaw.type === 'GlobalBlockReference') {
                if (!globalBlockTreeBlocks.has(blockRaw.globalBlockTreeId))
                    globalBlockTreeBlocks.set(blockRaw.globalBlockTreeId, blockTreeUtils.mapRecursively(out.__globalBlockTree.blocks, sbRaw => {
                        normalizeGlobalBlockTreeBlock(sbRaw, blockRaw.globalBlockTreeId);
                        return createBlockAndPutToState(sbRaw);
                    }));
                out.__globalBlockTree.blocks = globalBlockTreeBlocks.get(blockRaw.globalBlockTreeId);
            }
            return out;
        });
        const com = BlockTrees.currentWebPage.findEndingComment(getLastPageBlock(blockTree));
        this.lastRootBlockMarker = com.nextSibling
            ? {nextSibling: com.nextSibling, parentNode: com.parentNode}
            : {nextSibling: null, parentNode: com.parentNode};
        this.setState({blockTree, treeState});
        //
        this.unregisterSignalListener = signals.on('on-inspector-panel-closed', () => {
            this.deSelectAllBlocks();
        });
        //
        this.onDragStart = this.dragDrop.handleDragStarted.bind(this.dragDrop);
        this.onDragOver = this.dragDrop.handleDraggedOver.bind(this.dragDrop);
        this.onDrop = this.dragDrop.handleDraggableDropped.bind(this.dragDrop);
        this.onDragEnd = this.dragDrop.handleDragEnded.bind(this.dragDrop);
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unregisterSignalListener();
    }
    /**
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.blocksInput !== this.props.blocksInput)
            this.componentWillMount(props);
    }
    /**
     * @access protected
     */
    render(_, {blockTree, treeState, blockWithNavOpened}) {
        if (blockTree === null) return;
        const renderBranch = branch => branch.map(block => {
            //
            if (treeState[block.id].isNew) return <li key={ block.id }>
                <BlockTypeSelector
                    block={ block }
                    onSelectionChanged={ this.replacePlaceholderBlock.bind(this) }
                    onSelectionConfirmed={ this.confirmAddBlock.bind(this) }
                    onSelectionDiscarded={ this.cancelAddBlock.bind(this) }/>
            </li>;
            //
            if (block.type !== 'PageInfo') {
            const visible = getVisibleBlock(block);
            return <li
                onDragStart={ this.onDragStart }
                onDragOver={ this.onDragOver }
                onDrop={ this.onDrop }
                onDragEnd={ this.onDragEnd }
                class={ [`${visible.isStoredTo}-block`,
                         !treeState[visible.id].isSelected ? '' : ' selected',
                         !treeState[visible.id].isCollapsed ? '' : ' collapsed',
                         !visible.children.length ? '' : ' with-children'].join('') }
                data-block-id={ block.id }
                data-block-tree-id={ block.isStoredTo !== 'globalBlockTree' ? '' : block.globalBlockTreeId }
                key={ block.id }
                draggable>
                { !visible.children.length
                    ? null
                    : <button onClick={ () => this.toggleBranchIsCollapsed(visible) } class="toggle p-absolute" type="button"><Icon iconId="chevron-down" className="size-xs"/></button>
                }
                <div class="d-flex">
                    <button onClick={ () => this.handleItemClicked(visible) } class="block-handle columns" type="button">
                        <Icon iconId={t(visible.type)} className="size-xs color-accent mr-1"/>
                        { visible.title || __(visible.type) }
                    </button>
                    <button onClick={ e => this.openMoreMenu(block, e) } class={ `more-toggle ml-2${blockWithNavOpened !== block ? '' : ' opened'}` } type="button">
                        <Icon iconId="dots" className="size-xs"/>
                    </button>
                </div>
                { visible.children.length
                    ? <ul>{ renderBranch(visible.children) }</ul>
                    : null
                }
            </li>;
            }
            //
            return <li
                class={ [!treeState[block.id].isSelected ? '' : 'selected'].join(' ') }
                data-block-type="PageInfo"
                key={ block.id }>
                <div class="d-flex">
                    <button onClick={ () => this.handleItemClicked(block) } class="block-handle columns" type="button">
                        <Icon iconId="file-info" className="size-xs color-accent mr-1"/>
                        { block.title || __(block.type) }
                    </button>
                </div>
            </li>;
        });
        return <div class="pt-2">
            <div class="p-relative"><button
                onClick={ this.showBlockTreeHelpPopup.bind(this) }
                class="btn btn-link p-absolute btn-sm"
                type="button"
                style="right: 0; top: .4rem">
                <Icon iconId="info-circle" className="size-xs"/>
            </button></div>
            <ul class="block-tree" data-sort-group-id="r">{
                blockTree.length
                    ? renderBranch(blockTree)
                    : <li>-</li>
            }</ul>
            <ContextMenu
                links={ [
                    {text: __('Add child'), title: __('Add child block'), id: 'add-child'},
                    {text: __('Clone'), title: __('Clone block or branch'), id: 'clone-block'},
                    {text: __('Delete'), title: __('Delete block'), id: 'delete-block'},
                    {text: __('Convert to global'), title: __('Convert to global block'), id: 'convert-block-to-global'},
                ] }
                onItemClicked={ this.handleContextMenuLinkClicked.bind(this) }
                onMenuClosed={ () => this.setState({blockWithNavOpened: null}) }
                ref={ this.contextMenu }/>
        </div>;
    }
    /**
     * @param {ContextMenuLink} link
     * @access private
     */
    handleContextMenuLinkClicked(link) {
        if (link.id === 'add-child') {
            const id = this.state.blockWithNavOpened.id;
            this.appendNewBlockPlaceholder(getVisibleBlock(this.state.blockWithNavOpened), 'as-child',
                state => {
                    state.treeState[id].isCollapsed = false;
                    return state;
                });
        } else if (link.id === 'clone-block') {
            const clonedBlock = Block.cloneDeep(this.state.blockWithNavOpened);
            const [cloneFrom, branch] = blockTreeUtils.findBlock(this.state.blockWithNavOpened.id,
                this.getTreeFor(this.state.blockWithNavOpened));
            BlockTrees.currentWebPage.appendClonedBlockBranchToDom(clonedBlock, cloneFrom, blockTreeUtils).then(_crefs => {
                const treeStateMutRef = this.state.treeState;
                blockTreeUtils.traverseRecursively([clonedBlock], b => {
                    b._cref = _crefs[b.id];                        // Note: mutates this.state.blockTree or globalBlockTreeBlocks.someTree
                    treeStateMutRef[b.id] = createTreeStateItem(); // Note: mutates this.state.treeState
                });
                branch.splice(branch.indexOf(cloneFrom) + 1, 0, clonedBlock); // mutates this.state.blockTree or globalBlockTreeBlocks.someTree
                this.setState({
                    blockTree: this.state.blockTree,
                    treeState: treeStateMutRef
                });
            });
        } else if (link.id === 'delete-block') {
            const isSelectedRootCurrentlyClickedBlock = () => {
                if (!this.selectedRoot)
                    return false;
                return this.selectedRoot === this.state.blockWithNavOpened;
            };
            const isSelectedRootChildOfCurrentlyClickedBlock = () => {
                if (!this.selectedRoot ||
                    !this.selectedRoot.parentBlockIdPath ||
                    !this.state.blockWithNavOpened.children.length)
                    return false;
                return blockTreeUtils.findRecursively(this.state.blockWithNavOpened.children,
                    b => b.id === this.selectedRoot.id);
            };
            //
            let wasCurrentlySelectedBlock = isSelectedRootCurrentlyClickedBlock() ||
                                            isSelectedRootChildOfCurrentlyClickedBlock();
            if (wasCurrentlySelectedBlock) this.selectedRoot = null;
            this.cancelAddBlock(this.state.blockWithNavOpened);
            store.dispatch(pushItemToOpQueue(`delete-${this.state.blockWithNavOpened.isStoredTo}-block`, {
                doHandle: this.props.onChangesApplied,
                args: [this.getTreeFor(this.state.blockWithNavOpened),
                       this.state.blockWithNavOpened.isStoredTo,
                       this.state.blockWithNavOpened.globalBlockTreeId || null],
            }));
            signals.emit('on-block-deleted', this.state.blockWithNavOpened, wasCurrentlySelectedBlock);
        } else if (link.id === 'convert-block-to-global') {
            const blockTreeToStore = this.state.blockWithNavOpened;
            floatingDialog.open(ConvertBlockToGlobalDialog, {
                title: __('Convert to global')
            }, {
                blockToConvertAndStore: blockTreeToStore,
                onConfirmed: data => this.doConvertBlockToGlobal(data, blockTreeToStore),
            });
        }
    }
    /**
     * @param {RawGlobalBlockTree} data
     * @param {Block} originalBlock The block tree we just turned global
     */
    doConvertBlockToGlobal(data, originalBlock) {
        // todo emit to queue
        // todo start loadState
        const postData = {
            name: data.name,
            blocks: data.blocks,
        };
        http.post('/api/global-block-trees', postData)
        .then(resp => {
            if (!resp.insertId) throw new Error('-');
            const blockWasStoredTo = originalBlock.isStoredTo;
            const blockRefs = BlockTrees.currentWebPageBlockRefs;
            // 1. Create new block, update dom
            const newBlock = Block.fromType('GlobalBlockReference',
                                            {globalBlockTreeId: resp.insertId});
            newBlock._cref = BlockTrees.currentWebPage.convertToGlobal(newBlock, originalBlock);
            blockRefs.splice(blockRefs.indexOf(originalBlock._cref), 0, newBlock._cref);
            const mutated = turnBranchToGlobal(postData.blocks, // Note: mutates entries of this.state.blockTree
                                               this.state.blockTree,
                                               newBlock.globalBlockTreeId);
            newBlock.__globalBlockTree = {id: resp.insertId,
                                          name: postData.name,
                                          blocks: mutated};
            // 2. Update treeState
            const treeStateMutRef = this.state.treeState;
            treeStateMutRef[newBlock.id] = createTreeStateItem();
            // 3. Replace block in blockTree
            const branch = blockTreeUtils.findBlock(originalBlock.id, this.state.blockTree)[1];
            branch.splice(branch.indexOf(originalBlock), 1, newBlock); // Note: mutates this.state.blockTree
            // 4. Commit to state
            this.setState({blockTree: this.state.blockTree,
                           treeState: treeStateMutRef});
            // 5. Save to backend if we're not currently inside AddPageMainPanelView
            if (this.props.onChangesApplied)
                this.props.onChangesApplied(this.state.blockTree, blockWasStoredTo, null);
        })
        .catch(err => {
            env.window.console.error(err);
            toasters.editAppMain(__('Something unexpected happened.'));
        })
        .finally(() => {
            // todo end loadState
        });
    }
    /**
     * @param {BlockBlueprint} blockBluePrint
     * @param {Block} origBlock Previous placeholder block
     * @access private
     */
    replacePlaceholderBlock(blockBluePrint, origBlock) {
        // Remove previous placeholderBlock.children from treeState (if any)
        const treeStateMutRef = this.state.treeState;
        for (const block of origBlock.children)
            delete treeStateMutRef[block.id];
        // Replace root block
        const newBlock = Block.fromType(blockBluePrint.blockType,
                                        blockBluePrint.data,
                                        origBlock.id,
                                        origBlock.globalBlockTreeId);
        newBlock._cref = origBlock._cref;
        BlockTrees.currentWebPage.replaceBlockFromDomWith(origBlock, newBlock).then(_crefOrCrefs => {
            if (newBlock.type !== 'GlobalBlockReference') {
                newBlock._cref = _crefOrCrefs;
                // Replace children
                if (blockBluePrint.children.length) {
                    const flat = [];
                    blockTreeUtils.traverseRecursively(blockBluePrint.children, blueprint => {
                        flat.push(blueprint);
                    });
                    return Promise.all(flat.map(blueprint => {
                        const b = Block.fromType(blueprint.blockType, blueprint.data, undefined,
                            newBlock.globalBlockTreeId);
                        const after = this.getAfter(newBlock.children, newBlock);
                        return BlockTrees.currentWebPage.appendBlockToDom(b, after).then(_cref => {
                            b._cref = _cref;
                            newBlock.children.push(b);
                            treeStateMutRef[b.id] = createTreeStateItem();
                        });
                    }));
                }
            } else {
                blockTreeUtils.traverseRecursively(newBlock.__globalBlockTree.blocks, b => {
                    b._cref = _crefOrCrefs[b.id];
                    treeStateMutRef[b.id] = createTreeStateItem();
                });
            }
        })
        .then(() => {
            // Commit to state
            const branch = blockTreeUtils.findBlock(origBlock.id, this.getTreeFor(origBlock))[1];
            branch[branch.indexOf(origBlock)] = newBlock; // mutates this.state.blockTree or globalBlockTreeBlocks.someTree
            this.setState({blockTree: this.state.blockTree,
                           treeState: treeStateMutRef});
        });
    }
    /**
     * @param {Block} placeholderBlock
     * @access private
     */
    confirmAddBlock(placeholderBlock) {
        const treeState = this.state.treeState;
        treeState[placeholderBlock.id].isNew = false;
        //
        if (placeholderBlock.type === 'GlobalBlockReference') {
            globalBlockTreeBlocks.set(placeholderBlock.globalBlockTreeId, placeholderBlock.__globalBlockTree.blocks);
            placeholderBlock.__globalBlockTree.blocks = globalBlockTreeBlocks.get(placeholderBlock.globalBlockTreeId);
            blockTreeUtils.traverseRecursively(placeholderBlock.__globalBlockTree.blocks[0].children,
                ({_cref}) => BlockTrees.currentWebPage.registerBlockMouseListeners(_cref));
        }
        this.setState({treeState: treeState});
        //
        store.dispatch(pushItemToOpQueue(`append-${placeholderBlock.isStoredTo}-block`, {
            doHandle: this.props.onChangesApplied,
            args: [this.getTreeFor(placeholderBlock), placeholderBlock.isStoredTo,
                   placeholderBlock.globalBlockTreeId || null],
        }));
    }
    /**
     * @param {Block} placeholderBlock
     * @access private
     */
    cancelAddBlock(placeholderBlock) {
        const [block, containingBranch] = blockTreeUtils.findBlock(placeholderBlock.id, this.getTreeFor(placeholderBlock));
        BlockTrees.currentWebPage.deleteBlockFromDom(block);
        this.deleteBlock(block, containingBranch);
    }
    /**
     * @param {Block} block
     * @access private
     */
    handleItemClicked(block) {
        this.selectedRoot = block;
        const mutRef = this.state.treeState;
        const base = block.isStoredTo !== 'globalBlockTree'
            ? null
            : blockTreeUtils.findRecursively(this.state.blockTree,
                ({globalBlockTreeId}) => globalBlockTreeId === block.globalBlockTreeId);
        this.emitItemClickedOrAppendedSignal('clicked', block, base);
        if (mutRef[block.id].isSelected) return;
        //
        if (block.parentBlockIdPath) {
            const ids = block.parentBlockIdPath.split('/'); // '/foo/bar' -> ['', 'foo', 'bar']
            ids.shift();                                    //            -> ['foo', 'bar']
            ids.forEach(id => { mutRef[id].isCollapsed = false; });
        }
        //
        this.setState({treeState: this.setBlockAsSelected(block, mutRef)});
    }
    /**
     * @param {Block} block
     * @param {Array<Block>} containingBranch
     * @access private
     */
    deleteBlock(block, containingBranch) {
        containingBranch.splice(containingBranch.indexOf(block), 1); // Note: mutates this.state.blockTree or globalBlockTreeBlocks.someTree
        const mutRef = this.state.treeState;
        for (const c of block.children) delete mutRef[c.id];
        delete mutRef[block.id]; // Mutates this.state.treeState
        this.setState({blockTree: this.state.blockTree,
                       treeState: mutRef});
    }
    /**
     * @param {Array<Block>} targetBranch
     * @param {Block} block
     * @access private
     */
    getAfter(targetBranch, block) {
        return targetBranch.length
            // Use block as `after`
            ? targetBranch[targetBranch.length - 1]
            // Use comment|pseudoComment as `after`
            : targetBranch !== this.state.blockTree
                ? {parentNode: block.getRootDomNode(), nextSibling: null}
                : this.lastRootBlockMarker;
    }
    /**
     * @param {Block} block
     * @param {Event} e
     * @access private
     */
    openMoreMenu(block, e) {
        this.setState({blockWithNavOpened: block});
        this.contextMenu.current.open(e, links => {
            if (block.type === 'GlobalBlockReference')
                return links.filter(({id}) => id !== 'convert-block-to-global' &&
                                              id !== 'clone-block');
            return links;
        });
    }
    /**
     * @param {Block} block
     * @access private
     */
    toggleBranchIsCollapsed(block) {
        const mutRef = this.state.treeState;
        mutRef[block.id].isCollapsed = !mutRef[block.id].isCollapsed;
        this.setState({treeState: mutRef});
    }
    /**
     * @param {Block} block
     * @param {Object} treeStateMutRef
     * @returns {Object}
     * @access private
     */
    setBlockAsSelected(block, treeStateMutRef) {
        for (const key in treeStateMutRef) treeStateMutRef[key].isSelected = false;
        treeStateMutRef[block.id].isSelected = true;
        this.selectedRoot = block;
        return treeStateMutRef;
    }
    /**
     * @access private
     */
    deSelectAllBlocks() {
        const mutRef = this.state.treeState;
        for (const key in mutRef) mutRef[key].isSelected = false;
        this.selectedRoot = null;
        this.setState({treeState: mutRef, blockWithNavOpened: null});
    }
    /**
     * @param {'clicked'|'focus-requested'} name
     * @param {Block} block
     * @param {Block|null} base
     * @access private
     */
    emitItemClickedOrAppendedSignal(name, block, base) {
        signals.emit(`on-block-tree-item-${name}`, block, base, this);
    }
    /**
     * @param {Block} block The parent block
     * @param {'after'|'as-child'} position
     * @param {Boolean} autoFocus
     * @access private
     */
    doAppendBlockAndUpdateState(block, position, autoFocus) {
        this.appendNewBlockPlaceholder(block, position,
            (state, newBlock) => {
                state.treeState = this.setBlockAsSelected(newBlock, state.treeState);
                state.treeState[newBlock.id].isNew = false;
                return state;
            }).then(newBlock => {
                if (autoFocus)
                    this.emitItemClickedOrAppendedSignal('focus-requested', newBlock, null);
            });
    }
    /**
     * @access private
     */
    showBlockTreeHelpPopup() {
        alert('todo');
    }
}

/**
 * @param {Object} overrides = {}
 * @returns {{isSelected: Boolean; isCollapsed: Boolean; isNew: Boolean;}}
 */
function createTreeStateItem(overrides = {}) {
    return Object.assign({
        isSelected: false,
        isCollapsed: false,
        isNew: false,
    }, overrides);
}

/**
 * @param {Array<Block>} blockTree
 * @returns {Block|null}
 */
function getLastPageBlock(blockTree) {
    return blockTree.reduce((last, b) => b.isStoredTo === 'page' ? b : last, null);
}

/**
 * @param {Array<RawBlock>} branchRaw
 * @param {Array<Block>} containingBlockTree i.e. BlockTree.state.blockTree
 * @param {String} globalBlockTreeId
 * @returns {Array<Block>}
 */
function turnBranchToGlobal(branchRaw, containingBlockTree, globalBlockTreeId) {
    // Find each corresponding block from currentContainingBranch
    const currentBlocks = blockTreeUtils.mapRecursively(branchRaw, sbRaw =>
        blockTreeUtils.findBlock(sbRaw.id, containingBlockTree)[0]
    );
    // Turn them from normal block to a global tree block
    blockTreeUtils.traverseRecursively(currentBlocks, block => {
        normalizeGlobalBlockTreeBlock(block, globalBlockTreeId);
    });
    // Store and return
    globalBlockTreeBlocks.set(globalBlockTreeId, currentBlocks);
    return globalBlockTreeBlocks.get(globalBlockTreeId);
}

/**
 * @param {Block} block
 * @return {Block} block.__globalBlockTree.blocks[0] or block
 */
function getVisibleBlock(block) {
    return block.type !== 'GlobalBlockReference'
        ? block
        : block.__globalBlockTree.blocks[0];
}

export default BlockTree;
