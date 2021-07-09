import {__} from '../../commons/main.js';
import Icon from '../../commons/Icon.jsx';
import Tabs from '../../commons/Tabs.jsx';
import BlockTypeSelector from './BlockTypeSelector.jsx';
import Block from './Block.js';

class BlockTreeTabs extends preact.Component {
    // pageBlocksTree;
    /**
     * @param {Object} props
     */
    constructor(props) {
        super(props);
        this.state = {currentTab: 0, pageBlocksInput: null, layoutBlocksInput: null};
        this.pageBlocksTree = preact.createRef();
        this.currentWebPage = null;
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
                    : <button class="toggle p-absolute"><Icon iconId="chevron-down" className="feather-xs"/></button>
                }
                <button onClick={ () => this.handleItemClicked(block) } class="drag-handle columns">
                    <Icon iconId="type" className="feather-xs color-accent mr-1"/>
                    { block.title || block.type }
                </button>
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
        //
    }
    /**
     * @param {string} _blockType
     * @param {Block} newPlaceholderBlockData
     */
    confirmAddBlock(_blockType, newPlaceholderBlockData) {
        //
    }
    /**
     * @param {Block} newPlaceholderBlockData
     */
    cancelAddBlock(newPlaceholderBlockData) {
        //
    }
}

export default BlockTreeTabs;
