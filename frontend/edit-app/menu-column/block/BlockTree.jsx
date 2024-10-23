import {
    __,
    api,
    blockTreeUtils,
    events,
    floatingDialog,
    generatePushID,
    Icon,
    LoadingSpinner,
    objectUtils,
    scssWizard,
    traverseRecursively,
} from '@sivujetti-commons-for-edit-app';
import createDndController, {
    createBlockDescriptorFromLi,
} from '../../includes/block/create-block-tree-dnd-controller.js';
import {getRealTarget} from '../../includes/block/tree-dnd-controller-funcs.js';
import {fetchOrGet as fetchOrGetReusableBranches} from '../../includes/reusable-branches/repository.js';
import {createBlock, treeToTransferable} from '../../includes/block/utils.js';
import TreeDragDrop from '../../includes/TreeDragDrop.js';
import BlockSaveAsReusableDialog from '../../main-column/popups/BlockSaveAsReusableDialog.jsx';
import BlockTreeShowHelpPopup from '../../main-column/popups/BlockTreeShowHelpPopup.jsx';
import {historyInstance} from '../../main-column/MainColumnViews.jsx';
import {
    blockToBlueprint,
    clearHighlight,
    createAddContentPlacementCfg,
    createConvertBlockToGlobalOps,
    createDeleteBlockOp,
    createDuplicateBlockOp,
    createGetTreeBlocksFn,
    createPartialState,
    createStyleShunkcScssIdReplacer,
    findUiStateEntry,
    findVisibleLi,
    getShortFriendlyName,
    getVisibleLisCount,
    hideOrShowChildren,
    setAsCollapsed,
    splitPath,
    withIdxPathDo,
} from './BlockTreeFuncs.js';
import AddContentPopup from './AddContentPopup.jsx';
/** @typedef {import('./BlockTreeFuncs.js').UiStateEntry} UiStateEntry */
/** @typedef {import('./BlockTreeFuncs.js').LiUiState} LiUiState */

