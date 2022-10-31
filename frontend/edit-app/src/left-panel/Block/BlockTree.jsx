import {__, api, http, signals, floatingDialog, Icon} from '@sivujetti-commons-for-edit-app';
import {getIcon} from '../../block-types/block-types.js';
import {cloneDeep, createBlockFromType, findRefBlockOf, isTreesOutermostBlock, setTrids, treeToTransferable} from '../../Block/utils.js';
import ContextMenu from '../../commons/ContextMenu.jsx';
import {generatePushID} from '../../commons/utils.js';
import BlockTreeShowHelpPopup from '../../BlockTreeShowHelpPopup.jsx';
import store, {observeStore, createSelectBlockTree, createSetBlockTree,
                pushItemToOpQueue, createUpdateBlockTreeItemData} from '../../store.js';
import BlockTreeDragDrop from '../../BlockTreeDragDrop.js';
import SaveBlockAsReusableDialog from '../../SaveBlockAsReusableDialog.jsx';
import store2 from '../../store2.js';
import TreeDragDrop from '../../TreeDragDrop.js';
import BlockDnDSpawner from './BlockDnDSpawner.jsx';
import BlockDnDSpawner2 from './BlockDnDSpawner2.jsx';
import blockTreeUtils from './blockTreeUtils.js';
import createDndController, {saveExistingBlocksToBackend} from './createBlockTreeDndController.js';

