import {__, signals} from '@sivujetti-commons';
import ContextMenu from '../../commons/ContextMenu.jsx';
import Icon from '../../commons/Icon.jsx';
import BlockTypeSelector from './BlockTypeSelector.jsx';
import Block from './Block.js';
import blockTreeUtils from './blockTreeUtils.js';
import store, {pushItemToOpQueue} from './store.js';
import BlockTreeDragDrop from './BlockTreeDragDrop.js';

let BlockTreeTabs;

class BlockTree extends preact.Component {
    // selectedRoot;
    // contextMenu;
    // lastRootBlockMarker;
    // dragDrop;
    // onDragStart;
    // onDragOver;
    // onDrop;
    /**
     * @param {{blocksInput: Array<RawBlock>; onChangesApplied?: (blockTree: Array<Block>, treeKind: 'pageBlocks'|'layoutBlocks') => Promise<Boolean>; BlockTrees: preact.ComponentClass;}} props
     */
    constructor(props) {
        super(props);
        this.state = {blockTree: null, treeState: null, blockWithNavOpened: null};
        this.selectedRoot = null;
        this.contextMenu = preact.createRef();
        this.lastRootBlockMarker = null;
        this.dragDrop = new BlockTreeDragDrop(this, (mutatedTree, dragBlock, dropBlock, dropPosition) => {
            this.setState({blockTree: mutatedTree});
            BlockTreeTabs.currentWebPage.reOrderBlocksInDom(dragBlock, dropBlock, dropPosition);
            store.dispatch(pushItemToOpQueue('swapped-blocks-in-tree',
                () => this.props.onChangesApplied(mutatedTree, this.props.treeKind)));
        });
        BlockTreeTabs = props.BlockTrees;
    }
    /**
     * @param {Block} block After
     * @param {Boolean} autoFocus = true
     * @access public
     */
    appendBlockToTreeAfter(block, autoFocus = true) {
        this.doAppendBlockAndUpdateState(block, 'after', autoFocus);
    }
    /**
     * @param {Block} block The parent block
     * @param {Boolean} autoFocus = true
     * @access public
     */
    appendBlockToTreeAsChildOf(block, autoFocus = true) {
        this.doAppendBlockAndUpdateState(block, 'as-child', autoFocus);
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
            const branch = blockTreeUtils.findBlock(context.id, this.state.blockTree)[1];
            toArr = branch;
        } else if (position === 'after' && Array.isArray(context)) {
            toArr = context;
            if (toArr !== this.state.blockTree) throw new Error();
            after = toArr.length ? toArr[toArr.length - 1] : this.lastRootBlockMarker;
        } else if (position === 'as-child' && context instanceof Block) {
            toArr = context.children;
            after = this.getAfter(toArr, context);
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
        //
        this.onDragStart = this.dragDrop.handleDragStarted.bind(this.dragDrop);
        this.onDragOver = this.dragDrop.handleDraggedOver.bind(this.dragDrop);
        this.onDrop = this.dragDrop.handleDraggableDropped.bind(this.dragDrop);
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
    render(_, {blockTree, treeState, blockWithNavOpened}) {
        if (blockTree === null) return;
        const renderBranch = branch => branch.map(block => !treeState[block.id].isNew
            ? <li
                onDragStart={ this.onDragStart }
                onDragOver={ this.onDragOver }
                onDrop={ this.onDrop }
                data-id={ block.path }
                class={ [!treeState[block.id].isSelected ? '' : 'selected',
                         !block.children.length ? '' : 'with-children'].join(' ') }
                data-block-id={ block.id }
                data-drop-group="1"
                key={ block.id }
                draggable>
                { !block.children.length
                    ? null
                    : <button onClick={ () => this.collapseBranch(block) } class="toggle p-absolute" type="button"><Icon iconId="chevron-down" className="size-xs"/></button>
                }
                <div class="d-flex">
                    <button onClick={ () => this.handleItemClicked(block) } class="drag-handle columns" type="button">
                        <Icon iconId="type" className="size-xs color-accent mr-1"/>
                        { block.title || __(block.type) }
                    </button>
                    <button onClick={ e => this.openMoreMenu(block, e) } class={ `more-toggle ml-2${blockWithNavOpened !== block ? '' : ' opened'}` } type="button">
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
                onMenuClosed={ () => this.setState({blockWithNavOpened: null}) }
                ref={ this.contextMenu }/>
        </>;
    }
    /**
     * @param {ContextMenuLink} link
     * @access private
     */
    handleContextMenuLinkClicked(link) {
        if (link.id === 'add-child') {
            this.appendNewBlockPlaceholder(this.state.blockWithNavOpened, 'as-child');
        } else if (link.id === 'delete-block') {
            const isSelectedRootCurrentlyClickedBlock = () => {
                if (!this.selectedRoot)
                    return false;
                return this.selectedRoot === this.state.blockWithNavOpened;
            };
            const isSelectedRootChildOfCurrentlyClickedBlock = () => {
                if (!this.selectedRoot ||
                    !this.selectedRoot.parentBlockId ||
                    !this.state.blockWithNavOpened.children.length)
                    return false;
                return blockTreeUtils.findRecursively(this.state.blockWithNavOpened.children,
                    b => b.id === this.selectedRoot.id);
            };
            //
            let wasCurrentlySelectedBlock = isSelectedRootCurrentlyClickedBlock() ||
                                            isSelectedRootChildOfCurrentlyClickedBlock();
            if (wasCurrentlySelectedBlock) this.selectedRoot = null;
            this.cancelAddBlock(this.state.blockWithNavOpened);
            store.dispatch(pushItemToOpQueue('delete-block-from-tree',
                () => this.props.onChangesApplied(this.state.blockTree, this.props.treeKind)));
            signals.emit('on-block-deleted', this.state.blockWithNavOpened, wasCurrentlySelectedBlock);
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
     * @param {Block} block
     * @access private
     */
    getAfter(targetBranch, block) {
        return targetBranch.length
            // Use block as `after`
            ? targetBranch[targetBranch.length - 1]
            // Use comment|pseudoComment as `after`
            : targetBranch !== this.state.blockTree
                ? {parentNode: block.getRootDomNode(), nextSibling: null}
                : this.lastRootBlockMarker;
    }
    /**
     * @param {Block} block
     * @param {Event} e
     * @access private
     */
    openMoreMenu(block, e) {
        this.setState({blockWithNavOpened: block});
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
        this.setState({treeState: mutRef, blockWithNavOpened: null});
    }
    /**
     * @param {'clicked'|'focus-requested'} name
     * @param {Block} block
     * @access private
     */
    emitItemClickedOrAppendedSignal(name, block) {
        signals.emit(`on-block-tree-item-${name}`, block, this);
    }
    /**
     * @param {Block} block The parent block
     * @param {'after'|'as-child'} position
     * @param {Boolean} autoFocus
     * @access private
     */
    doAppendBlockAndUpdateState(block, position, autoFocus) {
        this.appendNewBlockPlaceholder(block, position,
            (state, newBlock) => {
                state.treeState = this.setBlockAsSected(newBlock, state.treeState);
                state.treeState[newBlock.id].isNew = false;
                return state;
            }).then(newBlock => {
                if (autoFocus)
                    this.emitItemClickedOrAppendedSignal('focus-requested', newBlock);
            });
    }
}

function createTreeItemState(overrides = {}) {
    return Object.assign({isSelected: false, isNew: false}, overrides);
}

export default BlockTree;
