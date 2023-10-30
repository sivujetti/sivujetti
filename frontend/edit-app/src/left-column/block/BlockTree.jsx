import {__, api, signals, floatingDialog, Icon} from '@sivujetti-commons-for-edit-app';
import {getIcon} from '../../block-types/block-types.js';
import {cloneDeep, treeToTransferable} from '../../block/utils.js';
import {findBlockFrom} from '../../block/utils-utils.js';
import ContextMenu from '../../commons/ContextMenu.jsx';
import {generatePushID} from '../../commons/utils.js';
import BlockTreeShowHelpPopup from '../../popups/BlockTreeShowHelpPopup.jsx';
import SaveBlockAsReusableDialog from '../../popups/reusable-branch/SaveBlockAsReusableDialog.jsx';
import store2, {observeStore as observeStore2} from '../../store2.js';
import TreeDragDrop from '../../TreeDragDrop.js';
import BlockDnDSpawner from './BlockDnDSpawner.jsx';
import blockTreeUtils from './blockTreeUtils.js';
import createDndController, {createBlockDescriptor, callGetBlockPropChangesEvent} from './createBlockTreeDndController.js';
import {overrideData} from '../../block/theBlockTreeStore.js';

const autoCollapse = 'nonUniqueRootLevelItems'; // 'mainContentItem'|'nonUniqueRootLevelItems';

let pluginsLoaded = false;
let timesReRendered = 0;
signals.on('edit-app-plugins-loaded', () => {
    pluginsLoaded = true;
});

