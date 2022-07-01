import {__, Icon, api} from '@sivujetti-commons-for-edit-app';
import {getIcon} from '../block-types/block-types.js';
import store, {createSelectBlockTree, createSetBlockTree} from '../store.js';
import {createBlockFromType} from './utils.js';
import blockTreeUtils from '../blockTreeUtils.js';

class BlockDnDSpawner extends preact.Component {
    // selectableBlockTypes;
    // currentlyDraggingEl;
    // dragExitedLeft;
    // rootEl;
    // rootElLeft;
    // mainDndEventReceiver;
    // onDragStart;
    // onDragEnd;
    // onMouseMove;
    // newBlock;
    /**
     * @param {{mainTreeDnd: BlockTreeDragDrop;}} props
     */
    constructor(props) {
        super(props);
        this.state = {isOpen: false, dragExitedLeft: false};
        this.selectableBlockTypes = Array.from(api.blockTypes.entries()).filter(([name, _]) =>
            name !== 'PageInfo' && name !== 'GlobalBlockReference'
        );
        this.currentlyDraggingEl = null;
        this.rootEl = preact.createRef();
        this.rootElLeft = null;
        this.mainDndEventReceiver = null;
        this.onDragStart = this.handleDragStarted.bind(this);
        this.onDragEnd = this.handleDragEnded.bind(this);
        this.onMouseMove = e => {
            if (!this.currentlyDraggingEl) return;
            if (!this.state.dragExitedLeft && e.clientX < this.rootElLeft) {
                this.setState({dragExitedLeft: true});
                this.props.mainTreeDnd.setDragEventReceiver(this.mainDndEventReceiver);
            } else if (this.state.dragExitedLeft && e.clientX > this.rootElLeft) {
                this.setState({dragExitedLeft: false});
                this.handleDragReturnedFromMainTreeWithoutDrop();
                this.props.mainTreeDnd.setDragEventReceiver(null);
            }
        };
    }
    /**
     * @access protected
     */
    render(_, {isOpen, dragExitedLeft}) {
        return <div
            class={ `new-block-spawner${!isOpen ? '' : ' open box'}${!dragExitedLeft ? '' : ' drag-exited-left'}` }
            ref={ this.rootEl }>
            <button
                onClick={ this.toggleIsOpen.bind(this) }
                class={ `btn btn-sm d-flex with-icon ${!isOpen ? 'btn-primary' : 'mr-1'}` }
                title={ __('Start adding content') }
                type="button">
                <Icon iconId={ !isOpen ? 'plus' : 'x' } className="mr-0 size-xs"/>
            </button>
            { isOpen ? <div class="scroller"><ul class="block-tree">{ this.selectableBlockTypes.map(([name, blockType]) =>
                <li class="page-block ml-0"><div class="d-flex">
                    <button
                        onDragStart={ this.onDragStart }
                        onDragEnd={ this.onDragEnd }
                        class="block-handle columns"
                        data-block-type={ name }
                        type="button"
                        draggable>
                        <Icon iconId={ getIcon(blockType) } className="size-xs mr-1"/>
                        { __(blockType.friendlyName) }
                    </button>
                </div></li>
            ) }
            </ul></div> : null }
        </div>;
    }
    /**
     * @access private
     */
    toggleIsOpen() {
        const currentlyIsOpen = this.state.isOpen;
        if (!currentlyIsOpen) {
            const spawner = this;
            if (!this.mainDndEventReceiver) this.mainDndEventReceiver = {
                draggedOverFirstTime(block) {
                    return spawner.emitAddNewBlock(spawner.currentlyDraggingEl.getAttribute('data-block-type'), block);
                },
                swappedBlocks(mutationInfos) {
                    spawner.emitNewReOrderedTree(mutationInfos);
                },
                dropped() {
                    //
                },
            };
            this.rootElLeft = this.rootEl.current.getBoundingClientRect().left;
            document.addEventListener('dragover', this.onMouseMove);
        } else {
            document.removeEventListener('dragover', this.onMouseMove);
        }
        this.setState({isOpen: !currentlyIsOpen});
    }
    /**
     * @access private
     */
    handleDragReturnedFromMainTreeWithoutDrop() {
        this.emitRemoveNewBlock();
    }
    /**
     * @param {DragEvent} e
     * @access private
     */
    handleDragStarted(e) {
        if (this.currentlyDraggingEl) return;
        this.currentlyDraggingEl = e.target.nodeName === 'BUTTON' ? e.target : e.target.closest('button');
    }
    /**
     * @param {DragEvent} _e
     * @access private
     */
    handleDragEnded(_e) {
        this.currentlyDraggingEl = null;
    }
    /**
     * @param {String} blockTypeName
     * @param {RawBlock2} asChildOf
     * @returns {{blockId: String; trid: String;}}
     * @access private
     */
    emitAddNewBlock(blockTypeName, asChildOf) {
        const trid = 'main';
        this.newBlock = createBlockFromType(blockTypeName, trid);
        const {tree} = createSelectBlockTree(trid)(store.getState());
        asChildOf.children.push(this.newBlock); // Mutate tree temporarily
        store.dispatch(createSetBlockTree(trid)(tree, ['add-single-block',
            {blockId: this.newBlock.id, blockType: this.newBlock.type, trid}, 'dnd-spawner']));
        return {blockId: this.newBlock.id, trid: this.newBlock.isStoredToTreeId};
    }
    /**
     * @param {[SwapChangeEventData, SwapChangeEventData|null]} mutationInfos
     * @access private
     */
    emitNewReOrderedTree([mutation1]) {
        store.dispatch(createSetBlockTree(mutation1.trid)(mutation1.tree, ['swap-blocks', mutation1, 'dnd-spawner']));
    }
    /**
     * @access private
     */
    emitRemoveNewBlock() {
        const trid = 'main';
        const {tree} = createSelectBlockTree(trid)(store.getState());
        const [b, br] = blockTreeUtils.findBlock(this.newBlock.id, tree);
        br.splice(br.indexOf(b), 1); // Mutate tree temporarily
        store.dispatch(createSetBlockTree(trid)(tree, ['delete-single-block',
            {blockId: this.newBlock.id, blockType: this.newBlock.type, trid}, 'dnd-spawner',
            this.newBlock.isStoredToTreeId]));
    }
}

export default BlockDnDSpawner;
