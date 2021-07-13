import {__, http} from '../../commons/main.js';
import {generatePushID} from '../../commons/utils.js';
import Icon from '../../commons/Icon.jsx';
import Tabs from '../../commons/Tabs.jsx';
import toasters from '../../commons/Toaster.jsx';
import BlockTypeSelector, {blockTypes} from './BlockTypeSelector.jsx';
import Block from './Block.js';

class BlockTreeTabs extends preact.Component {
    // pageBlocksTree;
    // static currentWebPage;
    // static currentWebPageComments;
    /**
     * @param {Object} props
     */
    constructor(props) {
        super(props);
        this.state = {currentTab: 0, pageBlocksInput: null, layoutBlocksInput: null};
        this.pageBlocksTree = preact.createRef();
    }
    /**
     * @param {Array<Block>} pageBlocks
     * @param {Array<Block>} layoutBlocks
     * @param {Array<BlockRefComment>} comments
     * @param {EditAppAwareWebPage} currentWebPage
     * @access public
     */
    setBlocks(pageBlocks, layoutBlocks, comments, currentWebPage) {
        BlockTreeTabs.currentWebPage = currentWebPage;
        BlockTreeTabs.currentPageComments = comments;
        this.setState({pageBlocksInput: pageBlocks,
                       layoutBlocksInput: layoutBlocks});
    }
    /**
     * @access protected
     */
    render(_, {currentTab, pageBlocksInput, layoutBlocksInput}) {
        if (pageBlocksInput === null)
            return;
        return <div class="mx-2">
            <Tabs className="tab-block" links={ [__('Page'), __('Layout')] }
                onTabChanged={ toIdx => this.setState({currentTab: toIdx}) }/>
            { currentTab === 0
                ? [
                    <button class="btn with-icon my-2" onClick={ () => this.pageBlocksTree.current.appendNewBlockPlaceholder() } title={ __('Add new block') }>
                        <Icon iconId="plus" className="feather-sm"/> { __('Add new block') }
                    </button>,
                    <BlockTree key="pageBlocks" blocksInput={ pageBlocksInput } ref={ this.pageBlocksTree }/>
                ]
                : <BlockTree key="layoutBlocks" blocksInput={ layoutBlocksInput }/> }
        </div>;
    }
}