class BlockTree extends preact.Component {
    // ?;
    /**
     * @access protected
     */
    componentWillMount() {
        this.selectedRoot = null;
        this.disablePageInfo = this.props.containingView === 'CreatePageType';
        this.blockSpawner = preact.createRef();
        this.moreMenu = preact.createRef();
        this.currentPageIsPlaceholder = this.props.containingView !== 'Default';
        this.unregistrables = [];
        this.dragDrop = new TreeDragDrop(createDndController(this));
        this.onDragStart = this.dragDrop.handleDragStarted.bind(this.dragDrop);
        this.onDrag = this.dragDrop.handleDrag.bind(this.dragDrop);
        this.onDragOver = this.dragDrop.handleDraggedOver.bind(this.dragDrop);
        this.onDragLeave = this.dragDrop.handleDragLeave.bind(this.dragDrop);
        this.onDrop = this.dragDrop.handleDraggableDropped.bind(this.dragDrop);
        this.onDragEnd = this.dragDrop.handleDragEnded.bind(this.dragDrop);
        this.currentlyHoveredLi = null;
        const maybe = store2.get().theBlockTree;
        if (maybe) this.receiveNewBlocks(maybe);
    }
    /**
     * @param {{loadedPageSlug: String; containingView: leftPanelName;}} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.loadedPageSlug === this.props.loadedPageSlug) return;
        this.unregistrables.forEach(unregister => unregister());
        this.unregistrables = [];
        this.receiveNewBlocks(store2.get().theBlockTree);
    }
    /**
     * @param {Array<RawBlock>} theBlockTree
     * @access protected
     */
    receiveNewBlocks(theBlockTree) {
        // 2. Later changes
        this.unregistrables.push(observeStore2('theBlockTree', ({theBlockTree}, [event, data]) => {
            if (event === 'theBlockTree/init') {
                // skip
            } else if (event === 'theBlockTree/swap') {
                // skip, wait until drop/applySwap
            } else if (event === 'theBlockTree/applySwap' ||
                event === 'theBlockTree/applyAdd(Drop)Block' ||
                event === 'theBlockTree/deleteBlock' ||
                event === 'theBlockTree/undo' ||
                event === 'theBlockTree/undoAdd(Drop)Block' ||
                event === 'theBlockTree/cloneItem' ||
                event === 'theBlockTree/convertToGbt') {
                const newState = {blockTree: theBlockTree, treeState: createTreeState(theBlockTree, this.state.treeState)};
                if ((event === 'theBlockTree/applyAdd(Drop)Block' || event === 'theBlockTree/applySwap') && data[2] === 'as-child') {
                    const swapTargetInfo = data[1]; // [BlockDescriptor, BlockDescriptor, dropPosition, treeTransferType]
                    const {isStoredToTreeId, blockId} = !swapTargetInfo.isGbtRef ? swapTargetInfo
                        : {isStoredToTreeId: swapTargetInfo.data.refTreeId, blockId: swapTargetInfo.data.refTreesRootBlockId};
                    const branch = blockTreeUtils.findTree(isStoredToTreeId, theBlockTree);
                    const [paren] = blockTreeUtils.findBlock(blockId, branch);
                    setAsHidden(false, paren, newState.treeState);
                }
                this.setState(newState);
            } else if (event === 'theBlockTree/updateDefPropsOf' || event === 'theBlockTree/undoUpdateDefPropsOf') {
                const isOnlyStyleClassesChange = event === 'theBlockTree/updateDefPropsOf'
                    ? data[3]  // [<blockId>, <blockIsStoredToTreeId>, <changes>, <isOnlyStyleClassesChange>]
                    : data[3]; // [<oldTree>, <blockId>, <blockIsStoredToTreeId>, <isOnlyStyleClassesChange>]
                if (isOnlyStyleClassesChange) return;
                this.setState({blockTree: theBlockTree});
            }
        }));
        //
        this.addBlockHoverHighlightListeners();
        // 1. Initial
        this.setState({blockTree: theBlockTree, treeState: createTreeState(theBlockTree, null)});
    }
    /**
     * @access protected
     */
    render(_, {blockTree}) {
        const tree = pluginsLoaded ? blockTree : (function (vm) {
            window.console.debug('pluginsLoaded = false during BlockTree.render(), trying again.');
            if (timesReRendered < 3) setTimeout(() => { timesReRendered += 1; vm.forceUpdate(); }, 60);
            return null;
        })(this);
        return <div class="pt-2">
            <div class="p-relative" style="z-index: 1"><button
                onClick={ this.showBlockTreeHelpPopup.bind(this) }
                class="btn btn-link p-absolute btn-sm pt-1"
                type="button"
                style="right: .1rem; top: .1rem;">
                <Icon iconId="info-circle" className="size-xs"/>
            </button></div>
            <BlockDnDSpawner
                mainTreeDnd={ this.dragDrop }
                initiallyIsOpen={ this.currentPageIsPlaceholder && this.props.containingView === 'CreatePage' }
                ref={ this.blockSpawner }/>
            <ul class="block-tree mx-1" ref={ el => {
                if (!el) return;
                this.dragDrop.attachOrUpdate(el);
                if (!this.mouseDownHoverClearerHookedUp) {
                    el.addEventListener('mousedown', e => {
                        if (e.button === 0 && this.currentlyHoveredLi)
                            this.unHighlighCurrentlyHoveredLi();
                    });
                    this.mouseDownHoverClearerHookedUp = true;
                }
            } }>{
                tree ? tree.length
                    ? this.doRenderBranch(blockTree).concat(<li
                        onDragOver={ this.onDragOver }
                        onDrop={ this.onDrop }
                        onDragLeave={ this.onDragLeave }
                        data-draggable={ true }
                        data-last
                        draggable><div class="d-flex">&nbsp;</div></li>)
                    : <li>-</li> : null
            }</ul>
            <ContextMenu
                links={ [
                    {text: __('Duplicate'), title: __('Duplicate content'), id: 'duplicate-block'},
                    {text: __('Delete'), title: __('Delete content'), id: 'delete-block'},
                ].concat(api.user.can('createReusableBranches') || api.user.can('createGlobalBlockTrees')
                    ? [{text: __('Save as reusable'), title: __('Save as reusable content'), id: 'save-block-as-reusable'}]
                    : []
                ) }
                onItemClicked={ this.handleContextMenuLinkClicked.bind(this) }
                onMenuClosed={ this.onContextMenuClosed.bind(this) }
                ref={ this.moreMenu }/>
        </div>;
    }
    /**
     * @param {Array<RawBlock>} branch
     * @param {Number} depth = 1
     * @param {RawBlock} paren = null
     * @param {RawBlock} ref = null {type:'GlobalBlockReference'...}
     */
    doRenderBranch(branch, depth = 1, paren = null, ref = null) { return branch.map((block, i) => {
        if (block.type === 'GlobalBlockReference')
            return this.doRenderBranch(block.__globalBlockTree.blocks, depth, paren, block);
        //
        const lastIxd = branch.length - 1;
        const {treeState} = this.state;
        if (block.type !== 'PageInfo') {
        const type = api.blockTypes.get(block.type);
        const title = getShortFriendlyName(block, type);
        const c = !block.children.length ? [] : this.doRenderBranch(block.children, depth + 1, block, ref);
        const rootRefBlockId = !(ref && i + depth === 1) ? null : ref.id;
        const isStoredTo = !ref ? 'main' : 'globalBlockTree';
        return [<li
            onDragStart={ this.onDragStart }
            onDrag={ this.onDrag }
            onDragOver={ this.onDragOver }
            onDragLeave={ this.onDragLeave }
            onDrop={ this.onDrop }
            onDragEnd={ this.onDragEnd }
            onMouseOver={ e => {
                if (!this.currentlyHoveredLi && e.target.getAttribute('data-block-id') === block.id) {
                    this.currentlyHoveredLi = e.target;
                    api.webPageIframe.highlightBlock(block);
                }
            } }
            onMouseLeave={ e => {
                if (this.currentlyHoveredLi === e.target)
                    this.unHighlighCurrentlyHoveredLi();
            } }
            class={ [`${isStoredTo}-block`,
                    !treeState[block.id].isSelected ? '' : ' selected',
                    !treeState[block.id].isHidden ? '' : ' d-none',
                    !treeState[block.id].isCollapsed ? '' : ' collapsed'].join('') }
            data-block-id={ block.id }
            data-is-stored-to-tree-id={ isStoredTo === 'main' ? 'main' : ref.__globalBlockTree.id }
            data-is-root-block-of={ rootRefBlockId }
            data-depth={ depth }
            data-has-children={ c.length > 0 }
            data-is-children-of={ paren ? paren.id : null }
            data-first-child={ i === 0 }
            data-last-child={ i === lastIxd }
            data-draggable={ true }
            title={ title }
            key={ `${this.props.loadedPageSlug}-${block.id}` }
            draggable>
            { !c.length ? null : <button onClick={ () => this.toggleBranchIsCollapsed(block) } class="toggle p-absolute" type="button">
                <Icon iconId="chevron-down" className="size-xs"/>
            </button> }
            <div class="d-flex">
                <button onClick={ () => this.handleItemClickedOrFocused(block) } class="block-handle text-ellipsis" type="button">
                    <Icon iconId={ getIcon(type) } className="size-xs p-absolute"/>
                    <span class="text-ellipsis">{ title }</span>
                </button>
                <button onClick={ e => this.openMoreMenu(block, rootRefBlockId !== null, e) } class="more-toggle ml-2" type="button">
                    <Icon iconId="dots" className="size-xs"/>
                </button>
            </div>
        </li>].concat(c);
        }
        //
        const title = block.title || __('PageInfo');
        return <li
            class={ !treeState[block.id].isSelected ? '' : 'selected' }
            data-block-id={ block.id }
            data-block-type="PageInfo"
            data-depth={ depth }
            title={ title }
            key={ block.id }>
            <div class="d-flex">
                <button
                    onClick={ () => !this.disablePageInfo ? this.handleItemClickedOrFocused(block) : function(){} }
                    class="block-handle text-ellipsis"
                    type="button"
                    disabled={ this.disablePageInfo }>
                    <Icon iconId={ getIcon('PageInfo') } className="size-xs p-absolute"/>
                    <span class="text-ellipsis">{ title }</span>
                </button>
            </div>
        </li>;
    }); }
    /**
     * @param {ContextMenuLink} link
     * @access private
     */
    handleContextMenuLinkClicked(link) {
        if (link.id === 'duplicate-block') {
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
            if (!this.blockWithMoreMenuOpenedIsGbtsOutermostBlock) {
                const {id} = blockVisible;
                store2.dispatch('theBlockTree/deleteBlock', [id, this.openedBlockDetails.getAttribute('data-is-stored-to-tree-id'), wasCurrentlySelectedBlock]);
            } else {
                const refBlockId = this.openedBlockDetails.getAttribute('data-is-root-block-of');
                store2.dispatch('theBlockTree/deleteBlock', [refBlockId, 'main', wasCurrentlySelectedBlock]);
            }
        } else if (link.id === 'save-block-as-reusable') {
            const blockToStore = this.blockWithMoreMenuOpened;
            const userCanCreateGlobalBlockTrees = api.user.can('createGlobalBlockTrees');
            floatingDialog.open(SaveBlockAsReusableDialog, {
                title: __('Save as reusable'),
                height: userCanCreateGlobalBlockTrees ? 468 : 254,
            }, {
                blockToConvertAndStore: blockToStore,
                onConfirmed: data => data.saveAsUnique ? this.doConvertBlockToGlobal(data, blockToStore) :
                    this.doSaveBlockAsReusable(data, blockToStore),
                userCanCreateGlobalBlockTrees,
            });
        }
    }
    /**
     * @access private
     */
    onContextMenuClosed() {
        this.blockWithMoreMenuOpened = null;
        this.blockWithMoreMenuOpenedIsGbtsOutermostBlock = null;
        this.refElOfOpenMoreMenu.style.opacity = '';
    }
    /**
     * @param {RawBlock} openBlock
     * @access private
     */
    cloneBlock(openBlock) {
        const cloned = cloneDeep(findBlockFrom(openBlock.id, 'mainTree')[0]);
        const changes = callGetBlockPropChangesEvent(cloned.type, 'cloneBlock', [cloned]);
        if (changes) overrideData(cloned, changes);
        store2.dispatch('theBlockTree/cloneItem', [{block: cloned, isReusable: null}, createBlockDescriptor(openBlock), 'after']);
        api.webPageIframe.scrollToBlock(cloned);
    }
    /**
     * @param {{name: String;}} data
     * @param {RawBlock} originalBlock The block tree we just turned global
     * @access private
     */
    doConvertBlockToGlobal(data, originalBlock) {
        const newGbtWithoutBlocks = {id: generatePushID(), name: data.name, blocks: []};
        const newBlockId = generatePushID();
        store2.dispatch('theBlockTree/convertToGbt', [originalBlock.id, newBlockId, newGbtWithoutBlocks]);
    }
    /**
     * @param {{name: String;}} data From SaveBlockAsReusableDialog
     * @param {RawBlock} block
     * @access private
     */
    doSaveBlockAsReusable(data, block) {
        const {id} = block;
        const isStoredToTreeId = blockTreeUtils.getIsStoredToTreeId(block.id, store2.get().theBlockTree);

        // Update the title of the existing block
        const changes = {title: data.name};
        const isOnlyStyleClassesChange = false;
        const prevData = null;
        store2.dispatch('theBlockTree/updateDefPropsOf',
            [id, isStoredToTreeId, changes, isOnlyStyleClassesChange, prevData]);

        // Push item to reusableBranches
        setTimeout(() => {
            const [latest] = blockTreeUtils.findBlockSmart(id, store2.get().theBlockTree);
            const newReusableBranch = {id: generatePushID(), blockBlueprints: [blockToBlueprint(treeToTransferable([latest])[0])]};
            store2.dispatch('reusableBranches/addItem', [newReusableBranch, id]);
        }, 100);
    }
    /**
     * @param {RawBlock} block
     * @param {Boolean} blockIsGbtsOutermostBlock
     * @param {Event} e
     * @access private
     */
    openMoreMenu(block, blockIsGbtsOutermostBlock, e) {
        this.blockWithMoreMenuOpened = block;
        this.blockWithMoreMenuOpenedIsGbtsOutermostBlock = blockIsGbtsOutermostBlock;
        this.openedBlockDetails = e.target.closest('li');
        this.refElOfOpenMoreMenu = e.target;
        this.refElOfOpenMoreMenu.style.opacity = '1';
        this.moreMenu.current.open(e, links => {
            const notThese = [
                ...(blockIsGbtsOutermostBlock ? ['duplicate-block'] : []),
                ...(['Columns', 'Section'].indexOf(block.type) < 0 ? ['save-block-as-reusable'] : [])
            ];
            return notThese.length ? links.filter(({id}) => notThese.indexOf(id) < 0) : links;
        });
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
     * @param {RawBlock} block
     * @access private
     */
    toggleBranchIsCollapsed(block) {
        const mutRef = this.state.treeState;
        const to = !mutRef[block.id].isCollapsed;
        mutRef[block.id].isCollapsed = to;
        hideOrShowChildren(to, block, mutRef);
        this.setState({treeState: mutRef});
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
     * @param {RawBlock} block
     * @param {'direct'|'web-page'|'styles-tab'} origin = 'direct'
     * @access public
     */
    handleItemClickedOrFocused(block, origin = 'direct') {
        this.selectedRoot = block;
        signals.emit('block-tree-item-clicked-or-focused', block, origin);
        //
        const mutRef = this.state.treeState;
        const root = blockTreeUtils.findBlockSmart(block.id, store2.get().theBlockTree)[3];
        const tree = blockTreeUtils.isMainTree(root) ? root : root.blocks;
        const parentBlockIds = withParentIdPathDo(tree, (parentPath, {id}) => {
            if (id !== block.id) return null;
            // Found block, has depth 1
            if (!parentPath) return [];
            // Found block, has depth > 1
            return splitPath(parentPath);
        });
        parentBlockIds.forEach(id => {
            setAsHidden(false, blockTreeUtils.findBlock(id, tree)[0], mutRef);
        });
        this.setState({treeState: this.setBlockAsSelected(block, mutRef)});
    }
    /**
     * @access private
     */
    addBlockHoverHighlightListeners() {
        const curHigh = {hovered: null, visible: null};
        this.unregistrables.push(signals.on('highlight-rect-revealed', (blockId, origin) => {
            if (origin !== 'web-page') return;
            if (curHigh.hovered) clearHighlight(curHigh);
            const {ul} = this.dragDrop;
            const li = ul.querySelector(`li[data-block-id="${blockId}"]`);
            if (li) {
                curHigh.hovered = li;
                curHigh.visible = !li.classList.contains('d-none') ? li : findVisibleLi(li, ul, li);
                curHigh.visible.classList.add('highlighted');
            }
        }));
        this.unregistrables.push(signals.on('highlight-rect-removed', blockId => {
            if (curHigh.hovered && curHigh.hovered.getAttribute('data-block-id') === blockId) { clearHighlight(curHigh); }
        }));
    }
    /**
     * @access private
     */
    unHighlighCurrentlyHoveredLi() {
        api.webPageIframe.unHighlightBlock(this.currentlyHoveredLi.getAttribute('data-block-id'));
        this.currentlyHoveredLi = null;
    }
}

/**
 * @param {{hovered: HTMLLIElement; visible: HTMLLIElement;}} curHigh
 */
function clearHighlight(curHigh) {
    curHigh.visible.classList.remove('highlighted');
    curHigh.hovered = null;
    curHigh.visible = null;
}

/**
 * @param {HTMLLIElement} li
 * @param {HTMLUListElement} ul
 * @param {HTMLLIElement} def
 * @returns {HTMLLIElement}
 */
function findVisibleLi(li, ul, def) {
    const parentBlockId = li.getAttribute('data-is-children-of');
    if (!parentBlockId) return def;
    const parentBlockLi = ul.querySelector(`li[data-block-id="${parentBlockId}"]`);
    if (!parentBlockLi.classList.contains('d-none')) // found it
        return parentBlockLi;
    // keep looking
    return findVisibleLi(parentBlockLi, ul, def);
}

/**
 * @param {Array<RawBlock>} blocks
 * @param {(parentIdPath: String, block: RawBlock) => any} fn
 * @param {String} parentIdPath
 * @returns {any}
 */
function withParentIdPathDo(blocks, fn, parentIdPath = '') {
    for (const block of blocks) {
        const ret = fn(parentIdPath, block);
        if (ret) return ret;
        if (block.children.length) {
            const ret2 = withParentIdPathDo(block.children, fn, `${parentIdPath}/${block.id}`);
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
 * @param {Boolean} setAsHidden
 * @param {RawBlock} block
 * @param {Object} mutTreeState
 * @param {Boolean} recursive = true
 */
function hideOrShowChildren(setAsHidden, block, mutTreeState, recursive = true) {
    if (!block.children.length) return;
    if (setAsHidden)
        block.children.forEach(b2 => {
            if (b2.type === 'GlobalBlockReference') return; // Ignore
            mutTreeState[b2.id].isHidden = true;
            // Always hide all children
            if (recursive) hideOrShowChildren(true, b2, mutTreeState);
        });
    else
        block.children.forEach(b2 => {
            if (b2.type === 'GlobalBlockReference') return; // Ignore
            mutTreeState[b2.id].isHidden = false;
            // Show children only if it's not collapsed
            if (recursive && !mutTreeState[b2.id].isCollapsed) hideOrShowChildren(false, b2, mutTreeState);
        });
}

/**
 * @param {Boolean} isHidden
 * @param {RawBlock} block
 * @param {Object} mutTreeState
 * @param {Boolean} recursive = true
 */
function setAsHidden(isHidden, block, mutTreeState, recursive = true) {
    mutTreeState[block.id].isCollapsed = isHidden;
    hideOrShowChildren(isHidden, block, mutTreeState, recursive);
}

/**
 * @param {Object} overrides = {}
 * @returns {BlockTreeItemState}
 */
function createTreeStateItem(parentStateItem, overrides = {}) {
    return Object.assign({
        isSelected: false,
        isCollapsed: false,
        isHidden: parentStateItem && parentStateItem.isCollapsed,
        isNew: false,
    }, overrides);
}

/**
 * @param {Array<RawBlock>} tree
 * @param {{[key: String]: BlockTreeItemState;}|null} previousTreeState
 * @returns {{[key: String]: BlockTreeItemState;}}
 */
function createTreeState(tree, previousTreeState) {
    const out = {};
    const addItem = (block, parenBlock) => {
        if (!previousTreeState || !previousTreeState[block.id])
            out[block.id] = createTreeStateItem(!parenBlock ? null : out[parenBlock.id], !block.children.length ? undefined : {isCollapsed: true});
        else {
            const clone = {...previousTreeState[block.id]};
            // Visible block moved inside a collapsed one
            if (parenBlock && out[parenBlock.id].isCollapsed && !clone.isHidden)
                clone.isHidden = true;
            out[block.id] = clone;
        }
    };
    blockTreeUtils.traverseRecursively(tree, (block, _i, paren) => {
        if (block.type !== 'GlobalBlockReference')
            addItem(block, paren);
        else
            blockTreeUtils.traverseRecursively(block.__globalBlockTree.blocks, (block2, _i2, paren2) => {
                addItem(block2, paren2);
            });
    });
    if (autoCollapse === 'nonUniqueRootLevelItems')
        tree.forEach(block => {
            if (block.type === 'GlobalBlockReference') return;
            if (block.children.length)
                setAsHidden(false, block, out, false);
        });
    else if (autoCollapse === 'mainContentItem') {
        const main = getMainContent(tree);
        if (main) setAsHidden(false, main, out, false);
    }
    return out;
}

/**
 * @param {Array<RawBlock>} tree
 * @returns {RawBlock|null}
 */
function getMainContent(tree) {
    let headerIndex = null;
    tree.forEach((block, i) => {
        if (block.type === 'GlobalBlockReference') return;
        if (headerIndex === null && block.title.toLowerCase().indexOf('header') > -1)
            headerIndex = i;
    });
    if (headerIndex !== null) {
        const next = tree[headerIndex + 1];
        if (next && next.children.length) // next + next + ... ?
            return next;
    }
    if (tree.length === 4) {
        const [maybPageInfo, maybeMainMenu, maybeMainContent, maybeFooter] = tree;
        if (
            maybPageInfo.type === 'PageInfo' &&
            (maybeMainMenu.type === 'GlobalBlockReference' && blockTreeUtils.findRecursively(maybeMainMenu.__globalBlockTree.blocks, b=>b.type==='Menu')) &&
            maybeMainContent.children.length &&
            (maybeFooter.type === 'GlobalBlockReference' && (maybeFooter.__globalBlockTree.blocks[0] || {}).title.toLowerCase().indexOf('footer') > -1)
        ) return maybeMainContent;
    }
    if (tree.length === 2 && tree[0].type === 'PageInfo' && tree[1].children.length)
        return tree[1];
    return null;
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
    const pcs = translated.split(' ('); // ['Name', 'PluginName)'] or ['Name']
    return pcs.length < 2 ? translated : pcs[0];
}

/**
 * @param {RawBlock} block
 * @returns {BlockBlueprint}
 */
function blockToBlueprint(block) {
    return {
        blockType: block.type,
        initialOwnData: propsToObj(block.propsData),
        initialDefaultsData: {
            title: block.title || '',
            renderer: block.renderer,
            styleClasses: block.styleClasses || '',
        },
        initialChildren: block.children.map(w => blockToBlueprint(w)),
    };
}
function propsToObj(propsData) {
    const out = {};
    for (const field of propsData) {
        out[field.key] = field.value;
    }
    return out;
}

export default BlockTree;
