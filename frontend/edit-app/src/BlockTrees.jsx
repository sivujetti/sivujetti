import {__, http, signals} from '@sivujetti-commons';
import ContextMenu from '../../commons/ContextMenu.jsx';
import Icon from '../../commons/Icon.jsx';
import Tabs from '../../commons/Tabs.jsx';
import toasters from '../../commons/Toaster.jsx';
import BlockTypeSelector from './BlockTypeSelector.jsx';
import Block from './Block.js';
import blockTreeUtils from './blockTreeUtils.js';
import store, {observeStore, selectCurrentPage, pushItemToOpQueue} from './store.js';

class BlockTreeTabs extends preact.Component {
    // pageBlocksTree;
    // layoutBlocksTree;
    // tabs;
    // doCleanStoreSubs;
    // doCleanSignalListeners;
    // static currentWebPage;
    // static currentWebPageComments;
    /**
     * @param {{containingView: String; onWebPageLoadHandled?: () => void;}} props
     */
    constructor(props) {
        super(props);
        this.state = {currentTabIdx: 0, pageBlocksInput: null, layoutBlocksInput: null};
        this.pageBlocksTree = preact.createRef();
        this.layoutBlocksTree = preact.createRef();
        this.tabs = preact.createRef();
        this.doCleanStoreSubs = observeStore(s => selectCurrentPage(s), value => {
            if (// `this` is still attached to <DefaultMainPanelView/>, but placeholder page is loaded
                (this.props.containingView === 'DefaultMainPanelView' && value.dataFromWebPage.page.isPlaceholderPage) ||
                // `this` is still attached to <AddPageMainPanelViwe/>, but reqular page is loaded
                (this.props.containingView === 'AddPageMainPanelView' && !value.dataFromWebPage.page.isPlaceholderPage))
                return;
            this.handleWebPageDataReceived(value);
        });
    }
    /**
     * @returns {Array<Block>}
     * @access public
     */
    getPageBlocksTree() {
        return this.pageBlocksTree.current.getTree();
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const value = selectCurrentPage(store.getState());
        if (value.dataFromWebPage) {
            this.handleWebPageDataReceived(value);
        }
        //
        const treeCmps = [this.pageBlocksTree, this.layoutBlocksTree];
        const setBlockAsSelected = (blockRef, selectedTabIdx = this.state.currentTabIdx, nthAttemp = 0) => {
            const selectedTreeCmp = treeCmps[selectedTabIdx].current;
            const b = blockTreeUtils.findRecursively(selectedTreeCmp.getTree(), b => b._cref === blockRef);
            if (b) {
                selectedTreeCmp.handleItemClicked(b);
            } else { // Select the another tree & recurse
                if (nthAttemp > 0) return;
                const nextTabIdx = this.state.currentTabIdx === 0 ? 1 : 0;
                this.tabs.current.changeTab(nextTabIdx);
                setTimeout(() => {
                    setBlockAsSelected(blockRef, nextTabIdx, 1);
                }, 0);
            }
        };
        this.doCleanSignalListeners = signals.on('on-web-page-block-clicked', setBlockAsSelected);
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.doCleanStoreSubs();
        this.doCleanSignalListeners();
    }
    /**
     * @param {{dataFromWebPage: CurrentPageData; comments: Array<BlockRefComment>; webPage: EditAppAwareWebPage;}} d
     * @access private
     */
    handleWebPageDataReceived(d) {
        BlockTreeTabs.currentWebPage = d.webPage;
        BlockTreeTabs.currentWebPageComments = d.comments;
        this.setState({pageBlocksInput: d.dataFromWebPage.page.blocks,
                       layoutBlocksInput: d.dataFromWebPage.layoutBlocks});
        this.props.onWebPageLoadHandled && this.props.onWebPageLoadHandled();
    }
    /**
     * @access protected
     */
    render({hideTabs, containingView}, {currentTabIdx, pageBlocksInput, layoutBlocksInput}) {
        if (pageBlocksInput === null)
            return;
        return <div>
            { !hideTabs ? <Tabs className="tab-block" links={ [__('Page'), __('Layout')] }
                onTabChanged={ toIdx => this.setState({currentTabIdx: toIdx}) } ref={ this.tabs }/> : null }
            { currentTabIdx === 0
                ? [
                    <BlockTree
                        treeKind="pageBlocks"
                        blocksInput={ pageBlocksInput }
                        onChangesApplied={ containingView === 'DefaultMainPanelView'
                            ? BlockTreeTabs.saveExistingPageBlocksToBackend
                            : function () {} }
                        ref={ this.pageBlocksTree }/>,
                    <button
                        onClick={ () => this.pageBlocksTree.current.appendNewBlockPlaceholder() }
                        class="btn btn-sm with-icon"
                        title={ __('Add new block') } type="button">
                        <Icon iconId="plus" className="size-sm"/> { __('Add new block') }
                    </button>
                ]
                : <BlockTree
                    treeKind="layoutBlocks"
                    blocksInput={ layoutBlocksInput }
                    onChangesApplied={ () => null }
                    ref={ this.layoutBlocksTree }/>
            }
        </div>;
    }
    /**
     * @param {Array<Block>} newBlockTree
     * @param {'pageBlocks'|'layoutBlocks'} blockTreeKind
     * @returns {Promise<Boolean>}
     * @access private
     */
    static saveExistingPageBlocksToBackend(newBlockTree, blockTreeKind) {
        const url = blockTreeKind === 'pageBlocks'
            ? `/api/pages/Pages/${BlockTreeTabs.currentWebPage.data.page.id}/blocks`
            : `/api/layouts/${BlockTreeTabs.currentWebPage.data.page.layoutId}/blocks`;
        return http.put(url,
            {blocks: blockTreeUtils.mapRecursively(newBlockTree, block => block.toRaw())})
            .then(resp => {
                if (resp.ok !== 'ok') throw new Error('-');
                return true;
            })
            .catch(err => {
                window.console.error(err);
                toasters.editAppMain(__('Something unexpected happened.'));
                return false;
            });
    }
}