class BlockTree extends preact.Component {
    // unregistrables;
    // moreMenu;
    // dragDrop; // public
    // onDragStart;
    // onDrag;
    // onDragOver;
    // onDragLeave;
    // onDrop;
    // onDragEnd;
    // currentlyHoveredLi;
    // disablePageInfo;
    // mouseDownHoverClearerHookedUp;
    // curUrl;
    // openMoreMenuData;
    /**
     * @access protected
     */
    componentWillMount() {
        this.unregistrables = [events.on('route-changed', (_, isRightColumView) => {
            this.rightColumnViewIsCurrenlyOpen = isRightColumView;
        })];
        this.dragDrop = new TreeDragDrop(createDndController(api.saveButton.getInstance()));
        this.onDragStart = this.dragDrop.handleDragStarted.bind(this.dragDrop);
        this.onDrag = this.dragDrop.handleDrag.bind(this.dragDrop);
        this.onDragOver = this.dragDrop.handleDraggedOver.bind(this.dragDrop);
        this.onDragLeave = this.dragDrop.handleDragLeave.bind(this.dragDrop);
        this.onDrop = this.dragDrop.handleDraggableDropped.bind(this.dragDrop);
        this.onDragEnd = this.dragDrop.handleDragEnded.bind(this.dragDrop);
        this.currentlyHoveredLi = null;
        this.disablePageInfo = this.props.containingView === 'CreatePageType';

        if (this.props.blocks) this.setState(createPartialState(this.props.blocks));

        this.addBlockHoverHighlightListeners();
    }
    /**
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.blocks !== this.props.blocks) {
            const {pathname} = historyInstance.getCurrentLocation();
            const isCurrentPage = this.curUrl === pathname;
            //
            const prevState = isCurrentPage ? this.state.uiStateTree : null;
            this.setState(createPartialState(props.blocks, prevState));
            this.curUrl = pathname;
        }
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unregistrables.forEach(unreg => unreg());
    }
    /**
     * @access protected
     */
    render({blocks}, {uiStateTree}) {
        return <div>
            <div class="p-relative" style="z-index: 1"><button
                onClick={ this.showBlockTreeHelpPopup.bind(this) }
                class={ `btn btn-link p-absolute btn-sm pt-1${uiStateTree ? '' : ' d-invisible'}` }
                type="button"
                style="right: .1rem">
                <Icon iconId="info-circle" className="size-xs"/>
            </button></div>
            { uiStateTree
                ? <ul class="block-tree mx-1" ref={ el => {
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
                    blocks.length
                        ? this.doRenderBranch(blocks, uiStateTree, createGetTreeBlocksFn(), ' ').concat(<li
                            onDragOver={ this.onDragOver }
                            onDrop={ this.onDrop }
                            onDragLeave={ this.onDragLeave }
                            data-draggable={ true }
                            data-last
                            draggable><div class="d-flex">&nbsp;</div></li>)
                        : <li>-</li>
                }</ul>
                : <LoadingSpinner className="ml-2 pl-2 pb-2"/>
            }
        </div>;
    }
    /**
     * @param {Array<Block>} branch
     * @param {Array<UiStateEntry>} uiStateArr
     * @param {(gbtRefBlock: Block) => Array<GlobalBlockTree>} getTreeBlocks
     * @param {string} nth2DepthCls
     * @param {number} depth = 1
     * @param {Block} parent = null
     * @param {Block} ref = null {type:'GlobalBlockReference'...}
     */
    doRenderBranch(branch, uiStateArr, getTreeBlocks, nth2DepthCls, depth = 1, parent = null, ref = null) { return branch.map((block, i) => {
        const uiStateEntry = uiStateArr[i];
        if (block.type === 'GlobalBlockReference') {
            return this.doRenderBranch(getTreeBlocks(block), [uiStateEntry], getTreeBlocks,
                nth2DepthCls === '' ? ' is-nth2-depth' : '', depth, parent, block);
        }
        //
        const lastIxd = branch.length - 1;
        const liUiState = uiStateEntry.item;
        if (block.type !== 'PageInfo') {
        const type = api.blockTypes.get(block.type);
        const title = getShortFriendlyName(block, type);
        const c = !block.children.length ? [] : this.doRenderBranch(block.children, uiStateEntry.children, getTreeBlocks, nth2DepthCls, depth + 1, block, ref);
        const rootRefBlockId = ref && block.id === getTreeBlocks(ref)[0].id ? ref.id : null;
        const isStoredTo = !ref ? 'main' : 'globalBlockTree';
        return [<li
            onDragStart={ this.onDragStart }
            onDrag={ this.onDrag }
            onDragOver={ this.onDragOver }
            onDragLeave={ this.onDragLeave }
            onDrop={ this.onDrop }
            onDragEnd={ this.onDragEnd }
            onMouseOver={ e => {
                const li = e.target.nodeName === 'LI' ? e.target : e.target.closest('li');
                if (!this.rightColumnViewIsCurrenlyOpen && !this.currentlyHoveredLi && li.getAttribute('data-block-id') === block.id) {
                    this.currentlyHoveredLi = li;
                    api.webPagePreview.highlightBlock(block, [...this.dragDrop.ul.querySelectorAll(`li[data-block-id="${block.id}"]`)].indexOf(li) + 1);
                }
            } }
            onMouseLeave={ e => {
                if (this.currentlyHoveredLi === e.target)
                    this.unHighlighCurrentlyHoveredLi();
            } }
            class={ [`${isStoredTo}-block${nth2DepthCls}`,
                    !liUiState.isSelected ? '' : ' selected',
                    !liUiState.isHidden ? '' : ' d-none',
                    !liUiState.isCollapsed ? '' : ' collapsed'].join('') }
            data-block-id={ block.id }
            data-is-stored-to-tree-id={ isStoredTo === 'main' ? 'main' : ref.globalBlockTreeId }
            data-is-root-block-of={ rootRefBlockId }
            data-depth={ depth }
            data-has-children={ c.length > 0 }
            data-is-children-of={ parent ? parent.id : null }
            data-first-child={ i === 0 }
            data-last-child={ i === lastIxd }
            data-draggable={ true }
            title={ title }
            key={ `${this.props.loadedPageSlug}-${block.id}` }
            draggable>
            { !c.length ? null : <button onClick={ () => this.toggleBranchIsCollapsed(uiStateEntry) } class="toggle p-absolute" type="button">
                <Icon iconId="chevron-down" className="size-xs"/>
            </button> }
            <div class="d-flex">
                <button onClick={ () => this.handleItemClickedOrFocused(block, uiStateEntry) } class="block-handle text-ellipsis" type="button">
                    <Icon iconId={ api.blockTypes.getIconId(type) } className="size-xs p-absolute"/>
                    <span class="text-ellipsis">{ title }</span>
                </button>
                <button onClick={ e => this.openMoreMenu(block, rootRefBlockId, e) } class="more-toggle pl-1" type="button">
                    <Icon iconId="dots" className="size-xs"/>
                </button>
            </div>
            { !rootRefBlockId
                ? null
                : <span
                    class="global-block-tree-guide"
                    style={ `height: calc((1.45rem * ${getVisibleLisCount(uiStateEntry)}) - 0.1rem)` }></span>
            }
        </li>].concat(c);
        }
        //
        const title = block.title || __('PageInfo');
        return <li
            class={ !liUiState.isSelected ? '' : 'selected' }
            data-block-id={ block.id }
            data-is-stored-to-tree-id="main"
            data-is-root-block-of={ null }
            data-block-type="PageInfo"
            data-depth={ depth }
            title={ title }
            key={ block.id }>
            <div class="d-flex">
                <button
                    onClick={ () => !this.disablePageInfo ? this.handleItemClickedOrFocused(block, uiStateEntry) : function(){} }
                    class="block-handle text-ellipsis"
                    type="button"
                    disabled={ this.disablePageInfo }>
                    <Icon iconId={ api.blockTypes.getIconId('PageInfo') } className="size-xs p-absolute"/>
                    <span class="text-ellipsis">{ title }</span>
                </button>
                <button onClick={ e => this.openMoreMenu(block, null, e) } class="more-toggle pl-1" type="button">
                    <Icon iconId="dots" className="size-xs"/>
                </button>
            </div>
        </li>;
    }); }
    /**
     * @param {ContextMenuLink} link
     * @access private
     */
    handleContextMenuLinkClicked(link) {
        const addContentKind = ({
            'add-content-above': 'before',
            'add-content-below': 'after',
            'add-content-as-child': 'as-child',
            'replace-block-with': 'as-child',
        }[link.id]) || null;
        if (addContentKind) {
            const {li} = this.openMoreMenuData;
            const [arrowRefEl, placeAtBefore] = createAddContentPlacementCfg(li, addContentKind);
            api.mainPopper.open(
                AddContentPopup,
                arrowRefEl,
                {targetInfo: createBlockDescriptorFromLi(li), insertPos: addContentKind, isReplace: link.id === 'replace-block-with'},
                {maxWidth: 580, offsetY: !placeAtBefore ? 4 : -25},
            );
        } else if (link.id === 'duplicate-block') {
            const [blockToCloneTrid, blockToCloneId] = getRealTarget(createBlockDescriptorFromLi(this.openMoreMenuData.li), null);
            this.cloneBlock(blockToCloneId, blockToCloneTrid);
        } else if (link.id === 'delete-block') {
            const blockVisible = this.openMoreMenuData.block;
            const [blockToDeleteTrid, blockToDeleteId] = getRealTarget(createBlockDescriptorFromLi(this.openMoreMenuData.li), null);
            this.deleteBlock(blockVisible, blockToDeleteId, blockToDeleteTrid);
        } else if (link.id === 'save-block-as-reusable') {
            const blockToStore = this.openMoreMenuData.block;
            const blockIsStoredTo = this.openMoreMenuData.li.getAttribute('data-is-stored-to-tree-id');
            const userCanCreateGlobalBlockTrees = api.user.can('createGlobalBlockTrees');
            floatingDialog.open(BlockSaveAsReusableDialog, {
                title: __('Save as reusable'),
                height: userCanCreateGlobalBlockTrees ? 468 : 254,
            }, {
                blockToConvertAndStore: blockToStore,
                onConfirmed: data => data.saveAsUnique ? this.doConvertBlockToGlobal(data, blockToStore, blockIsStoredTo) :
                    this.doSaveBlockAsReusable(data, blockToStore),
                userCanCreateGlobalBlockTrees,
            });
        }
    }
    /**
     * @access private
     */
    onContextMenuClosed() {
        this.openMoreMenuData = null;
        this.refElOfOpenMoreMenu.style.opacity = '';
    }
    /**
     * @param {Block} openBlock
     * @param {string} blockIsStoredTo
     * @access private
     */
    cloneBlock(blockId, blockIsStoredTo) {
        const saveButton = api.saveButton.getInstance();
        const [op, cloned] = createDuplicateBlockOp(blockId, blockIsStoredTo, saveButton);
        saveButton.pushOp(...op);
        api.webPagePreview.scrollToBlockAsync(cloned, 1);
    }
    /**
     * @param {Block} blockVisible
     * @param {string} blockToDeleteId
     * @param {string} blockToDeleteTrid
     * @access private
     */
    deleteBlock(blockVisible, blockToDeleteId, blockToDeleteTrid) {
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
        const saveButton = api.saveButton.getInstance();
        const op = createDeleteBlockOp(blockToDeleteId, blockToDeleteTrid, wasCurrentlySelectedBlock);
        saveButton.pushOp(...op);
    }
    /**
     * @param {{name: string;}} data
     * @param {Block} originalBlock The block/branch we're just turning global
     * @param {string} originalBlockIsStoredTo
     * @access private
     */
    doConvertBlockToGlobal(data, originalBlock, originalBlockIsStoredTo) {
        const newGbt = {
            id: generatePushID(),
            name: data.name,
            blocks: treeToTransferable([{...originalBlock, ...{title: data.name}}]),
        };
        const newGbRefBlock = createBlock(
            { // block.*
                type: 'GlobalBlockReference',
                title: data.name,
                renderer: 'jsx',
            },
            { // block.propData.*
                globalBlockTreeId: newGbt.id,
                overrides: '{}',
                useOverrides: 0,
            }
        );
        const saveButton = api.saveButton.getInstance();
        const ops = createConvertBlockToGlobalOps(newGbRefBlock, newGbt, originalBlock.id, originalBlockIsStoredTo, saveButton);
        if (ops.length === 1)
            saveButton.pushOp(...ops[0]);
        else
            saveButton.pushOpGroup(...ops);
    }
    /**
     * @param {{name: string;}} data From BlockSaveAsReusableDialog
     * @param {Block} block
     * @access private
     */
    doSaveBlockAsReusable(data, block) {
        const saveButton = api.saveButton.getInstance();

        const newTree = objectUtils.cloneDeep(saveButton.getChannelState('theBlockTree'));
        const [newReusableRootRef] = blockTreeUtils.findBlockMultiTree(block.id, newTree);

        // 1. Mutate new block tree (update `newReusable.blockBlueprints[0].title`)
        newReusableRootRef.title = data.name;

        // 2. Create new reusable branch
        const blockBlueprints = [blockToBlueprint(treeToTransferable([newReusableRootRef])[0], (blueprint, block) => {
            const nonClassUserAndDevStyles = scssWizard.findStyles('single-block', block.id);
            const replacer = createStyleShunkcScssIdReplacer(block.id, '@placeholder');
            const init = nonClassUserAndDevStyles.map(replacer); // 'data-block-id="uagNk..."' -> 'data-block-id="@placeholder:block-id"'
            return {
                ...blueprint,
                ...{initialStyles: init}
            };
        })];

        // 3. Commit all
        fetchOrGetReusableBranches().then(reusablesPrev => {
            const newReusablesState = [{
                id: generatePushID(),
                blockBlueprints,
            }, ...objectUtils.cloneDeep(reusablesPrev)];
            saveButton.pushOpGroup(
                ['theBlockTree', newTree, {event: 'update-many-blocks-prop'}],
                ['reusableBranches', newReusablesState, {event: 'create'}]
            );
        });
    }
    /**
     * @access private
     */
    showBlockTreeHelpPopup() {
        floatingDialog.open(BlockTreeShowHelpPopup, {
            title: __('Content tree'),
            width: 480,
            height: 525,
        }, {});
    }
    /**
     * @param {Block} block
     * @param {UiStateEntry|number} nthOfIdOrUiStateEntry
     * @param {'direct'|'web-page'|'styles-tab'} origin = 'direct'
     * @access public
     */
    handleItemClickedOrFocused(block, nthOfIdOrUiStateEntry, origin = 'direct') {
        const [uiStateEntry, nthOfId] = this.findUiStateEntryAndNthOfId(block, nthOfIdOrUiStateEntry);
        this.selectedRoot = block;
        events.emit('block-tree-item-clicked-or-focused', block, nthOfId, origin);
        api.webPagePreview.scrollToBlock(block, nthOfId);
        const mutRef = this.state.uiStateTree;

        // Uncollapse parents if needed
        if (origin === 'web-page' && uiStateEntry.item.isHidden) {
            const indices = withIdxPathDo(this.state.uiStateTree, (idxPath, _i, ent) => {
                if (ent === uiStateEntry) return splitPath(idxPath);
            });

            if (indices?.length) {
                let branch = mutRef;
                for (const idx of indices) {
                    const ent = branch[parseInt(idx)];
                    if (ent.item.isCollapsed) {
                        setAsCollapsed(false, ent, true);
                    }
                    branch = ent.children;
                }
            }
        }

        this.setState({uiStateTree: this.setBlockAsSelected(block, uiStateEntry, mutRef)});
    }
    /**
     * @param {Block} block
     * @param {globalBlockReferenceBlockId|null} isRootBlockOf
     * @param {Event} e
     * @access private
     */
    openMoreMenu(block, isRootBlockOf, e) {
        this.openMoreMenuData = {block, isRootBlockOf, li: e.target.closest('li')};
        this.refElOfOpenMoreMenu = e.target;
        this.refElOfOpenMoreMenu.style.opacity = '1';
        api.contextMenu.open(e, this.createContextMenuController(!!isRootBlockOf));
    }
    /**
     * @param {boolean} isGbtRoot
     * @returns {ContextMenuController}
     * @access private
     */
    createContextMenuController(isGbtRoot) {
        const isPageInfo = this.openMoreMenuData.block.type === 'PageInfo';
        const spawnLinks = [
            {text: __('↑ Add content above'), title: __('↑ Add content above'), id: 'add-content-above'},
            {text: __('↓ Add content below'), title: __('↓ Add content below'), id: 'add-content-below'},
            {text: __('↳ Add content as child'), title: __('↳ Add content as child'), id: 'add-content-as-child'},
            {text: __('↹ Replace with content'), title: __('Replace this content with'), id: 'replace-block-with'},
        ];
        return {
            getLinks: () => {
                const links = !isPageInfo
                    ? [
                        ...spawnLinks,
                        {text: __('Duplicate'), title: __('Duplicate content'), id: 'duplicate-block'},
                        {text: __('Delete'), title: __('Delete content'), id: 'delete-block'},
                        ...(api.user.can('createReusableBranches') || api.user.can('createGlobalBlockTrees') ? [
                            {text: __('Save as reusable'), title: __('Save as reusable content'), id: 'save-block-as-reusable'}
                        ] : [])
                    ]
                    : [
                        spawnLinks[1],
                    ];
                const notThese = isGbtRoot ? ['save-block-as-reusable'] : [];
                return notThese.length ? links.filter(({id}) => notThese.indexOf(id) < 0) : links;
            },
            onItemClicked: this.handleContextMenuLinkClicked.bind(this),
            onMenuClosed: this.onContextMenuClosed.bind(this),
        };
    }
    /**
     * @param {Block} block
     * @param {UiStateEntry} uiStateEntryMut
     * @param {Array<UiStateEntry>} treeMut = this.state.uiStateTree
     * @returns {Array<UiStateEntry>}
     * @access private
     */
    setBlockAsSelected(block, uiStateEntryMut, treeMut = this.state.uiStateTree) {
        // unselect all
        traverseRecursively(treeMut, itm => { itm.item.isSelected = false; });

        // select this
        if (uiStateEntryMut)
            uiStateEntryMut.item.isSelected = true;
        this.selectedRoot = block;

        return treeMut;
    }
    /**
     * @access private
     */
    deSelectAllBlocks() {
        if (!this.state.uiStateTree) return;
        this.setState({uiStateTree: this.setBlockAsSelected(null, null)});
    }
    /**
     * @param {LiUiState} liUiState
     * @access private
     */
    toggleBranchIsCollapsed(liUiState) {
        const mutRef = this.state.uiStateTree;
        const to = !liUiState.item.isCollapsed;
        liUiState.item.isCollapsed = to; // mutates mutRef
        hideOrShowChildren(to, liUiState);
        this.setState({uiStateTree: mutRef});
    }
    /**
     * @access private
     */
    addBlockHoverHighlightListeners() {
        const curHigh = {hovered: null, visible: null};
        this.unregistrables.push(events.on('highlight-rect-revealed', (blockId, nthOfId, origin) => {
            if (origin !== 'web-page') return;
            if (!this.props.blocks?.length) return;
            if (curHigh.hovered) clearHighlight(curHigh);
            const {ul} = this.dragDrop;
            const li = ul.querySelectorAll(`li[data-block-id="${blockId}"]`)[nthOfId - 1];
            if (li) {
                curHigh.hovered = li;
                curHigh.visible = !li.classList.contains('d-none') ? li : findVisibleLi(li, nthOfId, ul, li);
                curHigh.visible.classList.add('highlighted');
            }
        }));
        this.unregistrables.push(events.on('highlight-rect-removed', blockId => {
            if (curHigh.hovered && curHigh.hovered.getAttribute('data-block-id') === blockId)
                clearHighlight(curHigh);
        }));
    }
    /**
     * @access private
     */
    unHighlighCurrentlyHoveredLi() {
        api.webPagePreview.unHighlightBlock(this.currentlyHoveredLi.getAttribute('data-block-id'));
        this.currentlyHoveredLi = null;
    }
    /**
     * @param {Block} block
     * @param {UiStateEntry|number} nthOfIdOrUiStateEntry
     * @returns {[UiStateEntry, number]} [uiStateEntry, nthOfId]
     * @access private
     */
    findUiStateEntryAndNthOfId(block, nthOfIdOrUiStateEntry) {
        if (typeof nthOfIdOrUiStateEntry !== 'number') {
            let nthOfId = 0;
            let found = false;
            traverseRecursively(this.state.uiStateTree, ent => {
                if (!found && ent.item.blockId === nthOfIdOrUiStateEntry.item.blockId) {
                    nthOfId += 1;
                    found = ent === nthOfIdOrUiStateEntry;
                }
            });
            return [nthOfIdOrUiStateEntry, nthOfId];
        }
        return [
            findUiStateEntry(block.id, nthOfIdOrUiStateEntry, this.props.blocks, this.state.uiStateTree),
            nthOfIdOrUiStateEntry,
        ];
    }
}

export default BlockTree;
