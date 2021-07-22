import {__, http, signals} from '../../commons/main.js';
import ContextMenu from '../../commons/ContextMenu.jsx';
import Icon from '../../commons/Icon.jsx';
import Tabs from '../../commons/Tabs.jsx';
import toasters from '../../commons/Toaster.jsx';
import BlockTypeSelector, {blockTypes} from './BlockTypeSelector.jsx';
import Block from './Block.js';
import store, {observeStore, selectCurrentPage, pushItemToOpQueue} from './store.js';

class BlockTreeTabs extends preact.Component {
    // pageBlocksTree;
    // cleanStoreSubs;
    // static currentWebPage;
    // static currentWebPageComments;
    /**
     * @param {{containingView: String;}} props
     */
    constructor(props) {
        super(props);
        this.state = {currentTab: 0, pageBlocksInput: null, layoutBlocksInput: null};
        this.pageBlocksTree = preact.createRef();
        this.cleanStoreSubs = observeStore(s => selectCurrentPage(s), value => {
            if (// `this` is still attached to <DefaultMainPanelView/>, but placeholder page is loaded
                (this.props.containingView === 'DefaultMainPanelView' && value.dataFromWebPage.page.isPlaceholderPage) ||
                // `this` is still attached to <AddPageMainPanelViwe/>, but reqular page is loaded
                (this.props.containingView === 'AddPageMainPanelView' && !value.dataFromWebPage.page.isPlaceholderPage))
                return;
            this.handleWebPageDataReceived(value);
        });
    }
    /**
     * @param {String} id
     * @param {Array<Block>} branch
     * @param {Block=} parentBlock = null
     * @returns {Block|null}
     * @access private
     */
    static findBlock(id, branch, parentBlock = null) {
        for (const b of branch) {
            if (b.id === id) return [b, branch, parentBlock];
            if (b.children.length) {
                const c = BlockTreeTabs.findBlock(id, b.children, b);
                if (c[0]) return c;
            }
        }
        return [null, null, null];
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
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.cleanStoreSubs();
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
    }
    /**
     * @access protected
     */
    render({hideTabs, containingView}, {currentTab, pageBlocksInput, layoutBlocksInput}) {
        if (pageBlocksInput === null)
            return;
        return <div>
            { !hideTabs ? <Tabs className="tab-block" links={ [__('Page'), __('Layout')] }
                onTabChanged={ toIdx => this.setState({currentTab: toIdx}) }/> : null }
            { currentTab === 0
                ? [
                    <BlockTree key="pageBlocks" blocksInput={ pageBlocksInput } onChangesApplied={ containingView === 'DefaultMainPanelView' ? BlockTreeTabs.saveExistingPageBlocksToBackend : function () {} } ref={ this.pageBlocksTree }/>,
                    <button onClick={ () => this.pageBlocksTree.current.appendNewBlockPlaceholder() } class="btn btn-sm with-icon" title={ __('Add new block') } type="button">
                        <Icon iconId="plus" className="size-sm"/> { __('Add new block') }
                    </button>
                ]
                : <BlockTree key="layoutBlocks" blocksInput={ layoutBlocksInput } onChangesApplied={ () => null }/> }
        </div>;
    }
    /**
     * @param {Array<Block>} newBlockTree
     * @returns {Promise<Boolean>}
     * @access private
     */
    static saveExistingPageBlocksToBackend(newBlockTree) {
        return http.put(`/api/pages/Pages/${BlockTreeTabs.currentWebPage.data.page.id}/blocks`,
            {blocks: BlockTree.mapRecursively(newBlockTree, blockToRaw)})
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
     * @param {{blocksInput: Array<RawBlock>; onChangesApplied?: (blockTree: Array<Block>) => Promise<Boolean>;}} props
     */
    constructor(props) {
        super(props);
        this.state = {blockTree: null, treeState: null, currentlyOpenBlock: null};
        this.selectedRoot = null;
        this.contextMenu = preact.createRef();
        this.lastRootBlockMarker = null;
    }
    /**
     * @param {Block} toParent = null
     * @access public
     */
    appendNewBlockPlaceholder(toParent = null) {
        const paragraphType = blockTypes.get('Paragraph');
        const newBlock = Block.fromType(paragraphType);
        let toBranch;
        if (!toParent) {
            toBranch = this.selectedRoot ? this.selectedRoot.children : this.state.blockTree;
            //
            newBlock._cref = BlockTreeTabs.currentWebPage.appendBlockToDom(newBlock,
                this.state.blockTree.length ? (this.selectedRoot || toBranch[toBranch.length - 1]) : this.lastRootBlockMarker);
        } else {
            newBlock._cref = BlockTreeTabs.currentWebPage.appendBlockToDom(newBlock, toParent);
            toBranch = toParent.children;
        }
        // Note: mutates this.state.blockTree
        toBranch.push(newBlock);
        //
        this.setState({
            blockTree: this.state.blockTree,
            treeState: Object.assign(this.state.treeState,
                {[newBlock.id]: {isSelected: false, isNew: true}})
        });
    }
    /**
     * @param {Array<Object>} branch
     * @param {(item: Object, i: Number) => any} fn
     * @returns {Array<Object>}
     * @access public
     */
    static mapRecursively(branch, fn) {
        return branch.map((b, i) => {
            const out = fn(b, i);
            if (b.children.length) {
                out.children = BlockTree.mapRecursively(b.children, fn);
            }
            return out;
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
        const blockTree = BlockTree.mapRecursively(props.blocksInput, blockRaw => {
            const block = Block.fromObject(blockRaw);
            block._cref = comments.find(({blockId}) => blockId === block.id);
            treeState[block.id] = {isSelected: false, isNew: false};
            return block;
        });
        const com = BlockTreeTabs.currentWebPage.findEndingComment(blockTree[blockTree.length - 1]);
        this.lastRootBlockMarker = com.nextSibling
            ? {nextSibling: com.nextSibling, parentNode: com.parentNode}
            : {nextSibling: null, parentNode: com.parentNode};
        this.setState({blockTree, treeState});
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
            this.appendNewBlockPlaceholder(this.state.currentlyOpenBlock);
        } else if (link.id === 'delete-block') {
            this.cancelAddBlock(this.state.currentlyOpenBlock);
            store.dispatch(pushItemToOpQueue('delete-block-from-tree',
                () => this.props.onChangesApplied(this.state.blockTree)));
        }
    }
    /**
     * @param {String} _blockType
     * @param {Object} newPlaceholderBlockData
     * @access private
     */
    replacePlaceholderBlock(_blockType, newPlaceholderBlockData) {
        const block = BlockTreeTabs.findBlock(newPlaceholderBlockData.id, this.state.blockTree)[0];
        const newBlock = Block.fromObject(newPlaceholderBlockData);
        newBlock._cref = BlockTreeTabs.currentWebPage.replaceBlockFromDomWith(block, newBlock);
        //
        Object.assign(block, newBlock); // mutates this.state.blockTree
        this.setState({blockTree: this.state.blockTree});
    }
    /**
     * @param {Block} block
     * @access private
     */
    handleItemClicked(block) {
        this.selectedRoot = block;
        const ref = this.state.treeState;
        signals.emit('on-block-tree-item-clicked', block, this.state.blockTree);
        if (ref[block.id].isSelected) return;
        //
        for (const key in ref) ref[key].isSelected = false;
        ref[block.id].isSelected = true;
        this.setState({treeState: ref});
    }
    /**
     * @param {String} _blockType
     * @param {Object} newPlaceholderBlockData
     * @access private
     */
    confirmAddBlock(_blockType, newPlaceholderBlockData) {
        const treeState = this.state.treeState;
        const block = BlockTreeTabs.findBlock(newPlaceholderBlockData.id, this.state.blockTree)[0];
        treeState[newPlaceholderBlockData.id].isNew = false; // mutates this.state.treeState
        Object.assign(block, newPlaceholderBlockData); // mutates this.state.blockTree
        this.setState({treeState: treeState, blockTree: this.state.blockTree});
        //
        store.dispatch(pushItemToOpQueue('append-block-to-tree',
            () => this.props.onChangesApplied(this.state.blockTree)));
    }
    /**
     * @param {Block} newPlaceholderBlockData
     * @access private
     */
    cancelAddBlock(newPlaceholderBlockData) {
        const [block, containingBranch] = BlockTreeTabs.findBlock(newPlaceholderBlockData.id, this.state.blockTree);
        BlockTreeTabs.currentWebPage.deleteBlockFromDom(block);
        this.deleteBlock(block, containingBranch);
    }
    /**
     * @param {Block} block
     * @param {Array<Block>} containingBranch
     * @access private
     */
    deleteBlock(block, containingBranch) {
        containingBranch.splice(containingBranch.indexOf(block), 1); // Note: mutates this.state.blockTree
        const ref = this.state.treeState;
        delete ref[block.id]; // Mutates this.state.treeState
        this.setState({blockTree: this.state.blockTree,
                       treeState: ref});
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
}

function blockToRaw(block) {
    const postData = Object.assign({}, block);
    delete postData.children;
    delete postData._cref;
    return block;
}

export default BlockTreeTabs;
