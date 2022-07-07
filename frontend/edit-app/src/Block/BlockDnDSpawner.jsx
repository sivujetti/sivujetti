import {__, api, env, http, signals, Icon} from '@sivujetti-commons-for-edit-app';
import {renderBlockAndThen} from '../../../webpage/src/EditAppAwareWebPage.js';
import {getIcon} from '../block-types/block-types.js';
import store, {createSelectBlockTree, createSetBlockTree, pushItemToOpQueue} from '../store.js';
import {createBlockFromType} from './utils.js';
import blockTreeUtils from '../blockTreeUtils.js';

class BlockDnDSpawner extends preact.Component {
    // selectableBlockTypes;
    // newWaitingBlock;
    // blockAddPhase;
    // preRender;
    // started;
    // rootEl;
    // rootElLeft;
    // mainDndEventReceiver;
    // onDragStart;
    // onDragEnd;
    // onMouseMove;
    /**
     * @param {{mainTreeDnd: BlockTreeDragDrop; mainTree: BlockTree; saveExistingBlocksToBackend: (blocks: Array<RawBlock2>, trid: 'String') => Promise<Boolean>; currentPageIsPlaceholder: Boolean;}} props
     */
    constructor(props) {
        super(props);
        this.state = {isOpen: false, dragExitedLeft: false, globalBlockTrees: []};
        this.selectableBlockTypes = Array.from(api.blockTypes.entries()).filter(([name, _]) =>
            name !== 'PageInfo' && name !== 'GlobalBlockReference'
        );
        this.newWaitingBlock = null;
        this.blockAddPhase = null;
        this.preRender = null;
        this.started = false;
        this.rootEl = preact.createRef();
        this.rootElLeft = null;
        this.mainDndEventReceiver = null;
        this.onDragStart = this.handleDragStarted.bind(this);
        this.onDragEnd = this.handleDragEnded.bind(this);
        this.onMouseMove = e => {
            if (!this.newWaitingBlock) return;
            if (!this.state.dragExitedLeft && e.clientX < this.rootElLeft) {
                this.setState({dragExitedLeft: true});
                this.started = true;
                this.props.mainTreeDnd.setDragEventReceiver(this.mainDndEventReceiver);
            } else if (this.state.dragExitedLeft && e.clientX > this.rootElLeft) {
                this.setState({dragExitedLeft: false});
                this.handleDragReturnedFromMainDndWithoutDrop();
                this.props.mainTreeDnd.setDragEventReceiver(null);
            }
        };
    }
    /**
     * @access protected
     */
    render(_, {isOpen, dragExitedLeft, globalBlockTrees}) {
        return <div
            class={ `new-block-spawner${!isOpen ? '' : ' open box'}${!dragExitedLeft ? '' : ' drag-exited-left'}` }
            onMouseEnter={ () => { if (this.started) this.setState({dragExitedLeft: false}); } }
            onMouseLeave={ () => { if (this.started) this.setState({dragExitedLeft: true}); } }
            ref={ this.rootEl }>
            <button
                onClick={ this.toggleIsOpen.bind(this) }
                class={ `btn btn-sm d-flex with-icon ${!isOpen ? 'btn-primary' : 'mr-1'}` }
                title={ __('Start adding content') }
                type="button">
                <Icon iconId={ !isOpen ? 'plus' : 'x' } className="mr-0 size-xs"/>
            </button>
            { isOpen ? <div class="scroller"><ul class="block-tree">{ globalBlockTrees.map(({id, blocks, name}) =>
                [name, blocks[0].type, id]
            ).concat(this.selectableBlockTypes).map(([name, blockType, trid]) =>
                <li class={ `${!trid ? 'page' : 'globalBlockTree'}-block ml-0` }><div class="d-flex">
                    <button
                        onDragStart={ this.onDragStart }
                        onDragEnd={ this.onDragEnd }
                        class="block-handle columns"
                        data-block-type={ !trid ? name : 'GlobalBlockReference' }
                        data-trid={ trid || 'main' }
                        type="button"
                        draggable>
                        <Icon iconId={ getIcon(blockType) } className="size-xs mr-1"/>
                        { !trid ? __(blockType.friendlyName) : name }
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
            http.get('/api/global-block-trees')
                .then(this.receiveGlobalBlocks.bind(this))
                .catch(env.window.console.error);
            //
            const spawner = this;
            if (!this.mainDndEventReceiver) this.mainDndEventReceiver = {
                draggedOverFirstTime: spawner.handleMainDndStartedDrop.bind(spawner),
                swappedBlocks: spawner.handleMainDndSwappedBlocks.bind(spawner),
                dropped: spawner.handleMainDndGotDrop.bind(spawner),
            };
            this.rootElLeft = this.rootEl.current.getBoundingClientRect().left;
            document.addEventListener('dragover', this.onMouseMove);
        } else {
            document.removeEventListener('dragover', this.onMouseMove);
        }
        this.started = false;
        this.setState({isOpen: !currentlyIsOpen});
    }
    /**
     * @param {DragEvent} e
     * @access private
     */
    handleDragStarted(e) {
        const dragEl = e.target.nodeName === 'BUTTON' ? e.target : e.target.closest('button');
        const newType = dragEl.getAttribute('data-block-type');
        const willBeOverridden = 'main';
        let gbt;
        if (newType !== 'GlobalBlockReference') {
            if (this.newWaitingBlock && this.newWaitingBlock.type === newType) return;
            this.newWaitingBlock = createBlockFromType(newType, willBeOverridden);
        } else {
            gbt = this.state.globalBlockTrees.find(({id}) => id === dragEl.getAttribute('data-trid'));
            if (this.newWaitingBlock && this.newWaitingBlock.globalBlockTreeId === gbt.id) return;
            this.newWaitingBlock = createBlockFromType(newType, willBeOverridden, undefined, {
                globalBlockTreeId: gbt.id,
            });
        }
        this.newWaitingBlock.isStoredTo = 'don\'t-know-yet';
        this.newWaitingBlock.isStoredToTreeId = 'don\'t-know-yet';
        this.blockAddPhase = 'rendering-started';
        this.preRender = null;
        renderBlockAndThen(this.newWaitingBlock, html => {
            if (this.blockAddPhase !== 'rendering-started' ||
                this.newWaitingBlock.type !== newType) return;
            if (this.newWaitingBlock.type === 'GlobalBlockReference')
                signals.emit('on-block-dnd-global-block-reference-block-drag-started', gbt);
            this.blockAddPhase = 'rendering-finished';
            this.preRender = html;
            this.hideLoadingIndicatorIfVisible();
        }, api.blockTypes);
        //
        setTimeout(() => {
            if (this.blockAddPhase === 'rendering-started')
                this.showLoadingIndicator();
        }, 200);
    }
    /**
     * @param {DragEvent?} _e
     * @param {Boolean} dropped = false
     * @access private
     */
    handleDragEnded(_e, dropped = false) {
        if (dropped) {
            this.newWaitingBlock = null;
            this.blockAddPhase = null;
            this.preRender = null;
        }
        this.dragging = false;
        this.hideLoadingIndicatorIfVisible();
    }
    /**
     * @param {RawBlock2} asChildOf
     * @returns {{blockId: String; trid: String;}|null}
     * @access private
     */
    handleMainDndStartedDrop(asChildOf) {
        if (this.blockAddPhase !== 'rendering-finished') return null; // Pre-render of this.newWaitingBlock not rendering-finished yet
        const trid = asChildOf.isStoredToTreeId;
        this.newWaitingBlock.isStoredToTreeId = trid;
        this.newWaitingBlock.isStoredTo = asChildOf.isStoredTo;
        const {tree} = createSelectBlockTree(trid)(store.getState());
        asChildOf.children.push(this.newWaitingBlock); // Mutate tree temporarily
        store.dispatch(createSetBlockTree(trid)(tree, ['add-single-block',
            {blockId: this.newWaitingBlock.id, blockType: this.newWaitingBlock.type, trid}, 'dnd-spawner', null, this.preRender]));
        this.blockAddPhase = 'added';
        return {blockId: this.newWaitingBlock.id, trid: this.newWaitingBlock.isStoredToTreeId};
    }
    /**
     * @param {[SwapChangeEventData, SwapChangeEventData|null]} mutationInfos
     * @access private
     */
    handleMainDndSwappedBlocks([mutation1]) {
        const trid = mutation1.blockToMove.isStoredToTreeId;
        const {tree} = createSelectBlockTree(trid)(store.getState());
        store.dispatch(createSetBlockTree(trid)(tree, ['swap-blocks', mutation1, 'dnd-spawner']));
    }
    /**
     * @access private
     */
    handleMainDndGotDrop() {
        const acceptDrop = this.blockAddPhase === 'added';
        if (acceptDrop) {
        const trid = this.newWaitingBlock.isStoredToTreeId;
        store.dispatch(createSetBlockTree(trid)(createSelectBlockTree(trid)(store.getState()).tree, ['commit-add-single-block',
            {blockId: this.newWaitingBlock.id, blockType: this.newWaitingBlock.type, trid}]));
        const undoInfo = {blockId: this.newWaitingBlock.id, blockType: this.newWaitingBlock.type, trid};
        store.dispatch(pushItemToOpQueue(`update-block-tree#${trid}`, {
            doHandle: trid !== 'main' || !this.props.currentPageIsPlaceholder
                ? () => this.props.saveExistingBlocksToBackend(createSelectBlockTree(trid)(store.getState()).tree, trid)
                : null
            ,
            doUndo: () => {
                const {tree} = createSelectBlockTree(trid)(store.getState());
                deleteBlockFromTree(undoInfo.blockId, tree);
                store.dispatch(createSetBlockTree(trid)(tree, ['undo-add-single-block',
                    undoInfo]));
            },
            args: [],
        }));
        if (this.newWaitingBlock.type === 'GlobalBlockReference')
            signals.emit('on-block-dnd-global-block-reference-block-dropped', this.newWaitingBlock.globalBlockTreeId);
        }
        this.handleDragEnded(null, acceptDrop);
    }
    /**
     * @access private
     */
    handleDragReturnedFromMainDndWithoutDrop() {
        if (this.blockAddPhase === 'added') {
            const trid = this.newWaitingBlock.isStoredToTreeId;
            const {tree} = createSelectBlockTree(trid)(store.getState());
            deleteBlockFromTree(this.newWaitingBlock.id, tree);
            store.dispatch(createSetBlockTree(trid)(tree, ['delete-single-block',
                {blockId: this.newWaitingBlock.id, blockType: this.newWaitingBlock.type, trid},
                'dnd-spawner', trid]));
            this.blockAddPhase = 'rendering-finished';
        }
        this.handleDragEnded();
    }
    /**
     * @param {Array<RawGlobalBlockTree>} globalBlockTrees
     * @access private
     */
    receiveGlobalBlocks(globalBlockTrees) {
        globalBlockTrees.forEach(gbt => {
            blockTreeUtils.traverseRecursively(gbt.blocks, b => {
                b.isStoredTo = 'globalBlockTree';
                b.isStoredToTreeId = gbt.id;
            });
        });
        this.setState({globalBlockTrees});
    }
    /**
     * @access private
     */
    showLoadingIndicator() {
        this.props.mainTree.setState({loading: true});
    }
    /**
     * @access private
     */
    hideLoadingIndicatorIfVisible() {
        if (this.props.mainTree.state.loading)
            this.props.mainTree.setState({loading: false});
    }
}

/**
 * Note: mutates $tree
 *
 * @param {String} blockId
 * @param {Array<RawBlock2>} tree
 */
function deleteBlockFromTree(blockId, tree) {
    const [b, br] = blockTreeUtils.findBlock(blockId, tree);
    br.splice(br.indexOf(b), 1); // Mutate tree temporarily
}

export default BlockDnDSpawner;
