import {__, api, env, http, signals, Icon} from '@sivujetti-commons-for-edit-app';
import {renderBlockAndThen} from '../../../webpage/src/EditAppAwareWebPage.js';
import {getIcon} from '../block-types/block-types.js';
import store, {createSelectBlockTree, createSetBlockTree, pushItemToOpQueue} from '../store.js';
import {createBlockFromType, setTrids, toTransferable} from './utils.js';
import blockTreeUtils from '../blockTreeUtils.js';

const BlockAddPhase = Object.freeze({
    RENDERING_STARTED: 'rendering-started',
    RENDERING_FINISHED: 'rendering-finished',
    WAITING_DOM_INSERTION: 'waiting-dom-insertion',
    DONE: 'done',
});

/** @type {() => void} */
let unregScrollListener;

class BlockDnDSpawner extends preact.Component {
    // selectableBlockTypes;
    // dragData;
    // newBlock;
    // blockAddPhase;
    // preRender;
    // rootEl;
    // rootElRight;
    // mainDndEventReceiver;
    // onDragStart;
    // onDragEnd;
    // onMouseMove;
    /**
     * @param {{mainTreeDnd: BlockTreeDragDrop; mainTree: BlockTree; saveExistingBlocksToBackend: (blocks: Array<RawBlock2>, trid: 'String') => Promise<Boolean>; currentPageIsPlaceholder: Boolean; initiallyIsOpen?: Boolean;}} props
     */
    constructor(props) {
        super(props);
        this.state = {isOpen: false, dragExitedRight: false, globalBlockTrees: [], isMounted: false};
        this.selectableBlockTypes = sort(Array.from(api.blockTypes.entries()).filter(([name, _]) =>
            name !== 'PageInfo' && name !== 'GlobalBlockReference'
        ));
        this.dragData = null;
        this.blockAddPhase = null;
        this.preRender = null;
        this.rootEl = preact.createRef();
        this.rootElRight = null;
        this.mainDndEventReceiver = null;
        this.onDragStart = this.handleDragStarted.bind(this);
        this.onDragEnd = this.handleDragEnded.bind(this);
        this.onMouseMove = e => {
            if (!this.dragData) return;
            if (!this.state.dragExitedRight && e.clientX > this.rootElRight) {
                this.setState({dragExitedRight: true});
                this.props.mainTreeDnd.setDragEventReceiver(this.mainDndEventReceiver);
            } else if (this.state.dragExitedRight && e.clientX < this.rootElRight) {
                this.setState({dragExitedRight: false});
                this.handleDragReturnedFromMainDndWithoutDrop();
                this.props.mainTreeDnd.setDragEventReceiver(null);
            }
        };
    }
    /**
     * @access protected
     */
    componentDidMount() {
        if (unregScrollListener) unregScrollListener();
        const blockTreeEl = this.rootEl.current.nextElementSibling;
        const blockTreeOuterEl = blockTreeEl.parentElement;
        let blockTreeBottom;
        let invalidateBlockTreeBottom = null;
        const blockTreeTop = blockTreeEl.getBoundingClientRect().top;
        this.rootEl.current.style.top = `${blockTreeTop}px`;
        this.rootEl.current.style.height = `calc(100% - ${blockTreeTop}px)`;
        this.setState({isMounted: true});
        const handleScroll = e => {
            const rootEl = this.rootEl.current;
            if (!rootEl) return;
            //
            if (blockTreeBottom === null)
                blockTreeBottom = blockTreeOuterEl.offsetTop + blockTreeOuterEl.getBoundingClientRect().height - 40;
            else {
                clearTimeout(invalidateBlockTreeBottom);
                invalidateBlockTreeBottom = setTimeout(() => { blockTreeBottom = null; }, 2000);
            }
            //
            let a = blockTreeTop - e.target.scrollTop;
            if (e.target.scrollTop > blockTreeBottom) a = a; else if (a < 4) a = 4;
            rootEl.style.top = `${a}px`;
            rootEl.style.height = `calc(100% - ${a}px)`;
        };
        const mainPanelEl = this.rootEl.current.closest('#main-panel');
        mainPanelEl.addEventListener('scroll', handleScroll);
        unregScrollListener = () => {
            mainPanelEl.removeEventListener('scroll', handleScroll);
        };
        if (this.props.initiallyIsOpen)
            this.toggleIsOpen();
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        if (this.state.isOpen)
            this.toggleIsOpen();
    }
    /**
     * @access protected
     */
    render(_, {isMounted, isOpen, dragExitedRight, globalBlockTrees}) {
        return <div
            class={ `new-block-spawner${!dragExitedRight ? '' : ' drag-exited-right'}` }
            ref={ this.rootEl }>
            <button
                onClick={ this.toggleIsOpen.bind(this) }
                class={ `p-0 btn btn-sm d-flex with-icon btn-primary${isMounted ? '' : ' d-none'}` }
                title={ __('Start adding content') }
                type="button"
                style="margin-top: -1px">
                <Icon iconId="chevron-right" className="mr-0 size-xs"/>
            </button>
            { isOpen ? [
                <input class="form-input mb-2" placeholder={ __('Filter') } style="width: calc(100% - .5rem)" disabled/>,
                <div class="scroller"><ul class="block-tree">{ globalBlockTrees.map(({id, blocks, name}) =>
                    [name, blocks[0].type, id]
                ).concat(this.selectableBlockTypes).map(([name, blockType, trid]) => {
                    const label = !trid ? __(blockType.friendlyName) : name;
                    return <li class={ `${!trid ? 'page' : 'globalBlockTree'}-block ml-0` } data-block-type={ name }><div class="d-flex">
                        <button
                            onDragStart={ this.onDragStart }
                            onDragEnd={ this.onDragEnd }
                            class="block-handle text-ellipsis"
                            data-block-type={ !trid ? name : 'GlobalBlockReference' }
                            data-trid={ trid || 'main' }
                            title={ label }
                            type="button"
                            draggable>
                            <Icon iconId={ getIcon(blockType) } className="size-xs p-absolute"/>
                            <span class="text-ellipsis">{ label }</span>
                        </button>
                    </div></li>;
                }) }
                </ul></div>
            ] : null }
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
            signals.emit('on-block-dnd-opened');
            this.rootElRight = this.rootEl.current.getBoundingClientRect().right;
            document.addEventListener('dragover', this.onMouseMove);
        } else {
            signals.emit('on-block-dnd-closed');
        }
        this.setState({isOpen: !currentlyIsOpen});
    }
    /**
     * @param {DragEvent} e
     * @access private
     */
    handleDragStarted(e) {
        const dragEl = e.target.nodeName === 'BUTTON' ? e.target : e.target.closest('button');
        const newType = dragEl.getAttribute('data-block-type');
        let gbt;
        if (newType !== 'GlobalBlockReference') {
            if (this.dragData && this.dragData.blockType === newType) return;
            this.newBlock = createBlockFromType(newType, 'don\'t-know-yet');
        } else {
            gbt = this.state.globalBlockTrees.find(({id}) => id === dragEl.getAttribute('data-trid'));
            if (this.newBlock && this.newBlock.globalBlockTreeId === gbt.id) return;
            this.newBlock = createBlockFromType(newType, 'don\'t-know-yet', undefined, {
                globalBlockTreeId: gbt.id,
            });
        }
        this.dragData = {blockId: this.newBlock.id, blockType: this.newBlock.type,
            trid: this.newBlock.isStoredToTreeId, globalBlockTreeId: !gbt ? null : gbt.id};
        this.blockAddPhase = BlockAddPhase.RENDERING_STARTED;
        this.preRender = null;
        renderBlockAndThen(toTransferable(this.newBlock), ({html}) => {
            if (this.blockAddPhase !== BlockAddPhase.RENDERING_STARTED ||
                (this.dragData || {}).blockType !== newType) return;
            if (this.dragData.blockType === 'GlobalBlockReference')
                api.editApp.addBlockTree(gbt.id, gbt.blocks);
            this.blockAddPhase = BlockAddPhase.RENDERING_FINISHED;
            this.preRender = html;
            this.hideLoadingIndicatorIfVisible();
        }, api.blockTypes);
        //
        setTimeout(() => {
            if (this.blockAddPhase === BlockAddPhase.RENDERING_STARTED)
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
            this.blockAddPhase = null;
            this.preRender = null;
        }
        this.dragData = null;
        this.setState({dragExitedRight: false});
        this.hideLoadingIndicatorIfVisible();
    }
    /**
     * @param {RawBlock2} block
     * @param {'before'|'after'|'as-child'} position
     * @returns {BlockDragDataInfo|null}
     * @access private
     */
    handleMainDndStartedDrop(block, position) {
        // Waiting for RENDERING_FINISHED -> skip
        if (this.blockAddPhase === BlockAddPhase.RENDERING_STARTED) {
            return null;
        }
        // Rendering finished -> emit block to the store and start waiting for onAfterInsertedToDom
        if (this.blockAddPhase === BlockAddPhase.RENDERING_FINISHED) {
            const trid = !(position === 'as-child' && block.type === 'GlobalBlockReference') ? block.isStoredToTreeId : block.globalBlockTreeId;
            if (this.dragData.blockType === 'GlobalBlockReference' && trid !== 'main') return null;
            this.blockAddPhase = BlockAddPhase.WAITING_DOM_INSERTION;
            const {tree} = createSelectBlockTree(trid)(store.getState());
            this.dragData.trid = trid;
            setTrids([this.newBlock], trid);
            const {blockId} = this.dragData;
            //
            if (position === 'before') {
                const before = block;
                const br = blockTreeUtils.findBlock(before.id, tree)[1];
                br.splice(br.indexOf(before), 0, this.newBlock);
            } else if (position === 'after') {
                const after = block;
                const br = blockTreeUtils.findBlock(after.id, tree)[1];
                br.splice(br.indexOf(after) + 1, 0, this.newBlock);
            } else {
                const asChildOf = trid === 'main' ? block : tree[0];
                asChildOf.children.push(this.newBlock);
            }
            this.newBlock = null;
            store.dispatch(createSetBlockTree(trid)(tree, ['add-single-block',
                {blockId: this.dragData.blockId, blockType: this.dragData.blockType, trid, cloneOf: null},
                'dnd-spawner',
                {html: this.preRender, onAfterInsertedToDom: () => {
                    if (this.blockAddPhase !== BlockAddPhase.WAITING_DOM_INSERTION || this.dragData.blockId !== blockId) return;
                    this.blockAddPhase = BlockAddPhase.DONE;
                }}
            ]));
            if (this.blockAddPhase === BlockAddPhase.WAITING_DOM_INSERTION) // onAfterInsertedToDom not triggered yet
                return null;
            // else fall through
        }
        // onAfterInsertedToDom done -> accept
        if (this.blockAddPhase === BlockAddPhase.DONE)
            return Object.assign({}, this.dragData);
        return null;
    }
    /**
     * @param {SwapChangeEventData} mutationInfos
     * @param {BlockDragDataInfo} dragData
     * @access private
     */
    handleMainDndSwappedBlocks([mutation1, mutation2], updatedDragData) {
        const trid = mutation1.blockToMove.isStoredToTreeId;
        const {tree} = createSelectBlockTree(trid)(store.getState());
        store.dispatch(createSetBlockTree(trid)(tree, ['swap-blocks', [mutation1, mutation2], 'dnd-spawner']));
        if (this.dragData.trid !== updatedDragData.trid)
            this.dragData.trid = updatedDragData.trid;
    }
    /**
     * @param {BlockDragDataInfo} dragData
     * @access private
     */
    handleMainDndGotDrop(dragData) {
        const acceptDrop = this.blockAddPhase === BlockAddPhase.DONE;
        if (acceptDrop) {
        const {trid} = dragData;
        store.dispatch(createSetBlockTree(trid)(createSelectBlockTree(trid)(store.getState()).tree, ['commit-add-single-block',
            {blockId: this.dragData.blockId, blockType: this.dragData.blockType, trid}]));
        const data = this.createDeleteEventData(trid);
        store.dispatch(pushItemToOpQueue(`update-block-tree#${trid}`, {
            doHandle: trid !== 'main' || !this.props.currentPageIsPlaceholder
                ? () => this.props.saveExistingBlocksToBackend(createSelectBlockTree(trid)(store.getState()).tree, trid)
                : null
            ,
            doUndo: () => {
                const {tree} = createSelectBlockTree(trid)(store.getState());
                deleteBlockFromTree(data.blockId, tree);
                store.dispatch(createSetBlockTree(trid)(tree, ['undo-add-single-block', data]));
            },
            args: [],
        }));
        if (this.dragData.blockType === 'GlobalBlockReference')
            api.editApp.registerWebPageDomUpdaterForBlockTree(this.dragData.globalBlockTreeId);
        }
        this.handleDragEnded(null, acceptDrop);
    }
    /**
     * @access private
     */
    handleDragReturnedFromMainDndWithoutDrop() {
        if (this.blockAddPhase === BlockAddPhase.DONE) {
            const {trid} = this.dragData;
            const {tree} = createSelectBlockTree(trid)(store.getState());
            deleteBlockFromTree(this.dragData.blockId, tree);
            const data = this.createDeleteEventData(trid);
            store.dispatch(createSetBlockTree(trid)(tree, ['delete-single-block', data, 'dnd-spawner']));
            this.blockAddPhase = BlockAddPhase.RENDERING_FINISHED;
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
     * @param {String} trid
     * @returns {DeleteChangeEventData}
     * @access private
     */
    createDeleteEventData(trid) {
        return {blockId: this.dragData.blockId, blockType: this.dragData.blockType, trid,
            isRootOfOfTrid: this.dragData.blockType !== 'GlobalBlockReference' ? null : this.dragData.globalBlockTreeId};
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

const ordinals = {
    Section: 1,
    Columns: 2,

    Heading: 3,
    Paragraph: 4,
    RichText: 5,
    Button: 6,
    Image: 7,

    Listing: 8,
    Menu: 9,
    Code: 10,
    GlobalBlockReference: 11,
    PageInfo: 12,
};

/**
 * @param {Array<[blockTypeName, BlockType]>} selectableBlockTypes
 * @returns {Array<[blockTypeName, BlockType]>}
 */
function sort(selectableBlockTypes) {
    selectableBlockTypes.sort(([a], [b]) => {
        const oA = ordinals[a] || Infinity;
        const oB = ordinals[b] || Infinity;
        return oA === oB ? 0 : oA < oB ? -1 : 1;
    });
    return selectableBlockTypes;
}

export default BlockDnDSpawner;