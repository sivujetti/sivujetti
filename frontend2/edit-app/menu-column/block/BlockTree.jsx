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
    writeBlockProps,
} from '@sivujetti-commons-for-edit-app';
import createDndController, {
    callGetBlockPropChangesEvent,
    createBlockDescriptorFromLi,
} from '../../includes/block/create-block-tree-dnd-controller.js';
import TreeDragDrop from '../../includes/TreeDragDrop.js';
import BlockSaveAsReusableDialog from '../../main-column/popups/BlockSaveAsReusableDialog.jsx';
import BlockTreeShowHelpPopup from '../../main-column/popups/BlockTreeShowHelpPopup.jsx';
import {historyInstance} from '../../main-column/MainColumnViews.jsx';
import {
    blockToBlueprint,
    clearHighlight,
    createAddContentPlacementCfg,
    createPartialState,
    createStyleShunkcScssIdReplacer,
    duplicateDeepAndReAssignIds,
    findVisibleLi,
    getShortFriendlyName,
    hideOrShowChildren,
    setAsHidden,
    splitPath,
    withParentIdPathDo,
} from './BlockTreeFuncs.js';
import {fetchOrGet as fetchOrGetReusableBranches} from '../../includes/reusable-branches/repository.js';
import {fetchOrGet as fetchOrGetGlobalBlockTrees} from '../../includes/global-block-trees/repository.js';
import {createBlock, treeToTransferable} from '../../includes/block/utils.js';
import AddContentPopup from './AddContentPopup.jsx';

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
    /**
     * @access protected
     */
    componentWillMount() {
        this.unregistrables = [];
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
            if (!this.curUrl) this.curUrl = pathname;
            //
            const prevState = pathname === this.curUrl ? this.state : {};
            //
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
    render({blocks}, {treeState}) {
        return <div>
            <div class="p-relative" style="z-index: 1"><button
                onClick={ this.showBlockTreeHelpPopup.bind(this) }
                class={ `btn btn-link p-absolute btn-sm pt-1${treeState ? '' : ' d-invisible'}` }
                type="button"
                style="right: .1rem">
                <Icon iconId="info-circle" className="size-xs"/>
            </button></div>
            { treeState
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
                        ? this.doRenderBranch(blocks).concat(<li
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
     * @param {Number} depth = 1
     * @param {Block} paren = null
     * @param {Block} ref = null {type:'GlobalBlockReference'...}
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
                if (!this.rightColumnViewIsCurrenlyOpen && !this.currentlyHoveredLi && e.target.getAttribute('data-block-id') === block.id) {
                    this.currentlyHoveredLi = e.target;
                    api.webPagePreview.highlightBlock(block);
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
                    <Icon iconId={ api.blockTypes.getIconId(type) } className="size-xs p-absolute"/>
                    <span class="text-ellipsis">{ title }</span>
                </button>
                <button onClick={ e => this.openMoreMenu(block, rootRefBlockId !== null, e) } class="more-toggle pl-1" type="button">
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
                    <Icon iconId={ api.blockTypes.getIconId('PageInfo') } className="size-xs p-absolute"/>
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
        const addContentKind = ({
            'add-content-above': 'before',
            'add-content-below': 'after',
            'add-content-as-child': 'as-child',
        }[link.id]) || null;
        if (addContentKind) {
            const li = this.openedBlockDetails;
            const [arrowRefEl, placeAtBefore] = createAddContentPlacementCfg(li, addContentKind);
            api.mainPopper.open(
                AddContentPopup,
                arrowRefEl,
                {targetInfo: createBlockDescriptorFromLi(li), insertPos: addContentKind},
                {maxWidth: 580, offsetY: !placeAtBefore ? 4 : -25},
            );
        } else if (link.id === 'duplicate-block') {
            const withStyles = link.text.indexOf('(') < 0;
            this.cloneBlock(this.blockWithMoreMenuOpened, withStyles);
        } else if (link.id === 'delete-block') {
            this.deleteBlock(this.blockWithMoreMenuOpened);
        } else if (link.id === 'save-block-as-reusable') {
            const blockToStore = this.blockWithMoreMenuOpened;
            const userCanCreateGlobalBlockTrees = api.user.can('createGlobalBlockTrees');
            floatingDialog.open(BlockSaveAsReusableDialog, {
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
     * @param {Block} openBlock
     * @param {Boolean} alsoCloneStyles
     * @access private
     */
    cloneBlock(openBlock, alsoCloneStyles) {
        const saveButton = api.saveButton.getInstance();
        let cloned;

        let newUserStyles = [];
        let newDevStyles = [];
        const newTree = blockTreeUtils.createMutation(saveButton.getChannelState('theBlockTree'), newTreeCopy => {
            const [origBlockRef, refBranch] = blockTreeUtils.findBlockMultiTree(openBlock.id, newTreeCopy);
            const cloned2 = duplicateDeepAndReAssignIds(origBlockRef);
            const changes = callGetBlockPropChangesEvent(cloned2.type, 'cloneBlock', [cloned2]);
            if (changes) writeBlockProps(cloned2, changes);

            if (alsoCloneStyles) {
                // todo
            }

            // insert after current
            refBranch.splice(refBranch.indexOf(origBlockRef) + 1, 0, cloned2);
            cloned = cloned2;
            return newTreeCopy;
        });

        const pushNewTreeArgs = ['theBlockTree', newTree, {event: 'duplicate'}];

        if (newUserStyles.length || newDevStyles.length) {
            // todo
        } else {
            saveButton.pushOp(...pushNewTreeArgs);
        }

        api.webPagePreview.scrollToBlockAsync(cloned);
    }
    /**
     * @param {Block} openBlock
     * @access private
     */
    deleteBlock(blockVisible) {
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
        const blockToDeleteId = !this.blockWithMoreMenuOpenedIsGbtsOutermostBlock
            ? blockVisible.id
            : this.openedBlockDetails.getAttribute('data-is-root-block-of');
        const saveButton = api.saveButton.getInstance();
        saveButton.pushOp(
            'theBlockTree',
            blockTreeUtils.createMutation(saveButton.getChannelState('theBlockTree'), newTreeCopy => {
                const [ref, refBranch] = blockTreeUtils.findBlockMultiTree(blockToDeleteId, newTreeCopy);
                refBranch.splice(refBranch.indexOf(ref), 1); // mutates newTreeCopy
                return newTreeCopy;
            }), {event: 'delete', wasCurrentlySelectedBlock}
        );
    }
    /**
     * @param {{name: String;}} data
     * @param {Block} originalBlock The block/branch we're just turning global
     * @access private
     */
    doConvertBlockToGlobal(data, originalBlock) {
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
                __globalBlockTree: newGbt,
            },
            { // block.propData.*
                globalBlockTreeId: newGbt.id,
                overrides: '{}',
                useOverrides: 0,
            }
        );

        const saveButton = api.saveButton.getInstance();
        // Swap original block/branch with the new 'GlobalBlockReference' block
        const updateBlockTreeOpArgs = [
            'theBlockTree',
            blockTreeUtils.createMutation(saveButton.getChannelState('theBlockTree'), newTreeCopy => {
                const [curBlockRef, refBranch] = blockTreeUtils.findBlock(originalBlock.id, newTreeCopy);
                refBranch[refBranch.indexOf(curBlockRef)] = newGbRefBlock;
                return newTreeCopy;
            }),
            {
                event: 'convert-branch-to-global-block-reference-block',
                originalBlockId: originalBlock.id,
                newBlockId: newGbRefBlock.id,
            }
        ];

        // Create new 'globalBlockTrees' state array and push it to the history
        fetchOrGetGlobalBlockTrees().then(gbtsPrev => {
            const newGbtsState = [...objectUtils.cloneDeep(gbtsPrev), newGbt];
            const pushNewGbtsStateOpArgs = ['globalBlockTrees', newGbtsState, {event: 'create'}];

            saveButton.pushOpGroup(
                updateBlockTreeOpArgs,
                pushNewGbtsStateOpArgs
            );
        });
    }
    /**
     * @param {{name: String;}} data From BlockSaveAsReusableDialog
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
            width: 448,
        }, {});
    }
    /**
     * @param {Block} block
     * @param {'direct'|'web-page'|'styles-tab'} origin = 'direct'
     * @access public
     */
    handleItemClickedOrFocused(block, origin = 'direct') {
        this.selectedRoot = block;
        events.emit('block-tree-item-clicked-or-focused', block, origin);
        api.webPagePreview.scrollToBlock(block);
        //
        const mutRef = this.state.treeState;
        const root = blockTreeUtils.findBlockMultiTree(block.id, this.props.blocks)[3];
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
     * @param {Block} block
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
        api.contextMenu.open(e, this.createContextMenuController(blockIsGbtsOutermostBlock));
    }
    /**
     * @param {Boolean} blockIsGbtsOutermostBlock
     * @returns {ContextMenuController}
     * @access private
     */
    createContextMenuController(blockIsGbtsOutermostBlock) {
        return {
            getLinks: () => {
                const links = [
                    ...[
                        {text: __('↑ Add content above'), title: __(''), id: 'add-content-above'},
                        {text: __('↓ Add content below'), title: __(''), id: 'add-content-below'},
                        {text: __('↳ Add content as child'), title: __(''), id: 'add-content-as-child'},
                        {text: __('Duplicate'), title: __('Duplicate content'), id: 'duplicate-block'},
                        {text: __('Delete'), title: __('Delete content'), id: 'delete-block'},
                    ],
                    ...(api.user.can('createReusableBranches') || api.user.can('createGlobalBlockTrees')
                        ? [{text: __('Save as reusable'), title: __('Save as reusable content'), id: 'save-block-as-reusable'}]
                        : []),
                ];
                const notThese = blockIsGbtsOutermostBlock ? ['duplicate-block'] : [];
                return notThese.length ? links.filter(({id}) => notThese.indexOf(id) < 0) : links;
            },
            onItemClicked: this.handleContextMenuLinkClicked.bind(this),
            onMenuClosed: this.onContextMenuClosed.bind(this),
        };
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
     * @param {Block} block
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
    addBlockHoverHighlightListeners() {
        const curHigh = {hovered: null, visible: null};
        this.unregistrables.push(events.on('highlight-rect-revealed', (blockId, origin) => {
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
}

/**
 * @param {Block} original
 * @param {Block} cloned
 * @returns {[Array<Block>, Array<Block]}
 */
function flattenBlocksRecursive(original, cloned) {
    const flatOriginal = [];
    traverseRecursively([original], b1 => {
        flatOriginal.push(b1);
    });
    const flatCloned = [];
    traverseRecursively([cloned], b2 => {
        flatCloned.push(b2);
    });
    return [flatOriginal, flatCloned];
}

export default BlockTree;
