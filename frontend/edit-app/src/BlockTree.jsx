import {__, signals, http, api, floatingDialog, Icon} from '@sivujetti-commons-for-edit-app';
import ContextMenu from './commons/ContextMenu.jsx';
import {generatePushID} from './commons/utils.js';
import BlockTreeShowHelpPopup from './BlockTreeShowHelpPopup.jsx';
import blockTreeUtils from './blockTreeUtils.js';
import store, {observeStore, createSelectBlockTree, createSetBlockTree, pushItemToOpQueue} from './store.js';
import BlockTreeDragDrop from './BlockTreeDragDrop.js';
import ConvertBlockToGlobalDialog from './ConvertBlockToGlobalBlockTreeDialog.jsx';
import {getIcon} from './block-types/block-types.js';
import {cloneDeep, createBlockFromType, findRefBlockOf, isTreesOutermostBlock,
        setTrids, treeToTransferable} from './Block/utils.js';
import BlockDnDSpawner from './Block/BlockDnDSpawner.jsx';

let BlockTrees;
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
                currentInstance.setState(Object.assign(
                    trid === 'main' ? {blockTree: tree} : {},
                    {treeState: createTreeState([], true)}
                ));
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
    // dragDrop;
    // onDragStart;
    // onDragOver;
    // onDrop;
    // blockWithMoreMenuOpened;
    // refElOfOpenMoreMenu;
    /**
     * @param {{BlockTrees: preact.ComponentClass; disablePageInfo?: Boolean; containingView: 'CreatePage'|'CreatePageType'|'Default';}} props
     */
    constructor(props) {
        super(props);
        currentInstance = this;
        //
        this.state = {blockTree: null, treeState: null, loading: false};
        this.selectedRoot = null;
        this.moreMenu = preact.createRef();
        this.dragDrop = new BlockTreeDragDrop(this, (mutation1, _mutation2 = null) => {
        const trid = mutation1.blockToMove.isStoredToTreeId;
        const {tree} = createSelectBlockTree(trid)(store.getState());
        store.dispatch(createSetBlockTree(trid)(tree, ['swap-blocks', [mutation1]]));
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
     * @param {Array<RawBlock>} mainTree
     * @access public
     */
    setBlockTree(mainTree) {
        this.setState({blockTree: mainTree, treeState: createTreeState([], true)});
    }
    /**
     * @param {RawBlock} block After
     * @param {String|null} initialText = null
     * @param {Boolean} autoFocus = true
     * @access public
     */
    appendBlockToTreeAfter(block, _initialText = null, _autoFocus = true) {
        //
    }
    /**
     * @param {RawBlock} block The parent block
     * @param {Boolean} autoFocus = true
     * @access public
     */
    appendBlockToTreeAsChildOf(block, _autoFocus = true) {
        //
    }
    /**
     * @param {RawBlock} block
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
     * @access protected
     */
    render(_, {blockTree, treeState, loading}) {
        if (blockTree === null) return;
        const renderBranch = (branch, root = null) => branch.map((block, i) => {
            if (block.type === 'GlobalBlockReference')
                return renderBranch(createSelectBlockTree(block.globalBlockTreeId)(store.getState()).tree, block);
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
                    <button onClick={ e => this.openMoreMenu(block, root && i === 0, e) } class="more-toggle ml-2" type="button">
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
                initiallyIsOpen={ this.currentPageIsPlaceholder && this.props.containingView === 'CreatePage' }/>
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
     * @param {RawBlock} originalBlock The block tree we just turned global
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
        setTrids(newGbt.blocks, newGbt.id); // Note: mutates original block
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
     * @param {RawBlock} block
     * @param {Boolean} blockIsGlobalBlockTreesOutermostBlock
     * @param {Event} e
     * @access private
     */
    openMoreMenu(block, blockIsGlobalBlockTreesOutermostBlock, e) {
        this.blockWithMoreMenuOpened = block;
        this.refElOfOpenMoreMenu = e.target;
        this.refElOfOpenMoreMenu.style.opacity = '1';
        this.moreMenu.current.open(e, links => {
            const notThese = []
                .concat(block.isStoredToTreeId !== 'main' ? ['convert-block-to-global'] : [])
                .concat(blockIsGlobalBlockTreesOutermostBlock ? ['clone-block'] : []);
            return notThese.length ? links.filter(({id}) => notThese.indexOf(id) < 0) : links;
        });
    }
    /**
     * @param {RawBlock} block
     * @access private
     */
    toggleBranchIsCollapsed(block) {
        const mutRef = this.state.treeState;
        mutRef[block.id].isCollapsed = !mutRef[block.id].isCollapsed;
        this.setState({treeState: mutRef});
    }
    /**
     * @param {RawBlock} block
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
     * @param {RawBlock} block
     * @param {RawBlock|null} base
     * @access private
     */
    emitItemClickedOrAppendedSignal(name, block, base) {
        signals.emit(`on-block-tree-item-${name}`, block, base, this);
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
 * @param {RawBlock} block
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
 * @param {Array<RawBlock>} tree
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
