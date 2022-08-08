import {__, signals, http, api, floatingDialog, Icon} from '@sivujetti-commons-for-edit-app';
import ContextMenu from './commons/ContextMenu.jsx';
import {generatePushID} from './commons/utils.js';
import BlockTreeShowHelpPopup from './BlockTreeShowHelpPopup.jsx';
import Block from './Block.js';
import blockTreeUtils, {isGlobalBlockTreeRefOrPartOfOne} from './blockTreeUtils.js';
import store, {observeStore, createSelectBlockTree, createSetBlockTree, pushItemToOpQueue} from './store.js';
import BlockTreeDragDrop from './BlockTreeDragDrop.js';
import ConvertBlockToGlobalDialog from './ConvertBlockToGlobalBlockTreeDialog.jsx';
import {getIcon} from './block-types/block-types.js';
import {cloneDeep, createBlockFromType, findRefBlockOf, isTreesOutermostBlock,
        treeToTransferable} from './Block/utils.js';
import BlockDnDSpawner from './Block/BlockDnDSpawner.jsx';

let BlockTrees;
const globalBlockTreeBlocks = new Map;
const unregistrables = [];
let currentInstance;
let loading = false;

signals.on('on-web-page-loading-started', page => {
    loading = true;
    if (currentInstance)
        currentInstance.currentPageIsPlaceholder = page.isPlaceholderPage;
    if (unregistrables.length) {
        unregistrables.forEach(unreg => unreg());
        unregistrables.splice(0, unregistrables.length);
    }
});

signals.on('on-web-page-loaded', () => {
    const currentPageTrids = getRegisteredReduxTreeIds();
    const refreshAllEvents = [
        'add-single-block',
        'commit-add-single-block',
        'undo-add-single-block',
        'delete-single-block',
        'undo-delete-single-block',
        'swap-blocks',
        'undo-swap-blocks',
        'convert-block-to-global',
        'undo-convert-block-to-global',
    ];
    unregistrables.push(...currentPageTrids.map(trid =>
         observeStore(createSelectBlockTree(trid), ({tree, context}) => {
            if (!context || (context[0] === 'init' && loading))
                return;
            if (refreshAllEvents.indexOf(context[0]) > -1 && context[2] !== 'dnd-spawner') {
                if (!currentInstance || loading) return;
                currentInstance.setState({blockTree: tree, treeState: createTreeState([], true)});
            }
        }, true)
    ));
    currentInstance.setBlockTree(createSelectBlockTree('main')(store.getState()).tree);
    loading = false;
});

signals.on('on-inspector-panel-closed', () => {
    if (currentInstance)
        currentInstance.deSelectAllBlocks();
});

signals.on('on-web-page-block-clicked', block => {
    if (!loading)
        currentInstance.handleItemClicked(block, false);
});