class BlockTree extends preact.Component {
    // selectedRoot;
    /**
     * @param {Object} props
     */
    constructor(props) {
        super(props);
        this.state = {blockTree: null, treeState: null};
        this.selectedRoot = null;
    }
    /**
     * @access public
     */
    appendNewBlockPlaceholder() {
        const paragraphType = blockTypes.get('Paragraph');
        const newBlock = Block.fromType(paragraphType, generatePushID());
        const toBranch = this.selectedRoot ? this.selectedRoot.children : this.state.blockTree;
        //
        newBlock._cref = BlockTreeTabs.currentWebPage.appendBlockToDom(newBlock, toBranch);
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
     * @access protected
     */
    componentWillMount() {
        const comments = BlockTreeTabs.currentPageComments;
        const buildTreeState = (branch, out) => {
            for (let i = 0; i < branch.length; ++i) {
                const block = Block.fromObject(branch[i]);
                block._cref = comments.find(({blockId}) => blockId === block.id);
                out[block.id] = {isSelected: false, isNew: false};
                branch[i] = block;
                if (block.children.length) buildTreeState(block.children, out);
            }
        };
        const treeState = {};
        buildTreeState(this.props.blocksInput, treeState); // Note: mutates props.blocksInput
        this.setState({blockTree: this.props.blocksInput, treeState});
    }
    /**
     * @access protected
     */
    render(_, {blockTree, treeState}) {
        if (blockTree === null) return;
        const renderBranch = branch => branch.map(block => !treeState[block.id].isNew
            ? <li key={ block.id } data-id={ block.path } class={ [!treeState[block.id].isSelected ? '' : 'selected',
                                                                   !block.children.length ? '' : 'with-children'].join(' ') }>
                { !block.children.length
                    ? null
                    : <button onClick={ () => this.collapseBranch(block) } class="toggle p-absolute"><Icon iconId="chevron-down" className="feather-xs"/></button>
                }
                <div class="d-flex">
                    <button onClick={ () => this.handleItemClicked(block) } class="drag-handle columns">
                        <Icon iconId="type" className="feather-xs color-accent mr-1"/>
                        { block.title || block.type }
                    </button>
                    <button onClick={ () => this.openMoreMenu() } class="more-toggle ml-2">
                        <Icon iconId="more-horizontal" className="feather-xs"/>
                    </button>
                </div>
                { block.children.length
                    ? <ul data-sort-group-id={ `s-${block.path}` }>{ renderBranch(block.children) }</ul>
                    : null
                }
            </li>
            : <li key={ block.id }>
                <BlockTypeSelector block={ block } onSelectionConfirmed={ this.confirmAddBlock.bind(this) } onSelectionDiscarded={ this.cancelAddBlock.bind(this) }/>
            </li>
        );
        return <ul class="block-tree" data-sort-group-id="r">{ renderBranch(blockTree) }</ul>;
    }
    /**
     * @param {Block} block
     * @access private
     */
    handleItemClicked(block) {
        this.selectedRoot = block;
        const ref = this.state.treeState;
        if (ref[block.id].isSelected) return;
        //
        for (const key in ref) ref[key].isSelected = false;
        ref[block.id].isSelected = true;
        this.setState({treeState: ref});
    }
    /**
     * @param {string} _blockType
     * @param {Block} newPlaceholderBlockData
     */
    confirmAddBlock(_blockType, newPlaceholderBlockData) {
        const treeState = this.state.treeState;
        const [block, containingBranch, parentBlock] = this.findBlock(newPlaceholderBlockData.id);
        treeState[newPlaceholderBlockData.id].isNew = false; // mutates this.state.treeState
        Object.assign(block, newPlaceholderBlockData); // mutates this.state.blockTree
        this.setState({treeState: treeState, blockTree: this.state.blockTree});
        //
        const postData = Object.assign({parentBlockId: parentBlock ? parentBlock.id : ''}, block);
        delete postData.children;
        delete postData._cref;
        //
        http.post(`/api/blocks/to-page/${BlockTreeTabs.currentWebPage.data.page.id}`, postData)
            .then(resp => {
                if (resp.ok !== 'ok') throw new Error('-');
            })
            .catch(err => {
                BlockTreeTabs.currentWebPage.deleteBlockFromDom(block);
                this.deleteBlock(block, containingBranch);
                window.console.error(err);
                toasters.editAppMain(__('Something unexpected happened.'));
            });
    }
    /**
     * @param {Block} newPlaceholderBlockData
     */
    cancelAddBlock(newPlaceholderBlockData) {
        const [block, containingBranch] = this.findBlock(newPlaceholderBlockData.id);
        BlockTreeTabs.currentWebPage.deleteBlockFromDom(block);
        this.deleteBlock(block, containingBranch);
    }
    /**
     * @param {string} id
     * @param {Array<Block>=} branch = this.state.blockTree
     * @param {Block=} parentBlock = null
     * @returns {Block|null}
     * @access private
     */
    findBlock(id, branch = this.state.blockTree, parentBlock = null) {
        for (const b of branch) {
            if (b.id === id) return [b, branch, parentBlock];
            if (b.children.length) {
                const c = this.findBlock(id, b.children, b);
                if (c[0]) return c;
            }
        }
        return [null, null, null];
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
     * @access private
     */
    openMoreMenu() {
        //
    }
    /**
     * @param {Block} block
     * @access private
     */
    collapseBranch(block) {
        block;
    }
}

export default BlockTreeTabs;