const useNoUlBlockTree = false;

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
        if (!useNoUlBlockTree) {
        this.dragDrop = new BlockTreeDragDrop(this, (mutation1, _mutation2 = null) => {
        const trid = mutation1.blockToMove.isStoredToTreeId;
        const {tree} = createSelectBlockTree(trid)(store.getState());
        store.dispatch(createSetBlockTree(trid)(tree, ['swap-blocks', [mutation1]]));
        store.dispatch(pushItemToOpQueue(`swap-blocks-of-tree##${trid}`, {
            doHandle: trid !== 'main' || !this.currentPageIsPlaceholder
                ? () => saveExistingBlocksToBackend(createSelectBlockTree(trid)(store.getState()).tree, trid)
                : null
            ,
            doUndo: () => {
                const treeBefore = mutation1.doRevert();
                store.dispatch(createSetBlockTree(trid)(treeBefore, ['undo-swap-blocks', mutation1]));
            },
            args: [],
        }));
        });
        } else {
        this.boundDoRenderBranch = this.doRenderBranch.bind(this);
        this.dragDrop = new TreeDragDrop(createDndController(this));
        }
        this.onDragStart = this.dragDrop.handleDragStarted.bind(this.dragDrop);
        this.onDragOver = this.dragDrop.handleDraggedOver.bind(this.dragDrop);
        if (useNoUlBlockTree) this.onDragLeave = this.dragDrop.handleDraggedOut.bind(this.dragDrop);
        this.onDrop = this.dragDrop.handleDraggableDropped.bind(this.dragDrop);
        this.onDragEnd = this.dragDrop.handleDragEnded.bind(this.dragDrop);
        //
        const maybe = createSelectBlockTree('main')(store.getState());
        if (maybe.tree) this.receiveNewBlocks(maybe.tree);
    }
    /**
     * @param {{loadedPageSlug: String; containingView: leftPanelName;}} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.loadedPageSlug === this.props.loadedPageSlug) return;
        this.unregistrables.forEach(unregister => unregister());
        this.unregistrables = [];
        this.receiveNewBlocks(createSelectBlockTree('main')(store.getState()).tree);
    }
    /**
     * @param {Array<RawBlock>} tree
     * @access protected
     */
    receiveNewBlocks(tree) {
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
        this.unregistrables.push(...currentPageTrids.map(trid =>
            observeStore(createSelectBlockTree(trid), ({tree, context}) => {
                if (!context || (context[0] === 'init'))
                    return;
                if (refreshAllEvents.indexOf(context[0]) > -1 && context[2] !== 'dnd-spawner') {
                    let treeStateOverride2 = undefined;
                    if (context[0] === 'swap-blocks' && context[1][0].position === 'as-child') {
                        treeStateOverride2 = {[context[1][0].blockToMoveTo.id]: {isCollapsed: false}}; // todo childrens' isHidden?
                    } else if (context[0] === 'commit-add-single-block') {
                        const parent = blockTreeUtils.findBlock(context[1].blockId, tree)[2];
                        if (parent)
                            treeStateOverride2 = {[parent.id]: {isCollapsed: false}}; // todo childrens' isHidden?
                    }
                    //
                    this.setState(Object.assign(
                        trid === 'main' ? {blockTree: tree} : {},
                        {treeState: createTreeState([], true, this.state.treeState, treeStateOverride2)}
                    ));
                } else if (context[0].endsWith('update-single-value')) {
                    if (!this.tempHack) return;
                    if (trid === 'main')
                        this.setState({blockTree: tree});
                    // else ; ??
                    this.tempHack = null;
                }
            }, true)
        ));
        this.setState({blockTree: tree, treeState: createTreeState([], true)});
    }
    /**
     * @access protected
     */
    render(_, {blockTree, treeState, loading}) {
        if (useNoUlBlockTree) {
        return <div class="py-2">
            <div class="p-relative" style="z-index: 1"><button
                onClick={ this.showBlockTreeHelpPopup.bind(this) }
                class="btn btn-link p-absolute btn-sm pt-1"
                type="button"
                style="right: .75rem;top: 0;">
                <Icon iconId="info-circle" className="size-xs"/>
            </button></div>
            <BlockDnDSpawner2
                mainTreeDnd={ this.dragDrop }
                mainTree={ this }
                saveExistingBlocksToBackend={ saveExistingBlocksToBackend }
                currentPageIsPlaceholder={ this.currentPageIsPlaceholder }
                initiallyIsOpen={ this.currentPageIsPlaceholder && this.props.containingView === 'CreatePage' }
                ref={ this.blockSpawner }/>
            <ul class={ `block-tree2 ml-1${!loading ? '' : ' loading'}` } ref={ el => {
                if (!el) return;
                this.dragDrop.attachOrUpdate(el);
            } }>{
                blockTree.length
                    ? this.boundDoRenderBranch(blockTree).concat(<li
                        onDragOver={ this.onDragOver }
                        onDrop={ this.onDrop }
                        data-draggable={ true }
                        data-last
                        draggable><div class="d-flex">&nbsp;</div></li>)
                    : <li>-</li>
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
                onMenuClosed={ () => { this.refElOfOpenMoreMenu.style.opacity = ''; } }
                ref={ this.moreMenu }/>
        </div>;
        } else {
        const renderBranch = (branch, root = null) => branch.map((block, i) => {
            if (block.type === 'GlobalBlockReference')
                return renderBranch(createSelectBlockTree(block.globalBlockTreeId)(store.getState()).tree, block);
            //
            if (block.type !== 'PageInfo') {
            const type = api.blockTypes.get(block.type);
            const title = getShortFriendlyName(block, type);
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
                key={ `${block.id}${block.title}` }
                title={ title }
                draggable>
                { !block.children.length
                    ? null
                    : <button onClick={ () => this.toggleBranchIsCollapsed(block) } class="toggle p-absolute" type="button"><Icon iconId="chevron-down" className="size-xs"/></button>
                }
                <div class="d-flex">
                    <button onClick={ () => this.handleItemClickedOrFocused(block) } class="block-handle text-ellipsis" type="button">
                        <Icon iconId={ getIcon(type) } className="size-xs p-absolute"/>
                        <span class="text-ellipsis">{ title }</span>
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
            const title = block.title || __('PageInfo');
            return <li
                class={ [!treeState[block.id].isSelected ? '' : 'selected'].join(' ') }
                data-block-type="PageInfo"
                data-block-id={ block.id }
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
                saveExistingBlocksToBackend={ saveExistingBlocksToBackend }
                currentPageIsPlaceholder={ this.currentPageIsPlaceholder }
                initiallyIsOpen={ this.currentPageIsPlaceholder && this.props.containingView === 'CreatePage' }/>
            <ul class={ `block-tree${!loading ? '' : ' loading'}` }>{
                blockTree ? blockTree.length
                    ? renderBranch(blockTree).concat(<li
                        data-last="y"
                        onDragOver={ this.onDragOver }
                        onDragLeave={ this.onDragLeave }
                        onDrop={ this.onDrop }
                        onDragEnd={ this.onDragEnd }
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
                onMenuClosed={ () => { this.refElOfOpenMoreMenu.style.opacity = ''; } }
                ref={ this.moreMenu }/>
        </div>;
        }
    }
    doRenderBranch(branch, depth = 1, parent = null, root = null) { return branch.map((block, i) => {
        if (block.type === 'GlobalBlockReference')
            return this.boundDoRenderBranch(createSelectBlockTree(block.globalBlockTreeId)(store.getState()).tree, depth, block, block);
        const lastIxd = branch.length - 1;
        //
        const {treeState} = this.state;
        if (block.type !== 'PageInfo') {
        const type = api.blockTypes.get(block.type);
        const title = getShortFriendlyName(block, type);
        const c = !block.children.length ? [] : this.boundDoRenderBranch(block.children, depth + 1, block);
        return [<li
            onDragStart={ this.onDragStart }
            onDragOver={ this.onDragOver }
            onDragLeave={ this.onDragLeave }
            onDrop={ this.onDrop }
            onDragEnd={ this.onDragEnd }
            class={ [`${block.isStoredTo}-block`,
                    !treeState[block.id].isSelected ? '' : ' selected',
                    !treeState[block.id].isHidden ? '' : ' d-none',
                    !treeState[block.id].isCollapsed ? '' : ' collapsed'].join('') }
            data-block-id={ block.id }
            data-trid={ block.isStoredToTreeId }
            data-depth={ depth }
            data-has-children={ c.length > 0 }
            data-is-children-of={ parent ? parent.id : '-' }
            data-first-child={ i === 0 }
            data-last-child={ i === lastIxd }
            data-draggable={ true }
            title={ title }
            key={ block.id }
            draggable>
            { !c.length ? null : <button onClick={ () => this.toggleBranchIsCollapsed(block) } class="toggle p-absolute" type="button">
                <Icon iconId="chevron-down" className="size-xs"/>
            </button> }
            <div class="d-flex">
                <button onClick={ () => this.handleItemClickedOrFocused(block) } class="block-handle text-ellipsis" type="button">
                    <Icon iconId={ getIcon(type) } className="size-xs p-absolute"/>
                    <span class="text-ellipsis">{ title }</span>
                </button>
                <button onClick={ e => this.openMoreMenu(block, root && i === 0, e) } class="more-toggle ml-2" type="button">
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
        /*if (link.id === 'add-paragraph-after') {
            this.addParagraph(this.blockWithMoreMenuOpened, 'after');
        } else if (link.id === 'add-paragraph-child') {
            this.addParagraph(this.blockWithMoreMenuOpened, 'as-child');
        } else */if (link.id === 'duplicate-block') {
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
                    ? () => saveExistingBlocksToBackend(createSelectBlockTree(trid)(store.getState()).tree, trid)
                    : null
                ,
                doUndo: () => {
                    store.dispatch(createSetBlockTree(trid)(treeBefore, ['undo-delete-single-block',
                        {blockId: id, blockType: type, trid, isRootOfOfTrid}]));
                },
                args: [],
            }));
            signals.emit('on-block-deleted', (base || blockVisible), wasCurrentlySelectedBlock);
        } else if (link.id === 'save-block-as-reusable') {
            const blockToStore = this.blockWithMoreMenuOpened;
            const userCanCreateGlobalBlockTrees = api.user.can('createGlobalBlockTrees');
            floatingDialog.open(SaveBlockAsReusableDialog, {
                title: __('Save as reusable'),
                height: userCanCreateGlobalBlockTrees ? 360 : 254,
            }, {
                blockToConvertAndStore: blockToStore,
                onConfirmed: data => data.saveAsUnique ? this.doConvertBlockToGlobal(data, blockToStore) :
                    this.doSaveBlockAsReusable(data, blockToStore),
                userCanCreateGlobalBlockTrees,
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
        api.webPageIframe.scrollTo(cloned, true);
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
                ? () => saveExistingBlocksToBackend(createSelectBlockTree(trid)(store.getState()).tree, trid)
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
        api.webPageIframe.registerWebPageDomUpdater(newGbt.id);

        // #4
        let [b, br] = blockTreeUtils.findBlock(originalBlock.id, tree);
        const turned = createBlockFromType('GlobalBlockReference', 'main', undefined,
            {globalBlockTreeId: newGbt.id},
        );
        br[br.indexOf(b)] = turned;
        const eventData = {blockId: turned.id, blockType: turned.blockType, trid: 'main', isRootOfOfTrid: newGbt.id};
        store.dispatch(createSetBlockTree('main')(tree, ['convert-block-to-global', eventData]));

        store.dispatch(pushItemToOpQueue('convert-block-to-global', {
            doHandle: () => {
                const {tree} = createSelectBlockTree(newGbt.id)(store.getState());
                const gbt = {id: newGbt.id, name: newGbt.name, blocks: treeToTransferable(tree)};
                return http.post('/api/global-block-trees', gbt).then(resp => {
                    if (resp.ok !== 'ok') throw new Error('-');
                    return saveExistingBlocksToBackend(createSelectBlockTree('main')(store.getState()).tree, 'main');
                });
            },
            doUndo: () => {
                // No need to revert #1

                // Revert #3
                api.webPageIframe.unregisterWebPageDomUpdaterForBlockTree(newGbt.id);

                // Revert #4
                store.dispatch(createSetBlockTree('main')(treeBefore, ['undo-convert-block-to-global', eventData]));
                setTimeout(() => {
                // No need to revert #2
                    api.editApp.removeBlockTree(newGbt.id);
                }, 4000);
            },
            args: [],
        }));
    }/**
     * @param {{name: String;}} data
     * @param {RawBlock} block
     * @access private
     */
    doSaveBlockAsReusable(data, block) {
        const {tree} = createSelectBlockTree(block.isStoredToTreeId)(store.getState());
        const treeBefore = JSON.parse(JSON.stringify(tree));

        // #1 Mutate title of the existing block
        const contextData = {blockId: block.id, blockType: block.type, trid: block.isStoredToTreeId};
        const eventData = {title: data.name};
        const titleChanged = block.title !== eventData.title;
        this.tempHack = titleChanged;
        const undoThis = this;
        emitMutateBlockProp(eventData, contextData); // Mutates {tree}

        // #2 Push item to reusableBranches
        const newReusableBranch = {id: generatePushID(), blockBlueprints: [blockToBlueprint(treeToTransferable([block])[0])]};
        store2.dispatch('reusableBranches/addItem', [newReusableBranch]);
        const postData = Object.assign({}, newReusableBranch);

        // Push saveToBackend op
        store.dispatch(pushItemToOpQueue('create-reusable-branch', {
            doHandle: () => http.post('/api/reusable-branches', postData).then(resp => {
                if (resp.ok !== 'ok') throw new Error('-');
                return saveExistingBlocksToBackend(createSelectBlockTree(contextData.trid)(store.getState()).tree,
                    contextData.trid);
            }),
            doUndo: () => {
                undoThis.tempHack = titleChanged;
                // Revert #1
                store.dispatch(createSetBlockTree(contextData.trid)(treeBefore, ['undo-update-single-value', contextData]));
                // Revert #2
                store2.dispatch('reusableBranches/removeItem', [newReusableBranch.id]);
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
                .concat(blockIsGlobalBlockTreesOutermostBlock ? ['duplicate-block'] : [])
                .concat(['Columns', 'Section'].indexOf(block.type) < 0 ? ['save-block-as-reusable'] : []);
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
        if (!useNoUlBlockTree) {
        const mutRef = this.state.treeState;
        mutRef[block.id].isCollapsed = !mutRef[block.id].isCollapsed;
        this.setState({treeState: mutRef});
        } else {
        const mutRef = this.state.treeState;
        const to = !mutRef[block.id].isCollapsed;
        mutRef[block.id].isCollapsed = to;
        hideOrShowChildren(to, block, mutRef);
        this.setState({treeState: mutRef});
        }
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
        signals.emit('on-block-tree-item-clicked-or-focused', block, origin);
        if (origin !== 'web-page') api.webPageIframe.scrollTo(block);
        //
        const mutRef = this.state.treeState;
        const {tree} = createSelectBlockTree(block.isStoredToTreeId)(store.getState());
        const ids = findBlockWithParentIdPath(tree, ({id}, path) => {
            if (id !== block.id) return null;
            // Found block, has no children
            if (!path) return [block.id];
            // Found block, has children
            return splitPath(path);
        });
        ids.concat(block.id).forEach(id => {
            mutRef[id].isCollapsed = false;
            hideOrShowChildren(false, blockTreeUtils.findBlock(id, tree)[0], mutRef);
        });
        this.setState({treeState: this.setBlockAsSelected(block, mutRef)});
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
 * @param {Boolean} setAsHidden
 * @param {RawBlock} block
 * @param {Object} mutRef
 */
function hideOrShowChildren(setAsHidden, block, mutRef) {
    if (!block.children.length) return;
    if (setAsHidden)
        block.children.forEach(b2 => {
            mutRef[b2.id].isHidden = true;
            // Always hide all children
            hideOrShowChildren(true, b2, mutRef);
        });
    else
        block.children.forEach(b2 => {
            mutRef[b2.id].isHidden = false;
            // Show children only if it's not collapsed
            if (!mutRef[b2.id].isCollapsed) hideOrShowChildren(false, b2, mutRef);
        });
}

/**
 * @returns {Array<String>} ['main', '1', '42']
 */
function getRegisteredReduxTreeIds() {
    return ['main'].concat(Object.keys(store.reducerManager.getReducerMap())
        .filter(key => key !== 'blockTree_main' && key.startsWith('blockTree_'))
        .map(storeKey => storeKey.split('blockTree_')[1]));
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

/**
 * @param {Object} overrides = {}
 * @returns {BlockTreeItemState}
 */
function createTreeStateItem(parent, overrides = {}) {
    return Object.assign({
        isSelected: false,
        isCollapsed: false,
        isHidden: parent ? parent.isCollapsed : false,
        isNew: false,
    }, overrides);
}

/**
 * @param {Array<RawBlock>} tree
 * @param {Boolean} full = false
 * @param {{[key: String]: BlockTreeItemState;}} previous = {}
 * @returns {{[key: String]: BlockTreeItemState;}}
 */
function createTreeState(tree, full = false, previous = {}, p2 = {}) {
    const out = {};
    if (!full) {
        blockTreeUtils.traverseRecursively(tree, (block, _i, parent) => {
            out[block.id] = createTreeStateItem(parent ? out[parent.id] : null);
        });
    } else {
        blockTreeUtils.traverseRecursively(createSelectBlockTree('main')(store.getState()).tree, (block, _i, parent) => {
            if (block.type !== 'GlobalBlockReference') {
                out[block.id] = createTreeStateItem(parent ? out[parent.id] : null, p2[block.id] || previous[block.id]);
            } else {
                const trid = block.globalBlockTreeId;
                blockTreeUtils.traverseRecursively(createSelectBlockTree(trid)(store.getState()).tree, (block2, _i2, parent2) => {
                    out[block2.id] = createTreeStateItem(parent2 ? out[parent2.id] : null, p2[block.id] || previous[block2.id]);
                });
            }
        });
    }
    return out;
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
 * @param {{[key]: any;}} newData
 * @param {DefaultChangeEventData} contextData
 */
function emitMutateBlockProp(newData, contextData) {
    store.dispatch(createUpdateBlockTreeItemData(contextData.trid)(
        newData,
        contextData.blockId,
        ['update-single-value', contextData]
    ));
}

/**
 * @param {Array<{[key]: any;}>} oldDataQ
 * @param {DefaultChangeEventData} contextData
 */
function emitPushStickyOp(oldDataQ, contextData) {
    const oldData = takeOldestValues(oldDataQ);
    oldDataQ.splice(0, oldDataQ.length);
    //
    store.dispatch(pushItemToOpQueue(`update-block-tree#${contextData.trid}`, {
        doHandle: contextData.trid !== 'main'// || !currentInstance.currentPageIsPlaceholder ? 
            ? () => {
                const {trid} = contextData;
                const {tree} = createSelectBlockTree(trid)(store.getState());
                return saveExistingBlocksToBackend(tree, trid);
            }
            : null,
        doUndo: () => {
            store.dispatch(createUpdateBlockTreeItemData(contextData.trid)(
                oldData,
                contextData.blockId,
                ['undo-update-single-value', contextData]
            ));
        },
        args: [],
    }));
}

/**
 * In: [{text: 'Fo'}, {text: 'Foo'}, {level: 2}]
 * Out: {text: 'Fo', level: 2}
 *
 * @param {Array<{[key]: any;}>} oldDataQ
 * @returns {{[key]: any;}}
 */
function takeOldestValues(oldDataQ) {
    const out = {};
    for (const obj of oldDataQ) {
        for (const key in obj) {
            if (!Object.prototype.hasOwnProperty.call(out, key))
                out[key] = obj[key];
            // else ignore newer value obj[key]
        }
    }
    return out;
}

export default BlockTree;
export {emitMutateBlockProp, emitPushStickyOp};
