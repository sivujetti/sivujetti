import {__, api, signals, floatingDialog, Icon} from '@sivujetti-commons-for-edit-app';
import {getIcon} from '../../block-types/block-types.js';
import {cloneDeep, treeToTransferable} from '../../Block/utils.js';
import ContextMenu from '../../commons/ContextMenu.jsx';
import {generatePushID} from '../../commons/utils.js';
import BlockTreeShowHelpPopup from '../../BlockTreeShowHelpPopup.jsx';
import SaveBlockAsReusableDialog from '../../SaveBlockAsReusableDialog.jsx';
import store2, {observeStore as observeStore2} from '../../store2.js';
import TreeDragDrop from '../../TreeDragDrop.js';
import BlockDnDSpawner2 from './BlockDnDSpawner2.jsx';
import blockTreeUtils from './blockTreeUtils.js';
import createDndController, {createBlockDescriptor} from './createBlockTreeDndController.js';

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
        this.onDragOver = this.dragDrop.handleDraggedOver.bind(this.dragDrop);
        this.onDragLeave = this.dragDrop.handleDraggedOut.bind(this.dragDrop);
        this.onDrop = this.dragDrop.handleDraggableDropped.bind(this.dragDrop);
        this.onDragEnd = this.dragDrop.handleDragEnded.bind(this.dragDrop);
        const maybe = store2.get().theBlockTree;
        if (maybe) this.receiveNewBlocks2(maybe);
    }
    /**
     * @param {{loadedPageSlug: String; containingView: leftPanelName;}} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.loadedPageSlug === this.props.loadedPageSlug) return;
        this.unregistrables.forEach(unregister => unregister());
        this.unregistrables = [];
        this.receiveNewBlocks2(store2.get().theBlockTree);
    }
    /**
     * @param {Array<RawBlock>} theBlockTree
     * @access protected
     */
    receiveNewBlocks2(theBlockTree) {
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
                this.setBlocksToState(theBlockTree);
            } else if (event === 'theBlockTree/updateDefPropsOf' || event === 'theBlockTree/undoUpdateDefPropsOf') {
                const isOnlyStyleClassesChange = event === 'theBlockTree/updateDefPropsOf'
                    ? data[3]  // [<blockId>, <blockIsStoredToTreeId>, <changes>, <isOnlyStyleClassesChange>]
                    : data[3]; // [<oldTree>, <blockId>, <blockIsStoredToTreeId>, <isOnlyStyleClassesChange>]
                if (isOnlyStyleClassesChange) return;
                this.setBlocksToState(theBlockTree);
            }
        }));
        // 1. Initial
        this.setBlocksToState(theBlockTree);
    }
    /**
     * @param {Array<RawBlock>} tree
     * @access private
     */
    setBlocksToState(tree) {
        this.setState({blockTree: tree, treeState: createTreeState2(tree, true)});
    }
    /**
     * @access protected
     */
    render(_, {blockTree}) {
        return <div class="pt-2">
            <div class="p-relative" style="z-index: 1"><button
                onClick={ this.showBlockTreeHelpPopup.bind(this) }
                class="btn btn-link p-absolute btn-sm pt-1"
                type="button"
                style="right: -.1rem; top: .1rem;">
                <Icon iconId="info-circle" className="size-xs"/>
            </button></div>
            <BlockDnDSpawner2
                mainTreeDnd={ this.dragDrop }
                initiallyIsOpen={ this.currentPageIsPlaceholder && this.props.containingView === 'CreatePage' }
                ref={ this.blockSpawner }/>
            <ul class="block-tree ml-1" ref={ el => {
                if (!el) return;
                this.dragDrop.attachOrUpdate(el);
            } }>{
                blockTree ? blockTree.length
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
     * @param {RawBlock} root = null
     */
    doRenderBranch(branch, depth = 1, paren = null, root  = null) { return branch.map((block, i) => {
        if (block.type === 'GlobalBlockReference')
            return this.doRenderBranch(block.__globalBlockTree.blocks, depth, paren, block);
        //
        const lastIxd = branch.length - 1;
        const {treeState} = this.state;
        if (block.type !== 'PageInfo') {
        const type = api.blockTypes.get(block.type);
        const title = getShortFriendlyName(block, type);
        const c = !block.children.length ? [] : this.doRenderBranch(block.children, depth + 1, block);
        const isRootBlockOf = !(root && i === 0) ? null : root.id;
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
            data-is-stored-to-trid={ block.isStoredToTreeId }
            data-is-root-block-of={ isRootBlockOf }
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
                <button onClick={ e => this.openMoreMenu(block, isRootBlockOf !== null, e) } class="more-toggle ml-2" type="button">
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
                const {id, isStoredToTreeId} = blockVisible;
                store2.dispatch('theBlockTree/deleteBlock', [id, isStoredToTreeId, wasCurrentlySelectedBlock]);
            } else {
                const gbtRefBlock = blockTreeUtils.findFirstRefBlockFor(blockVisible.isStoredToTreeId, store2.get().theBlockTree);
                const {id, isStoredToTreeId} = gbtRefBlock;
                store2.dispatch('theBlockTree/deleteBlock', [id, isStoredToTreeId, wasCurrentlySelectedBlock]);
            }
        } else if (link.id === 'save-block-as-reusable') {
            const blockToStore = this.blockWithMoreMenuOpened;
            const userCanCreateGlobalBlockTrees = api.user.can('createGlobalBlockTrees');
            floatingDialog.open(SaveBlockAsReusableDialog, {
                title: __('Save as reusable'),
                height: userCanCreateGlobalBlockTrees ? 426 : 254,
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
        const latestTree = blockTreeUtils.getRootFor(openBlock.isStoredToTreeId, store2.get().theBlockTree);
        const cloned = cloneDeep(blockTreeUtils.findBlock(openBlock.id, latestTree)[0]);
        store2.dispatch('theBlockTree/cloneItem', [{block: cloned, isReusable: null}, createBlockDescriptor(openBlock, cloned.isStoredToTreeId), 'after']);
        api.webPageIframe.scrollTo(cloned);
    }
    /**
     * @param {{name: String;}} data
     * @param {RawBlock} originalBlock The block tree we just turned global
     * @access private
     */
    doConvertBlockToGlobal(data, originalBlock) {
        if (originalBlock.isStoredToTreeId !== 'main') throw new Error('Sanity');
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
        const {id, isStoredToTreeId} = block;

        // Update the title of the existing block
        const changes = {title: data.name};
        const isOnlyStyleClassesChange = false;
        store2.dispatch('theBlockTree/updateDefPropsOf',
            [id, isStoredToTreeId, changes, isOnlyStyleClassesChange]);

        // Push item to reusableBranches
        setTimeout(() => {
            const latestTree = blockTreeUtils.getRootFor(isStoredToTreeId, store2.get().theBlockTree);
            const latest = blockTreeUtils.findBlock(id, latestTree)[0];
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
        this.refElOfOpenMoreMenu = e.target;
        this.refElOfOpenMoreMenu.style.opacity = '1';
        this.moreMenu.current.open(e, links => {
            const notThese = []
                .concat(blockIsGbtsOutermostBlock ? ['duplicate-block'] : [])
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
        signals.emit('on-block-tree-item-clicked-or-focused', block, origin);
        if (origin !== 'web-page') api.webPageIframe.scrollTo(block);
        //
        const mutRef = this.state.treeState;
        const tree = blockTreeUtils.getRootFor(block.isStoredToTreeId, store2.get().theBlockTree);
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
function createTreeState2(tree, full = false, previous = {}, p2 = {}) {
    const out = {};
    if (!full) {
        blockTreeUtils.traverseRecursively(tree, (block, _i, parent) => {
            out[block.id] = createTreeStateItem(parent ? out[parent.id] : null);
        });
    } else {
        blockTreeUtils.traverseRecursively(tree, (block, _i, parent) => {
            out[block.id] = createTreeStateItem(parent ? out[parent.id] : null, p2[block.id] || previous[block.id]);
            if (block.type === 'GlobalBlockReference') {
                blockTreeUtils.traverseRecursively(block.__globalBlockTree.blocks, (block2, _i2, parent2) => {
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
