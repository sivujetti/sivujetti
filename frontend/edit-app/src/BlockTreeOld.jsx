import {__, signals, http, api, floatingDialog, Icon} from '@sivujetti-commons-for-edit-app';
import ContextMenu from './commons/ContextMenu.jsx';
import BlockTypeSelector, {normalizeGlobalBlockTreeBlock} from './BlockTypeSelector.jsx';
import BlockTreeShowHelpPopup from './BlockTreeShowHelpPopup.jsx';
import Block from './Block.js';
import blockTreeUtils, {isGlobalBlockTreeRefOrPartOfOne} from './blockTreeUtils.js';
import store, {observeStore, createSelectBlockTree, createSetBlockTree, pushItemToOpQueue,
               selectCurrentPageDataBundle} from './store.js';
import BlockTreeDragDrop from './BlockTreeDragDropOld.js';
import ConvertBlockToGlobalDialog from './ConvertBlockToGlobalBlockTreeDialog.jsx';
import {getIcon} from './block-types/block-types.js';
import {createBlockFromType, findRefBlockOf, isTreesOutermostBlock} from './Block/utils.js';

let BlockTrees;
const globalBlockTreeBlocks = new Map;
/** @type {Page} */
let pageCurrentlyLoading;

class BlockTree extends preact.Component {
    // selectedRoot;
    // contextMenu;
    // lastRootBlockMarker;
    // unregistrablesLong;
    // unregistrablesShort;
    // dragDrop;
    // onDragStart;
    // onDragOver;
    // onDrop;
    /**
     * @param {{blocksInput: Array<RawBlock>; onChangesApplied?: (blockTree: Array<Block>, blockIsStoredTo: 'page'|'globalBlockTree', globalBlockTreeId: String|null) => Promise<Boolean>; BlockTrees: preact.ComponentClass; disablePageInfo?: Boolean;}} props
     */
    constructor(props) {
        super(props);
        this.state = {blockTree: null, treeState: null, blockWithNavOpened: null};
        this.selectedRoot = null;
        this.contextMenu = preact.createRef();
        this.lastRootBlockMarker = null;
        this.currentAddBlockTarget = null;
        this.dragDrop = new BlockTreeDragDrop(this, (mutatedTree, {dragBlock, dropBlock, dropPosition, doRevert}) => {
            const tree = dragBlock.isStoredTo !== 'globalBlockTree' ? mutatedTree : this.getTreeFor(dragBlock, true);
            //
            this.setState({blockTree: mutatedTree});
            BlockTrees.currentWebPage.reOrderBlocksInDom(dragBlock, dropBlock, dropPosition);
            const boundUndo = () => {
                const info = doRevert();
                this.setState({blockTree: this.state.blockTree});
                BlockTrees.currentWebPage.reOrderBlocksInDom(dragBlock, info.referenceBlock, info.revertPosition);
            };
            //
            store.dispatch(pushItemToOpQueue(`swap-${dragBlock.isStoredTo}-blocks`, {
                doHandle: this.props.onChangesApplied,
                doUndo: boundUndo,
                args: dragBlock.isStoredTo !== 'globalBlockTree'
                    ? [tree, dragBlock.isStoredTo, null]
                    : [tree, dragBlock.isStoredTo, dragBlock.globalBlockTreeId],
            }));
        });
        BlockTrees = props.BlockTrees;
        this.unregistrablesLong = [];
        this.unregistrablesShort = [];
    }
    /**
     * @param {Block} block After
     * @param {String|null} initialText = null
     * @param {Boolean} autoFocus = true
     * @access public
     */
    appendBlockToTreeAfter(block, initialText = null, autoFocus = true) {
        this.doAppendBlockAndUpdateState(block, 'after', initialText, autoFocus);
    }
    /**
     * @param {Block} block The parent block
     * @param {Boolean} autoFocus = true
     * @access public
     */
    appendBlockToTreeAsChildOf(block, autoFocus = true) {
        this.doAppendBlockAndUpdateState(block, 'as-child', null, autoFocus);
    }
    /**
     * @param {Block|Array<Block>|undefined} context = this.state.blockTree
     * @param {'after'|'as-child'} position = 'after'
     * @param {(state: {blockTree: Array<Block>; treeState: {[key: String]: TreeStateItem;};}, newBlock: Block) => {blockTree: Array<Block>; treeState: {[key: String]: TreeStateItem;};}} alterState = null
     * @param {String|null} initialText = null
     * @returns {Promise<Block>}
     * @access public
     */
    appendNewBlockPlaceholder(context = this.state.blockTree,
                              position = 'after',
                              alterState = null,
                              initialText = null) {
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
            this.currentAddBlockTarget = context;
            toArr = context.children;
            after = this.getAfter(toArr, context);
        } else if (position === 'as-child' && Array.isArray(context)) {
            throw new Error('Invalid usage (arr, "as-child"), should be (arr[position], "as-child")');
        }
        //
        const newBlock = Block.fromType(
            'Paragraph',
            initialText === null ? undefined : {text: initialText}, // data
            undefined,                                              // id
            context instanceof Block ? context.globalBlockTreeId : undefined,
        );
        return BlockTrees.currentWebPage.appendBlockToDom(newBlock, after).then(_cref => {
            newBlock._cref = _cref;
            toArr.splice(toArr.indexOf(after) + 1, 0, newBlock); // Note: mutates this.state.blockTree or globalBlockTreeBlocks.someTree
            //
            const newState = (alterState || function (s, _) { return s; })({
                blockTree: this.state.blockTree,
                treeState: Object.assign(this.state.treeState,
                    {[newBlock.id]: createTreeStateItem({isNew: true})})
            }, newBlock);
            this.setState(newState);
            return {newState, newBlock};
        }).then(({newState, newBlock}) => {
            if (newState.treeState[newBlock.id].isNew)
                signals.emit('on-block-tree-placeholder-block-appended', newBlock, position, after);
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
     * @param {Block} block
     * @param {Boolean} isDirectClick = true
     * @access public
     */
    handleItemClicked(block, isDirectClick = true) {
        if (this.isNewBlock(block)[0]) return;
        this.selectedRoot = block;
        const mutRef = this.state.treeState;
        const base = block.isStoredTo !== 'globalBlockTree'
            ? null
            : blockTreeUtils.findRecursively(this.state.blockTree,
                ({globalBlockTreeId}) => globalBlockTreeId === block.globalBlockTreeId);
        this.emitItemClickedOrAppendedSignal('focus-requested', block, base);
        if (isDirectClick) this.emitItemClickedOrAppendedSignal('clicked', block, base);
        //
        if (!base) {
            const ids = findBlockWithParentIdPath(this.state.blockTree, ({id}, path) => {
                if (id !== block.id) return null;
                // Found block, has no children
                if (!path) return [block.id];
                // Found block, has children
                return splitPath(path);
            });
            ids.concat(block.id).forEach(id => { mutRef[id].isCollapsed = false; });
        } else {
            mutRef[getVisibleBlock(base).id].isCollapsed = false;
        }
        //
        this.setState({treeState: this.setBlockAsSelected(block, mutRef)});
    }
    /**
     * Tells if $block or it's parent is a new (placeholder) block.
     *
     * @param {Block} block
     * @returns {[Boolean, Block|null]}
     * @access public
     */
    isNewBlock(block) {
        if (block.isStoredTo === 'globalBlockTree') {
            const base = blockTreeUtils.findRecursively(this.state.blockTree,
                ({globalBlockTreeId}) => globalBlockTreeId === block.globalBlockTreeId);
            const outermost = base.__globalBlockTree.blocks[0];
            const isNew = this.getTreeStateOf(outermost).isNew;
            return [isNew, isNew ? outermost : null];
        }
        let isNew = this.getTreeStateOf(block).isNew;
        let outermostBlockId = block.id;
        if (!isNew) {
            const tree = this.state.blockTree;
            const parentPath = findBlockWithParentIdPath(tree, (b, p) => {
                return b.id === block.id ? p : null;
            });
            if (parentPath) {
                const outermost = splitPath(parentPath)[0];
                if (this.getTreeStateOf(outermost).isNew) {
                    isNew = true;
                    outermostBlockId = outermost;
                }
            }
        }
        return [isNew, !isNew ? null : blockTreeUtils.findBlock(outermostBlockId, this.state.blockTree)[0]];
    }
    /**
     * @access protected
     */
    componentWillMount(props = this.props) {
        const blockRefs = BlockTrees.currentWebPageBlockRefs;
        const treeState = {};
        const createBlockAndPutToState = (blockRaw, treeStateOverrides = {}) => {
            const block = Block.fromObject(blockRaw);
            block._cref = blockRefs.find(({blockId}) => blockId === block.id);
            treeState[block.id] = createTreeStateItem(treeStateOverrides);
            return block;
        };
        globalBlockTreeBlocks.clear();
        const blockTree = blockTreeUtils.mapRecursively(props.blocksInput, blockRaw => {
            const out = createBlockAndPutToState(blockRaw);
            if (blockRaw.type === 'GlobalBlockReference') {
                if (!globalBlockTreeBlocks.has(blockRaw.globalBlockTreeId))
                    globalBlockTreeBlocks.set(blockRaw.globalBlockTreeId, blockTreeUtils.mapRecursively(out.__globalBlockTree.blocks, sbRaw => {
                        normalizeGlobalBlockTreeBlock(sbRaw, blockRaw.globalBlockTreeId);
                        return createBlockAndPutToState(sbRaw, sbRaw.id !== out.__globalBlockTree.blocks[0].id ? undefined : {isCollapsed: true});
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
        this.unregistrablesLong.push(signals.on('on-inspector-panel-closed', () => {
            this.deSelectAllBlocks();
        }));
        //
        this.onDragStart = this.dragDrop.handleDragStarted.bind(this.dragDrop);
        this.onDragOver = this.dragDrop.handleDraggedOver.bind(this.dragDrop);
        this.onDrop = this.dragDrop.handleDraggableDropped.bind(this.dragDrop);
        this.onDragEnd = this.dragDrop.handleDragEnded.bind(this.dragDrop);
    }
    /**
     * @param {Array<String>} currentPageTrids
     * @access private
     */
    registerOrReRegisterBlockTreeListeners(currentPageTrids) {
        //
        this.unregistrablesShort.forEach(unreg => unreg());
        this.unregistrablesShort = [];
        const refreshAllEvents = [
            'add-single-block',
            'undo-add-single-block',
            'delete-single-block',
            'undo-delete-single-block',
            'swap-blocks',
            'undo-swap-blocks',
        ];
        const [onMainTreeChanged, onInnerTreeChanged] = [({tree, context}) => {
            if (pageCurrentlyLoading) return;
            if (refreshAllEvents.indexOf(context[0]) > -1) {
                this.setState({blockTree: tree, treeState: createTreeState(tree, context[0] !== 'init')});
            }
        }, ({tree, context}) => {
            if (pageCurrentlyLoading) return;
            if (context[0] === 'init' && tree.length && !this.state.treeState[tree[0].id]) {
                const newTreeTreeState = createTreeState(tree);
                this.setState({treeState: Object.assign({}, this.state.treeState, newTreeTreeState)});
            } else if (refreshAllEvents.indexOf(context[0]) > -1) {
                this.setState({treeState: createTreeState(tree, true)});
            }
        }];
        for (const trid of currentPageTrids) {
            this.unregistrablesShort.push(observeStore(createSelectBlockTree(trid), trid === 'main'
                ? onMainTreeChanged
                : onInnerTreeChanged));
        }
        this.currentPageIsPlaceholder = selectCurrentPageDataBundle(store.getState()).page.isPlaceholderPage;
        //
        const storeState = store.getState();
        const treeState = {};
        for (const trid of currentPageTrids) {
            Object.assign(treeState, createTreeState(createSelectBlockTree(trid)(storeState).tree));
        }
        this.setState(Object.assign(
            // predux has a weird bug where the value of state.treeState does not
            // get updatd in render() after calling setState here. Using a "swap"
            // object fixes this.
            !!this.state.treeState && !this.state.treeStateSwap
                ? {treeStateSwap: treeState, treeState: null}  // use treeStateSwap in next render()
                : {treeStateSwap: null, treeState: treeState}, // use treeState in next render()
            {blockTree: createSelectBlockTree('main')(storeState).tree}
        ));
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unregistrablesShort.forEach(unreg => unreg());
        this.unregistrablesLong.forEach(unreg => unreg());
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
            if (treeState[block.id].isNew) return <li data-placeholder-block-id={ getVisibleBlock(block).id } key={ block.id }>
                <BlockTypeSelector
                    block={ block }
                    tree={ blockTree }
                    targetParentBlock={ this.currentAddBlockTarget }
                    onSelectionChanged={ this.replacePlaceholderBlock.bind(this) }
                    onSelectionConfirmed={ this.confirmAddBlock.bind(this) }
                    onSelectionDiscarded={ this.cancelAddBlock.bind(this) }/>
            </li>;
            //
            if (block.type !== 'PageInfo') {
            const visible = getVisibleBlock(block);
            const type = api.blockTypes.get(visible.type);
            return <li
                onDragStart={ this.onDragStart }
                onDragOver={ this.onDragOver }
                onDrop={ this.onDrop }
                onDragEnd={ this.onDragEnd }
                class={ [`${visible.isStoredTo}-block`,
                         !treeState[visible.id].isSelected ? '' : ' selected',
                         !treeState[visible.id].isCollapsed ? '' : ' collapsed',
                         !visible.children.length ? '' : ' with-children'].join('') }
                data-block-id={ visible.id }
                data-base-block-id={ block.id }
                data-block-tree-id={ block.isStoredTo !== 'globalBlockTree' ? '' : block.globalBlockTreeId }
                key={ block.id }
                draggable>
                { !visible.children.length
                    ? null
                    : <button onClick={ () => this.toggleBranchIsCollapsed(visible) } class="toggle p-absolute" type="button"><Icon iconId="chevron-down" className="size-xs"/></button>
                }
                <div class="d-flex">
                    <button onClick={ () => this.handleItemClicked(visible) } class="block-handle columns text-ellipsis" type="button">
                        <Icon iconId={ getIcon(type) } className="size-xs mr-1"/>
                        <span class="text-ellipsis">{ getShortFriendlyName(visible, type) }</span>
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
                    <button
                        onClick={ () => !this.props.disablePageInfo ? this.handleItemClicked(block) : function(){} }
                        class="block-handle columns"
                        type="button"
                        disabled={ this.props.disablePageInfo }>
                        <Icon iconId={ getIcon('PageInfo') } className="size-xs mr-1"/>
                        { block.title || __(block.type) }
                    </button>
                </div>
            </li>;
        });
        return <div class="py-2">
            <div class="p-relative" style="z-index: 1"><button
                onClick={ this.showBlockTreeHelpPopup.bind(this) }
                class="btn btn-link p-absolute btn-sm pt-1"
                type="button"
                style="right: 0;top: 0;">
                <Icon iconId="info-circle" className="size-xs"/>
            </button></div>
            <ul class="block-tree" data-sort-group-id="r">{
                blockTree.length
                    ? renderBranch(blockTree).concat(<li
                        data-last="y"
                        onDragOver={ this.onDragOver }
                        onDrop={ this.onDrop }
                        onDragEnd={ this.onDragEnd }
                        draggable><div class="d-flex">&nbsp;</div></li>)
                    : <li>-</li>
            }</ul>
            <ContextMenu
                links={ [
                    {text: __('Add child content'), title: __('Add child content'), id: 'add-child'},
                    {text: __('Clone'), title: __('Clone content'), id: 'clone-block'},
                    {text: __('Delete'), title: __('Delete content'), id: 'delete-block'},
                    {text: __('Convert to global'), title: __('Convert to global content'), id: 'convert-block-to-global'},
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
        if (link.id === 'add-paragraph-after') {
            this.addParagraph(this.state.blockWithNavOpened, 'after');
        } else if (link.id === 'add-paragraph-child') {
            this.addParagraph(this.state.blockWithNavOpened, 'as-child');
        } else if (link.id === 'add-child') {
            const possibleChild = getVisibleBlock(this.state.blockWithNavOpened);
            const id = possibleChild.id;
            this.appendNewBlockPlaceholder(possibleChild, 'as-child',
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
            })
            .then(newBlock => {
                signals.emit('on-block-tree-block-cloned', clonedBlock);
                return newBlock;
            });
            this.pushCommitChangesOp(clonedBlock);
        } else if (link.id === 'delete-block') {
            const blockToDelete = this.state.blockWithNavOpened;
            const visible = getVisibleBlock(blockToDelete);
            const isSelectedRootCurrentlyClickedBlock = () => {
                if (!this.selectedRoot)
                    return false;
                return this.selectedRoot === visible;
            };
            const isSelectedRootChildOfCurrentlyClickedBlock = () => {
                if (!this.selectedRoot)
                    return false;
                if (!visible.children.length)
                    return false;
                return !!blockTreeUtils.findRecursively(visible.children,
                    b => b.id === this.selectedRoot.id);
            };
            //
            const wasCurrentlySelectedBlock = isSelectedRootCurrentlyClickedBlock() ||
                                            isSelectedRootChildOfCurrentlyClickedBlock();
            if (wasCurrentlySelectedBlock) this.selectedRoot = null;
            const [toArr, after] = this.getSurroundings(blockToDelete);
            const originalContents = BlockTrees.currentWebPage.getBlockContents(blockToDelete);
            this.cancelAddBlock(blockToDelete);
            //
            const boundUndo = () => {
                BlockTrees.currentWebPage.restoreBlockToDom(originalContents, after).then(() => {
                    toArr.splice(toArr.indexOf(after) + 1, 0, blockToDelete); // Note: mutates this.state.blockTree or globalBlockTreeBlocks.someTree
                    //
                    const treeStateMutRef = this.state.treeState;
                    blockTreeUtils.traverseRecursively([blockToDelete], b => {
                        treeStateMutRef[b.id] = createTreeStateItem(); // Note: mutates this.state.treeState
                    });
                    this.setState({blockTree: this.state.blockTree, treeState: treeStateMutRef});
                });
            };
            store.dispatch(pushItemToOpQueue(`delete-${blockToDelete.isStoredTo}-block`, {
                doHandle: this.props.onChangesApplied,
                doUndo: boundUndo,
                args: [this.getTreeFor(blockToDelete),
                       blockToDelete.isStoredTo,
                       blockToDelete.globalBlockTreeId || null],
            }));
            signals.emit('on-block-deleted', blockToDelete, wasCurrentlySelectedBlock);
        } else if (link.id === 'convert-block-to-global') {
            const blockTreeToStore = this.state.blockWithNavOpened;
            floatingDialog.open(ConvertBlockToGlobalDialog, {
                title: __('Convert to global'),
                height: 238,
            }, {
                blockToConvertAndStore: blockTreeToStore,
                onConfirmed: data => this.doConvertBlockToGlobal(data, blockTreeToStore),
            });
        }
    }
    addParagraph(openBlock, where) {
        let trid = openBlock.isStoredToTreeId;
        if (trid !== 'main' && where === 'after' && isTreesOutermostBlock(openBlock, createSelectBlockTree(trid)(store.getState()).tree)) {
            trid = 'main';
            openBlock = findRefBlockOf(openBlock, createSelectBlockTree('main')(store.getState()).tree);
        }
        const newBlock = createBlockFromType('Paragraph', trid);
        const {tree} = createSelectBlockTree(trid)(store.getState());
        const treeBefore = JSON.parse(JSON.stringify(tree));
        if (where === 'after') {
            const [after, branch] = blockTreeUtils.findBlock(openBlock.id, tree);
            branch.splice(branch.indexOf(after) + 1, 0, newBlock); // Mutates $tree temporarily
        } else if (where === 'as-child') {
            openBlock.children.push(newBlock); // Mutates $tree temporarily
        } else {
            throw new Error('Invalid where');
        }
        store.dispatch(createSetBlockTree(trid)(tree, ['add-single-block',
            newBlock.id, newBlock.type, trid]));
        store.dispatch(pushItemToOpQueue(`append-block-to-tree#${trid}`, {
            doHandle: trid !== 'main' || !this.currentPageIsPlaceholder
                ? () => BlockTrees.saveExistingBlocksToBackend(createSelectBlockTree(trid)(store.getState()).tree, trid)
                : null
            ,
            doUndo: () => {
                store.dispatch(createSetBlockTree(trid)(treeBefore, ['undo-add-single-block',
                    newBlock.id, newBlock.type, trid]));
            },
            args: [],
        }));
    }
    /**
     * @param {RawGlobalBlockTree} data
     * @param {Block} originalBlock The block tree we just turned global
     * @access private
     */
    doConvertBlockToGlobal(data, originalBlock) {
        // todo emit to queue
        // todo start loadState
        const postData = {
            name: data.name,
            blocks: data.blocks,
        };
        return http.post('/api/global-block-trees', postData).then(resp => {
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
        this.deleteFromTreeState(origBlock, treeStateMutRef);
        // Replace root block
        const newBlock = Block.fromType(blockBluePrint.blockType,
                                        blockBluePrint.data,
                                        origBlock.id,
                                        origBlock.type !== 'GlobalBlockReference' ? origBlock.globalBlockTreeId : undefined);
        newBlock._cref = origBlock._cref;
        BlockTrees.currentWebPage.replaceBlockFromDomWith(origBlock, newBlock).then(_crefOrCrefs => {
            this.addToTreeState(newBlock, treeStateMutRef);
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
                if (!globalBlockTreeBlocks.get(newBlock.globalBlockTreeId)) {
                    globalBlockTreeBlocks.set(newBlock.globalBlockTreeId, newBlock.__globalBlockTree.blocks);
                    newBlock.__globalBlockTree.blocks = globalBlockTreeBlocks.get(newBlock.globalBlockTreeId);
                }
                blockTreeUtils.traverseRecursively(newBlock.__globalBlockTree.blocks, b => {
                    b._cref = _crefOrCrefs[b.id];
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
        const treeStateMutRef = this.state.treeState;
        treeStateMutRef[placeholderBlock.id].isNew = false;
        //
        if (placeholderBlock.type === 'GlobalBlockReference') {
            blockTreeUtils.traverseRecursively(placeholderBlock.__globalBlockTree.blocks[0].children,
                ({_cref}) => BlockTrees.currentWebPage.registerBlockMouseListeners(_cref));
            treeStateMutRef[placeholderBlock.__globalBlockTree.blocks[0].id].isNew = false;
        }
        this.currentAddBlockTarget = null;
        this.setState({treeState: treeStateMutRef});
        //
        this.pushCommitChangesOp(placeholderBlock);
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
     * @param {Array<Block>} containingBranch
     * @access private
     */
    deleteBlock(block, containingBranch) {
        containingBranch.splice(containingBranch.indexOf(block), 1); // Note: mutates this.state.blockTree or globalBlockTreeBlocks.someTree
        const mutRef = this.state.treeState;
        this.deleteFromTreeState(block, mutRef);
        this.setState({blockTree: this.state.blockTree,
                       treeState: mutRef});
    }
    /**
     * @param {Block} block
     * @param {Object} treeStateMutRef
     * @access private
     */
    addToTreeState(newBlock, treeStateMutRef) {
        treeStateMutRef[newBlock.id] = createTreeStateItem({isNew: true});
        //
        if (newBlock.type === 'GlobalBlockReference')
            blockTreeUtils.traverseRecursively(newBlock.__globalBlockTree.blocks, (b, i, i2) => {
                treeStateMutRef[b.id] = createTreeStateItem((i + i2) > 0 ? undefined : {isNew: true});
            });
    }
    /**
     * @param {Block} block
     * @param {Object} treeStateMutRef
     * @access private
     */
    deleteFromTreeState(origBlock, treeStateMutRef) {
        for (const block of origBlock.children)
            delete treeStateMutRef[block.id];
        delete treeStateMutRef[origBlock.id];
        //
        if (origBlock.type === 'GlobalBlockReference')
            blockTreeUtils.traverseRecursively(origBlock.__globalBlockTree.blocks, b => {
                delete treeStateMutRef[b.id];
            });
    }
    /**
     * @param {Array<Block>} targetBranch
     * @param {Block} block
     * @returns {Block|{parentNode: HTMLElement|null; nextSibling: HTMLElement|null;}}
     * @access private
     */
    getAfter(targetBranch, block, at = null) {
        return targetBranch.length
            // Use block as `after`
            ? targetBranch[(at === null ? targetBranch.length : at) - 1]
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
     * @param {String|null} initialText
     * @param {Boolean} autoFocus
     * @access private
     */
    doAppendBlockAndUpdateState(block, position, initialText, autoFocus) {
        this.appendNewBlockPlaceholder(block, position, (state, newBlock) => {
            state.treeState = this.setBlockAsSelected(newBlock, state.treeState);
            state.treeState[newBlock.id].isNew = false;
            return state;
        }, initialText).then(newBlock => {
            this.pushCommitChangesOp(newBlock);
            if (autoFocus) this.emitItemClickedOrAppendedSignal(
                'focus-requested',
                newBlock,
                block.isStoredTo !== 'globalBlockTree' ? null : blockTreeUtils.findRecursively(this.state.blockTree, sb =>
                    sb.type === 'GlobalBlockReference' && sb.globalBlockTreeId === block.globalBlockTreeId
                )
            );
        });
    }
    /**
     * @access private
     */
    showBlockTreeHelpPopup() {
        floatingDialog.open(BlockTreeShowHelpPopup, {
            title: __('Content tree'),
            width: 448,
        }, {});
    }
    /**
     * @param {Block} block
     * @returns {[Array<Block>, Block|{parentNode: HTMLElement|null; nextSibling: HTMLElement|null;}]}
     * @access private
     */
    getSurroundings(block) {
        const [_, branch, parent] = blockTreeUtils.findBlock(
            block.id,
            !isGlobalBlockTreeRefOrPartOfOne(block)
                ? this.state.blockTree
                : this.getTreeFor(block)
        );
        const at = branch.indexOf(block);
        return [branch, at > 0 ? this.getAfter(branch, block, at) : parent];
    }
    /**
     * @param {Block} block
     * @access private
     */
    pushCommitChangesOp(block) {
        store.dispatch(pushItemToOpQueue(`append-${block.isStoredTo}-block`, {
            doHandle: this.props.onChangesApplied,
            doUndo(_$tree, _$blockIsStoredTo, _$blockTreeId, $block, $this) {
                $this.cancelAddBlock($block);
            },
            args: [this.getTreeFor(block), block.isStoredTo, block.globalBlockTreeId || null, block, this],
        }));
    }
    /**
     * @param {Block|String} blockOrBlockId
     * @returns {BlockTreeItemState|undefined}
     * @access private
     */
    getTreeStateOf(blockOrBlockId) {
        const id = typeof blockOrBlockId !== 'string' ? blockOrBlockId.id : blockOrBlockId;
        return this.state.treeState[id];
    }
}

/**
 * @param {Object} overrides = {}
 * @returns {BlockTreeItemState}
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
    const getLastBlockTreeBlock = () => blockTree[blockTree.length - 1];
    /** @type {Array<LayoutPart>} */
    const structure = BlockTrees.currentWebPage.data.layout.structure;
    const firstGlobalTreeRefAfterPageContents = structure[structure.findIndex(({type}) => type === 'pageContents') + 1] || null;
    //
    if (!firstGlobalTreeRefAfterPageContents)
        return getLastBlockTreeBlock();
    //
    const getPrevious = indexOfFirstGlobalTreeRefAfter =>
        indexOfFirstGlobalTreeRefAfter > 0 ? blockTree[indexOfFirstGlobalTreeRefAfter - 1] : getLastBlockTreeBlock()
    ;
    return getPrevious(blockTree.findIndex(({type, globalBlockTreeId}) =>
        type === 'GlobalBlockReference' &&
        globalBlockTreeId === firstGlobalTreeRefAfterPageContents.globalBlockTreeId
    ));
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
 * @returns {Block} block.__globalBlockTree.blocks[0] or block
 */
function getVisibleBlock(block) {
    return block.type !== 'GlobalBlockReference'
        ? block
        : block.__globalBlockTree.blocks[0];
}

/**
 * @param {Block} block
 * @param {BlockType} type
 * @returns {String}
 */
function getShortFriendlyName(block, type) {
    if (block.title)
        return block.title;
    const translated = __(type.friendlyName);
    return translated.split(': ')[1] || translated; // 'Plugin: Foo' -> 'Foo'
}

/**
 * @param {BlockRefComment} blockRef
 * @param {preact.Component} blockTreeCmp
 * @returns {Block|null}
 */
function findBlockTemp(blockRef, blockTreeCmp) {
    // todo optimize this out by adding isStoredTo to BlockRefComment and then globalBlockTreeBlocks.get(blockRef.treeId)
    let block = blockTreeUtils.findRecursively(blockTreeCmp.getTree(), ({id}) => id === blockRef.blockId);
    if (!block) {
        for (const [_, tree2] of blockTreeCmp.getGlobalTrees()) {
            block = blockTreeUtils.findRecursively(tree2, ({id}) => id === blockRef.blockId);
            if (block) break;
        }
    }
    return block;
}

/**
 * @param {Array<Block>} blocks
 * @param {(block: Block, parentIdPath: String) => any} fn
 * @param {String} parentIdPath
 * @returns {any}
 */
function findBlockWithParentIdPath(blocks, fn, parentIdPath = '') {
    for (const block of blocks) {
        const ret = fn(block, parentIdPath);
        if (ret) return ret;
        if (block.children.length) {
            const ret2 = findBlockWithParentIdPath(block.children, fn, `${parentIdPath}/${block.id}`);
            if (ret2) return ret2;
        }
    }
}

/**
 * @param {String} path e.g. '/foo/bar'
 * @returns {Array<String>} e.g. ['foo', 'bar']
 */
function splitPath(path) {
    const pieces = path.split('/'); // '/foo/bar' -> ['', 'foo', 'bar']
    pieces.shift();                 //            -> ['foo', 'bar']
    return pieces;
}

/**
 * @param {Array<RawBlock2>} tree
 * @param {Boolean} full = false
 * @returns {{[key: String]: BlockTreeItemState;}}
 */
function createTreeState(tree, full = false) {
    const out = {};
    if (!full) {
        blockTreeUtils.traverseRecursively(tree, block => {
            out[block.id] = createTreeStateItem();
        });
    } else {
        blockTreeUtils.traverseRecursively(createSelectBlockTree('main')(store.getState()).tree, block => {
            if (block.type !== 'GlobalBlockReference')
                out[block.id] = createTreeStateItem();
            else {
                const trid = block.globalBlockTreeId;
                blockTreeUtils.traverseRecursively(createSelectBlockTree(trid)(store.getState()).tree, block2 => {
                    out[block2.id] = createTreeStateItem();
                });
            }
        });
    }
    return out;
}

export default BlockTree;
export {findBlockTemp};