class BlockTree extends preact.Component {
    // selectedRoot;
    // contextMenu;
    // lastRootBlockMarker;
    /**
     * @param {{blocksInput: Array<RawBlock>; onChangesApplied?: (blockTree: Array<Block>, treeKind: 'pageBlocks'|'layoutBlocks') => Promise<Boolean>;}} props
     */
    constructor(props) {
        super(props);
        this.state = {blockTree: null, treeState: null, currentlyOpenBlock: null};
        this.selectedRoot = null;
        this.contextMenu = preact.createRef();
        this.lastRootBlockMarker = null;
    }
    /**
     * @param {Block} block After
     * @param {Boolean} autoFocus = true
     * @access public
     */
    appendBlockToTreeAfter(block, autoFocus = true) {
        this.appendNewBlockPlaceholder(block, 'after',
            (state, newBlock) => {
                state.treeState = this.setBlockAsSected(newBlock, state.treeState);
                state.treeState[newBlock.id].isNew = false;
                return state;
            }).then(newBlock => {
                if (autoFocus)
                    this.emitItemClickedOrAppendedSignal('focus-requested', newBlock);
            });
    }
    /**
     * @param {Block} block After
     * @access public
     */
    appendBlockToTreeAsChildOf(block) {
        throw new Error('Not implemented yet.');
    }
    /**
     * @param {Block|Array<Block>|undefined} context = this.selectedRoot || this.state.blockTree
     * @param {'after'|'as-child'} position = 'after'
     * @returns {Promise<Block>}
     * @access public
     */
    appendNewBlockPlaceholder(context = this.selectedRoot || this.state.blockTree,
                              position = 'after',
                              alterState = null) {
        let toArr;
        let after = context;
        //
        if (position === 'after' && context instanceof Block) {
            const parent = blockTreeUtils.findBlock(context.id, this.state.blockTree)[2];
            toArr = parent.children;
        } else if (position === 'after' && Array.isArray(context)) {
            toArr = context;
            if (toArr !== this.state.blockTree) throw new Error();
            after = toArr.length ? toArr[toArr.length - 1] : this.lastRootBlockMarker;
        } else if (position === 'as-child' && context instanceof Block) {
            toArr = context.children;
        } else if (position === 'as-child' && Array.isArray(context)) {
            throw new Error('Invalid usage (arr, "as-child"), should be (arr[position], "as-child")');
        }
        //
        const newBlock = Block.fromType('Paragraph');
        return BlockTreeTabs.currentWebPage.appendBlockToDom(newBlock, after).then(_cref => {
            newBlock._cref = _cref;
            toArr.splice(toArr.indexOf(after) + 1, 0, newBlock); // Note: mutates this.state.blockTree
            //
            this.setState((alterState || function (s, _) { return s; })({
                blockTree: this.state.blockTree,
                treeState: Object.assign(this.state.treeState,
                    {[newBlock.id]: createTreeItemState({isNew: true})})
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
     * @access protected
     */
    componentWillMount(props = this.props) {
        const comments = BlockTreeTabs.currentWebPageComments;
        const treeState = {};
        const blockTree = blockTreeUtils.mapRecursively(props.blocksInput, blockRaw => {
            const block = Block.fromObject(blockRaw);
            block._cref = comments.find(({blockId}) => blockId === block.id);
            treeState[block.id] = createTreeItemState();
            return block;
        });
        const com = BlockTreeTabs.currentWebPage.findEndingComment(blockTree[blockTree.length - 1]);
        this.lastRootBlockMarker = com.nextSibling
            ? {nextSibling: com.nextSibling, parentNode: com.parentNode}
            : {nextSibling: null, parentNode: com.parentNode};
        this.setState({blockTree, treeState});
        //
        signals.on('on-inspector-panel-closed', () => {
            this.deSelectAllBlocks();
        });
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
    render(_, {blockTree, treeState, currentlyOpenBlock}) {
        if (blockTree === null) return;
        const renderBranch = branch => branch.map(block => !treeState[block.id].isNew
            ? <li key={ block.id } data-id={ block.path } class={ [!treeState[block.id].isSelected ? '' : 'selected',
                                                                   !block.children.length ? '' : 'with-children'].join(' ') }>
                { !block.children.length
                    ? null
                    : <button onClick={ () => this.collapseBranch(block) } class="toggle p-absolute" type="button"><Icon iconId="chevron-down" className="size-xs"/></button>
                }
                <div class="d-flex">
                    <button onClick={ () => this.handleItemClicked(block) } class="drag-handle columns" type="button">
                        <Icon iconId="type" className="size-xs color-accent mr-1"/>
                        { block.title || block.type }
                    </button>
                    <button onClick={ e => this.openMoreMenu(block, e) } class={ `more-toggle ml-2${currentlyOpenBlock !== block ? '' : ' opened'}` } type="button">
                        <Icon iconId="more-horizontal" className="size-xs"/>
                    </button>
                </div>
                { block.children.length
                    ? <ul data-sort-group-id={ `s-${block.path}` }>{ renderBranch(block.children) }</ul>
                    : null
                }
            </li>
            : <li key={ block.id }>
                <BlockTypeSelector
                    block={ block }
                    onSelectionChanged={ this.replacePlaceholderBlock.bind(this) }
                    onSelectionConfirmed={ this.confirmAddBlock.bind(this) }
                    onSelectionDiscarded={ this.cancelAddBlock.bind(this) }/>
            </li>
        );
        return <>
            <ul class="block-tree" data-sort-group-id="r">{
                blockTree.length
                    ? renderBranch(blockTree)
                    : <li>-</li>
            }</ul>
            <ContextMenu
                links={ [
                    {text: __('Add child'), title: __('Add child block'), id: 'add-child'},
                    {text: __('Delete'), title: __('Delete block'), id: 'delete-block'},
                ] }
                onItemClicked={ this.handleContextMenuLinkClicked.bind(this) }
                onMenuClosed={ () => this.setState({currentlyOpenBlock: null}) }
                ref={ this.contextMenu }/>
        </>;
    }
    /**
     * @param {ContextMenuLink} link
     * @access private
     */
    handleContextMenuLinkClicked(link) {
        if (link.id === 'add-child') {
            this.appendNewBlockPlaceholder(this.state.currentlyOpenBlock, 'as-child');
        } else if (link.id === 'delete-block') {
            this.cancelAddBlock(this.state.currentlyOpenBlock);
            store.dispatch(pushItemToOpQueue('delete-block-from-tree',
                () => this.props.onChangesApplied(this.state.blockTree, this.props.treeKind)));
            signals.emit('on-block-deleted', this.state.currentlyOpenBlock);
        }
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
        const newBlock = Block.fromType(blockBluePrint.blockType, blockBluePrint.data, origBlock.id);
        newBlock._cref = origBlock._cref;
        BlockTreeTabs.currentWebPage.replaceBlockFromDomWith(origBlock, newBlock).then(_cref => {
            newBlock._cref = _cref;
            // Replace children
            if (blockBluePrint.children.length) {
                const flat = [];
                blockTreeUtils.traverseRecursively(blockBluePrint.children, blueprint => {
                    flat.push(blueprint);
                });
                return Promise.all(flat.map(blueprint => {
                    const b = Block.fromType(blueprint.blockType, blueprint.data, undefined);
                    const after = this.getAfter(newBlock.children, newBlock);
                    return BlockTreeTabs.currentWebPage.appendBlockToDom(b, after).then(_cref => {
                        b._cref = _cref;
                        newBlock.children.push(b);
                        treeStateMutRef[b.id] = createTreeItemState();
                    });
                }));
            }
        })
        .then(() => {
            // Commit to state
            const branch = blockTreeUtils.findBlock(origBlock.id, this.state.blockTree)[1];
            branch[branch.indexOf(origBlock)] = newBlock; // mutates this.state.blockTree
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
        this.setState({treeState: treeState});
        //
        store.dispatch(pushItemToOpQueue('append-block-to-tree',
            () => this.props.onChangesApplied(this.state.blockTree, this.props.treeKind)));
    }
    /**
     * @param {Block} placeholderBlock
     * @access private
     */
    cancelAddBlock(placeholderBlock) {
        const [block, containingBranch] = blockTreeUtils.findBlock(placeholderBlock.id,
            this.state.blockTree);
        BlockTreeTabs.currentWebPage.deleteBlockFromDom(block);
        this.deleteBlock(block, containingBranch);
    }
    /**
     * @param {Block} block
     * @access private
     */
    handleItemClicked(block) {
        this.selectedRoot = block;
        const mutRef = this.state.treeState;
        this.emitItemClickedOrAppendedSignal('clicked', block);
        if (mutRef[block.id].isSelected) return;
        //
        this.setState({treeState: this.setBlockAsSected(block, mutRef)});
    }
    /**
     * @param {Block} block
     * @param {Array<Block>} containingBranch
     * @access private
     */
    deleteBlock(block, containingBranch) {
        containingBranch.splice(containingBranch.indexOf(block), 1); // Note: mutates this.state.blockTree
        const mutRef = this.state.treeState;
        for (const c of block.children) delete mutRef[c.id];
        delete mutRef[block.id]; // Mutates this.state.treeState
        this.setState({blockTree: this.state.blockTree,
                       treeState: mutRef});
    }
    /**
     * @param {Array<Block>} targetBranch
     * @param {Block|null} parent
     * @access private
     */
    getAfter(targetBranch, parent) {
        return targetBranch.length
            // Use block as `after`
            ? targetBranch[targetBranch.length - 1]
            // Use comment|pseudoComment as `after`
            : parent
                ? {parentNode: parent.getRootDomNode(), nextSibling: null}
                : this.lastRootBlockMarker;
    }
    /**
     * @param {Block} block
     * @param {Event} e
     * @access private
     */
    openMoreMenu(block, e) {
        this.setState({currentlyOpenBlock: block});
        this.contextMenu.current.open(e);
    }
    /**
     * @param {Block} block
     * @access private
     */
    collapseBranch(block) {
        block;
    }
    /**
     * @param {Block} block
     * @param {Object} treeStateMutRef
     * @return {Object}
     * @access private
     */
    setBlockAsSected(block, treeStateMutRef) {
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
        this.setState({treeState: mutRef, currentlyOpenBlock: null});
    }
    /**
     * @param {'clicked'|'focus-requested'} name
     * @param {Block} block
     * @access private
     */
    emitItemClickedOrAppendedSignal(name, block) {
        signals.emit(`on-block-tree-item-${name}`, block, this);
    }
}

function createTreeItemState(overrides = {}) {
    return Object.assign({isSelected: false, isNew: false}, overrides);
}

export default BlockTreeTabs;