class BlockTree extends preact.Component {
    // selectedRoot;
    // moreMenu;
    // lastRootBlockMarker;
    // dragDrop;
    // onDragStart;
    // onDragOver;
    // onDrop;
    // blockWithMoreMenuOpened;
    // refElOfOpenMoreMenu;
    /**
     * @param {{blocksInput: Array<RawBlock>; onChangesApplied?: (blockTree: Array<Block>, blockIsStoredTo: 'page'|'globalBlockTree', globalBlockTreeId: String|null) => Promise<Boolean>; BlockTrees: preact.ComponentClass; disablePageInfo?: Boolean; containingView: 'CreatePage'|'CreatePageType'|'Default';}} props
     */
    constructor(props) {
        super(props);
        currentInstance = this;
        //
        this.state = {blockTree: null, treeState: null, loading: false};
        this.selectedRoot = null;
        this.moreMenu = preact.createRef();
        this.lastRootBlockMarker = null;
        this.currentAddBlockTarget = null;
        this.dragDrop = new BlockTreeDragDrop(this, (mutation1, _mutation2 = null) => {
        const trid = mutation1.blockToMove.isStoredToTreeId;
        const {tree} = createSelectBlockTree(trid)(store.getState());
        store.dispatch(createSetBlockTree(trid)(tree, ['swap-blocks', mutation1]));
        store.dispatch(pushItemToOpQueue(`swap-blocks-of-tree##${trid}`, {
            doHandle: trid !== 'main' || !this.currentPageIsPlaceholder
                ? () => BlockTrees.saveExistingBlocksToBackend(createSelectBlockTree(trid)(store.getState()).tree, trid)
                : null
            ,
            doUndo: () => {
                const treeBefore = mutation1.doRevert();
                store.dispatch(createSetBlockTree(trid)(treeBefore, ['undo-swap-blocks', mutation1]));
            },
            args: [],
        }));
        });
        BlockTrees = props.BlockTrees;
        this.onDragStart = this.dragDrop.handleDragStarted.bind(this.dragDrop);
        this.onDragOver = this.dragDrop.handleDraggedOver.bind(this.dragDrop);
        this.onDrop = this.dragDrop.handleDraggableDropped.bind(this.dragDrop);
        this.onDragEnd = this.dragDrop.handleDragEnded.bind(this.dragDrop);
    }
    /**
     * @param {Array<RawBlock2>} mainTree
     * @access public
     */
    setBlockTree(mainTree) {
        this.setState({blockTree: mainTree, treeState: createTreeState([], true)});
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
        this.selectedRoot = block;
        this.emitItemClickedOrAppendedSignal('focus-requested', block, null);
        if (isDirectClick) this.emitItemClickedOrAppendedSignal('clicked', block, null);
        const mutRef = this.state.treeState;
        const {tree} = createSelectBlockTree(block.isStoredToTreeId)(store.getState());
        const ids = findBlockWithParentIdPath(tree, ({id}, path) => {
            if (id !== block.id) return null;
            // Found block, has no children
            if (!path) return [block.id];
            // Found block, has children
            return splitPath(path);
        });
        ids.concat(block.id).forEach(id => { mutRef[id].isCollapsed = false; });
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
    render(_, {blockTree, treeState, loading}) {
        if (blockTree === null) return;
        const renderBranch = branch => branch.map(block => {
            if (block.type === 'GlobalBlockReference')
                return renderBranch(createSelectBlockTree(block.globalBlockTreeId)(store.getState()).tree);
            //
            if (block.type !== 'PageInfo') {
            const type = api.blockTypes.get(block.type);
            return <li
                onDragStart={ this.onDragStart }
                onDragOver={ this.onDragOver }
                onDrop={ this.onDrop }
                onDragEnd={ this.onDragEnd }
                class={ [`${block.isStoredTo}-block`,
                         !treeState[block.id].isSelected ? '' : ' selected',
                         !treeState[block.id].isCollapsed ? '' : ' collapsed',
                         !block.children.length ? '' : ' with-children'].join('') }
                data-block-id={ block.id }
                data-trid={ block.isStoredToTreeId }
                key={ block.id }
                draggable>
                { !block.children.length
                    ? null
                    : <button onClick={ () => this.toggleBranchIsCollapsed(block) } class="toggle p-absolute" type="button"><Icon iconId="chevron-down" className="size-xs"/></button>
                }
                <div class="d-flex">
                    <button onClick={ () => this.handleItemClicked(block) } class="block-handle text-ellipsis" type="button">
                        <Icon iconId={ getIcon(type) } className="size-xs p-absolute"/>
                        <span class="text-ellipsis">{ getShortFriendlyName(block, type) }</span>
                    </button>
                    <button onClick={ e => this.openMoreMenu(block, e) } class="more-toggle ml-2" type="button">
                        <Icon iconId="dots" className="size-xs"/>
                    </button>
                </div>
                { block.children.length
                    ? <ul>{ renderBranch(block.children) }</ul>
                    : null
                }
            </li>;
            }
            //
            return <li
                class={ [!treeState[block.id].isSelected ? '' : 'selected'].join(' ') }
                data-block-type="PageInfo"
                data-block-id={ block.id }
                key={ block.id }>
                <div class="d-flex">
                    <button
                        onClick={ () => !this.props.disablePageInfo ? this.handleItemClicked(block) : function(){} }
                        class="block-handle text-ellipsis"
                        type="button"
                        disabled={ this.props.disablePageInfo }>
                        <Icon iconId={ getIcon('PageInfo') } className="size-xs p-absolute"/>
                        <span class="text-ellipsis">{ block.title || __('PageInfo') }</span>
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
            <BlockDnDSpawner
                mainTreeDnd={ this.dragDrop }
                mainTree={ this }
                saveExistingBlocksToBackend={ BlockTrees.saveExistingBlocksToBackend }
                currentPageIsPlaceholder={ this.currentPageIsPlaceholder }
                initiallyIsOpen={ this.currentPageIsPlaceholder && this.props.foo === 'CreatePage' }/>
            <ul class={ `block-tree${!loading ? '' : ' loading'}` } data-sort-group-id="r">{
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
                    {text: __('Clone'), title: __('Clone content'), id: 'clone-block'},
                    {text: __('Delete'), title: __('Delete content'), id: 'delete-block'},
                ].concat(api.user.can('createGlobalBlockTrees')
                    ? [{text: __('Convert to global'), title: __('Convert to global content'), id: 'convert-block-to-global'}]
                    : []
                ) }
                onItemClicked={ this.handleContextMenuLinkClicked.bind(this) }
                onMenuClosed={ () => { this.refElOfOpenMoreMenu.style.opacity = ''; } }
                ref={ this.moreMenu }/>
        </div>;
    }
    /**
     * @param {ContextMenuLink} link
     * @access private
     */
    handleContextMenuLinkClicked(link) {
        if (link.id === 'add-paragraph-after') {
            this.addParagraph(this.blockWithMoreMenuOpened, 'after');
        } else if (link.id === 'add-paragraph-child') {
            this.addParagraph(this.blockWithMoreMenuOpened, 'as-child');
        } else if (link.id === 'add-child') {
            const possibleChild = getVisibleBlock(this.blockWithMoreMenuOpened);
            const id = possibleChild.id;
            this.appendNewBlockPlaceholder(possibleChild, 'as-child',
                state => {
                    state.treeState[id].isCollapsed = false;
                    return state;
                });
        } else if (link.id === 'clone-block') {
            this.cloneBlock(this.blockWithMoreMenuOpened);
        } else if (link.id === 'delete-block') {
            const blockVisible = this.blockWithMoreMenuOpened;
            const isSelectedRootCurrentlyClickedBlock = () => {
                if (!this.selectedRoot)
                    return false;
                return this.selectedRoot.id === blockVisible.id;
            };
            const isSelectedRootChildOfCurrentlyClickedBlock = () => {
                if (!this.selectedRoot)
                    return false;
                if (!blockVisible.children.length)
                    return false;
                return !!blockTreeUtils.findRecursively(blockVisible.children,
                    b => b.id === this.selectedRoot.id);
            };
            //
            const wasCurrentlySelectedBlock = isSelectedRootCurrentlyClickedBlock() ||
                                            isSelectedRootChildOfCurrentlyClickedBlock();
            if (wasCurrentlySelectedBlock) this.selectedRoot = null;
            //
            const base = (blockVisible.isStoredToTreeId !== 'main' &&
                isTreesOutermostBlock(blockVisible, createSelectBlockTree(blockVisible.isStoredToTreeId)(store.getState()).tree))
                ? findRefBlockOf(blockVisible, createSelectBlockTree('main')(store.getState()).tree)
                : null;
            const trid = (base || blockVisible).isStoredToTreeId;
            const isRootOfOfTrid = !base ? null : base.globalBlockTreeId;
            const {id, type, isStoredToTreeId} = (base || blockVisible);
            const {tree} = createSelectBlockTree(trid)(store.getState());
            const treeBefore = JSON.parse(JSON.stringify(tree));
            //
            const [ref, refBranch] = blockTreeUtils.findBlock(id, tree);
            refBranch.splice(refBranch.indexOf(ref), 1); // Mutates $tree temporarily
            //
            store.dispatch(createSetBlockTree(trid)(tree, ['delete-single-block',
                {blockId: id, blockType: type, trid, isRootOfOfTrid}]));
            store.dispatch(pushItemToOpQueue(`delete-block-from-tree#${isStoredToTreeId}`, {
                doHandle: isStoredToTreeId !== 'main' || !this.currentPageIsPlaceholder
                    ? () => BlockTrees.saveExistingBlocksToBackend(createSelectBlockTree(trid)(store.getState()).tree, trid)
                    : null
                ,
                doUndo: () => {
                    store.dispatch(createSetBlockTree(trid)(treeBefore, ['undo-delete-single-block',
                        {blockId: id, blockType: type, trid, isRootOfOfTrid}]));
                },
                args: [],
            }));
            signals.emit('on-block-deleted', (base || blockVisible), wasCurrentlySelectedBlock);
        } else if (link.id === 'convert-block-to-global') {
            const blockTreeToStore = this.blockWithMoreMenuOpened;
            floatingDialog.open(ConvertBlockToGlobalDialog, {
                title: __('Convert to global'),
                height: 238,
            }, {
                blockToConvertAndStore: blockTreeToStore,
                onConfirmed: data => this.doConvertBlockToGlobal(data, blockTreeToStore),
            });
        }
    }
    cloneBlock(openBlock) {
        const trid = openBlock.isStoredToTreeId;
        if (trid !== 'main') throw new Error();
        const {tree} = createSelectBlockTree(trid)(store.getState());
        const treeBefore = JSON.parse(JSON.stringify(tree));
        const [toClone, branch] = blockTreeUtils.findBlock(openBlock.id, tree);
        const cloned = cloneDeep(toClone);
        branch.splice(branch.indexOf(toClone) + 1, 0, cloned);
        this.emitAddBlock(trid, tree, cloned, treeBefore, toClone.id);
        signals.emit('on-block-tree-block-cloned', cloned);
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
        this.emitAddBlock(trid, tree, newBlock, treeBefore);
    }
    emitAddBlock(trid, tree, newBlock, treeBefore, cloneOf = null) {
        store.dispatch(createSetBlockTree(trid)(tree, ['add-single-block',
            {blockId: newBlock.id, blockType: newBlock.type, trid, cloneOf}]));
        store.dispatch(pushItemToOpQueue(`append-block-to-tree#${trid}`, {
            doHandle: trid !== 'main' || !this.currentPageIsPlaceholder
                ? () => BlockTrees.saveExistingBlocksToBackend(createSelectBlockTree(trid)(store.getState()).tree, trid)
                : null
            ,
            doUndo: () => {
                store.dispatch(createSetBlockTree(trid)(treeBefore, ['undo-add-single-block',
                    {blockId: newBlock.id, blockType: newBlock.type, trid}]));
            },
            args: [],
        }));
    }
    /**
     * @param {{name: String;}} data
     * @param {Block} originalBlock The block tree we just turned global
     * @access private
     */
    doConvertBlockToGlobal(data, originalBlock) {
        if (originalBlock.isStoredToTreeId !== 'main') throw new Error('Sanity');

        // #1
        const newGbt = {
            id: generatePushID(),
            name: data.name,
            blocks: [originalBlock],
        };
        const {tree} = createSelectBlockTree('main')(store.getState());
        const treeBefore = JSON.parse(JSON.stringify(tree));
        blockTreeUtils.traverseRecursively(newGbt.blocks, b => { // Note: mutates original block
            b.isStoredTo = 'globalBlockTree';
            b.isStoredToTreeId = newGbt.id;
        });

        // #2
        api.editApp.addBlockTree(newGbt.id, newGbt.blocks);
        // #3
        api.editApp.registerWebPageDomUpdaterForBlockTree(newGbt.id);

        // #4
        let [b, br] = blockTreeUtils.findBlock(originalBlock.id, tree);
        const turned = createBlockFromType('GlobalBlockReference', 'main', undefined, {
            globalBlockTreeId: newGbt.id,
        });
        br[br.indexOf(b)] = turned;
        const eventData = {blockId: turned.id, blockType: turned.blockType, trid: 'main', isRootOfOfTrid: newGbt.id};
        store.dispatch(createSetBlockTree('main')(tree, ['convert-block-to-global', eventData]));

        store.dispatch(pushItemToOpQueue('convert-block-to-global', {
            doHandle: () => {
                const {tree} = createSelectBlockTree(newGbt.id)(store.getState());
                const gbt = {id: newGbt.id, name: newGbt.name, blocks: treeToTransferable(tree)};
                return http.post('/api/global-block-trees', gbt).then(resp => {
                    if (resp.ok !== 'ok') throw new Error('-');
                    return BlockTrees.saveExistingBlocksToBackend(createSelectBlockTree('main')(store.getState()).tree, 'main');
                });
            },
            doUndo: () => {
                // No need to revert #1

                // Revert #3
                api.editApp.unRegisterWebPageDomUpdaterForBlockTree(newGbt.id);

                // Revert #4
                store.dispatch(createSetBlockTree('main')(treeBefore, ['undo-convert-block-to-global', eventData]));
                setTimeout(() => {
                // No need to revert #2
                    api.editApp.removeBlockTree(newGbt.id);
                }, 4000);
            },
            args: [],
        }));
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
        this.blockWithMoreMenuOpened = block;
        this.refElOfOpenMoreMenu = e.target;
        this.refElOfOpenMoreMenu.style.opacity = '1';
        this.moreMenu.current.open(e, links => {
            const notThese = []
                .concat(block.isStoredTo === 'page' ? [] : ['convert-block-to-global', 'clone-block']);
            return notThese.length ? links.filter(({id}) => notThese.indexOf(id) < 0) : links;
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
        this.setState({treeState: mutRef});
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

/**
 * @returns {Array<String>} ['main', '1', '42']
 */
function getRegisteredReduxTreeIds() {
    return ['main'].concat(Object.keys(store.reducerManager.getReducerMap())
        .filter(key => key !== 'blockTree_main' && key.startsWith('blockTree_'))
        .map(storeKey => storeKey.split('blockTree_')[1]));
}

export default BlockTree;
export {findBlockTemp};
