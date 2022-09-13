import {__, api, env, http, signals, Icon} from '@sivujetti-commons-for-edit-app';
import {renderBlockAndThen, withBlockId} from '../../../webpage/src/EditAppAwareWebPage.js';
import {getIcon} from '../block-types/block-types.js';
import store, {createSelectBlockTree, createSetBlockTree, pushItemToOpQueue} from '../store.js';
import store2, {observeStore as observeStore2} from '../store2.js';
import {createBlockFromBlueprint, createBlockFromType, setTrids, toTransferable} from './utils.js';
import blockTreeUtils from '../blockTreeUtils.js';

const BlockAddPhase = Object.freeze({
    CREATED: 'created',
    READY_TO_INSERT_TO_TREE_AND_DOM: 'inPositionForTreeInsertion',
    INSERTED_TO_TREE_AND_DOM: 'fullyInsertedToTreeAndDom',
});

/** @type {() => void} */
let unregScrollListener;
let reusablesFetched = false;

class BlockDnDSpawner extends preact.Component {
    // selectableBlockTypes;
    // dragData;
    // newBlock;
    // preRender;
    // rootEl;
    // onDragStart;
    // onDragEnd;
    // unregisterables;
    /**
     * @param {{mainTreeDnd: BlockTreeDragDrop; mainTree: BlockTree; saveExistingBlocksToBackend: (blocks: Array<RawBlock>, trid: 'String') => Promise<Boolean>; currentPageIsPlaceholder: Boolean; initiallyIsOpen?: Boolean;}} props
     */
    constructor(props) {
        super(props);
        this.state = {isOpen: false, reusables: [], globalBlockTrees: [], isMounted: false};
        this.selectableBlockTypes = sort(Array.from(api.blockTypes.entries()).filter(([name, _]) =>
            name !== 'PageInfo' && name !== 'GlobalBlockReference'
        ));
        this.dragData = null; // ditch ?
        this.preRender = {phase: null, blockType: null, html: null};
        this.newBlock = {phase: null, block: null};
        this.rootEl = preact.createRef();
        this.onDragStart = this.handleDragStarted.bind(this);
        this.onDragEnd = this.handleDragEnded.bind(this);
        this.unregisterables = [observeStore2('reusableBranches', ({reusableBranches}, [event]) => {
            if (event === 'reusableBranches/addItem' || event === 'reusableBranches/removeItem')
                this.setState({reusables: reusableBranches});
        })];
    }
    /**
     * @param {DragDropInfo} info
     * @param {Boolean} isTreesOutermostBlock
     * @param {(innerTreeBlockOrTrid: RawBlock|String, tree: Array<RawBlock>) => RawBlock} findRefBlockOf
     * @returns {Boolean} Should accept
     * @access public
     */
    handleMainDndDraggedOver(info, isTreesOutermostBlock, findRefBlockOf) {
        let position = info.pos;
        // Waiting for render to finish -> skip
        if (!this.preRender.isRenderReady) {
            return false;
        }
        let block, trid;
        if (!info.li.getAttribute('data-last')) {
            const blockId0 = info.li.getAttribute('data-block-id');
            const trid0 = info.li.getAttribute('data-trid') || 'main';
            block = trid0 === 'main' || !isTreesOutermostBlock(blockId0, createSelectBlockTree(trid0)(store.getState()).tree)
                ? blockTreeUtils.findBlock(blockId0, createSelectBlockTree(trid0)(store.getState()).tree)[0]
                : findRefBlockOf(trid0, createSelectBlockTree('main')(store.getState()).tree);
            trid = !(position === 'as-child' && block.type === 'GlobalBlockReference') ? block.isStoredToTreeId : block.globalBlockTreeId;
        } else {
            block = null;
            trid = 'main';
            position = 'as-child';
        }
        // Rendering finished -> emit block to the store and start waiting for onAfterInsertedToDom
        if (this.dragData.blockType === 'GlobalBlockReference' && trid !== 'main') return false;
        const {tree} = createSelectBlockTree(trid)(store.getState());
        if (this.newBlock.phase === BlockAddPhase.CREATED) {
            this.dragData.trid = trid;
            setTrids([this.newBlock.block], trid);
            this.newBlock.phase = BlockAddPhase.READY_TO_INSERT_TO_TREE_AND_DOM;
        }
        //
        if (position === 'before') {
            const before = block;
            const br = blockTreeUtils.findBlock(before.id, tree)[1];
            br.splice(br.indexOf(before), 0, this.newBlock.block);
        } else if (position === 'after') {
            const after = block;
            const br = blockTreeUtils.findBlock(after.id, tree)[1];
            br.splice(br.indexOf(after) + 1, 0, this.newBlock.block);
        } else {
            const asChildOf = trid === 'main' ? (block || {children: tree}) : tree[0];
            asChildOf.children.push(this.newBlock.block);
        }
        const {blockId} = this.dragData;
        store.dispatch(createSetBlockTree(trid)(tree, ['add-single-block',
            {blockId: this.dragData.blockId, blockType: this.dragData.blockType, trid, cloneOf: null},
            'dnd-spawner',
            {html: this.preRender.html, onAfterInsertedToDom: () => {
                if (this.newBlock.phase !== BlockAddPhase.READY_TO_INSERT_TO_TREE_AND_DOM || this.dragData.blockId !== blockId) return;
                this.newBlock.phase = BlockAddPhase.INSERTED_TO_TREE_AND_DOM;
            }}
        ]));
        if (this.newBlock.phase === BlockAddPhase.READY_TO_INSERT_TO_TREE_AND_DOM) // onAfterInsertedToDom not triggered yet
            return false;
        // else fall through

        return this.newBlock.phase === BlockAddPhase.INSERTED_TO_TREE_AND_DOM;
    }
    /**
     * @access public
     */
    handleMainDndDraggedOut() {
        if (this.newBlock.phase === BlockAddPhase.INSERTED_TO_TREE_AND_DOM) {
            const {trid} = this.dragData;
            const {tree} = createSelectBlockTree(trid)(store.getState());
            deleteBlockFromTree(this.dragData.blockId, tree);
            const data = this.createDeleteEventData(trid);
            store.dispatch(createSetBlockTree(trid)(tree, ['delete-single-block', data, 'dnd-spawner']));
            this.newBlock.phase = BlockAddPhase.READY_TO_INSERT_TO_TREE_AND_DOM;
        }
    }
    /**
     * @access public
     */
    handleMainDndSwappedBlocks(info, _prevInfo, applySwap) {
        if (!this.dragData) return; // ??

        const dragTree = createSelectBlockTree(this.dragData.trid)(store.getState()).tree;
        const [dragBlock, dragBranch] = blockTreeUtils.findBlock(this.dragData.blockId, dragTree);

        let muts;
        if (!info.li.getAttribute('data-last')) {
            const dropTree = createSelectBlockTree(info.li.getAttribute('data-trid'))(store.getState()).tree;
            const [dropBlock, dropBranch] = blockTreeUtils.findBlock(info.li.getAttribute('data-block-id'), dropTree);
            muts = applySwap(info, dragBlock, dragBranch, dragTree, dropBlock, dropBranch, dropTree);
        } else {
            const dropTree = createSelectBlockTree('main')(store.getState()).tree;
            const dropBlock = null;
            const dropBranch = dropTree;
            muts = applySwap({pos: 'as-child', li: info.li}, dragBlock, dragBranch, dragTree, dropBlock, dropBranch, dropTree);
        }

        if (muts) {
            const [mutation1, mutation2] = muts;
            const trid = mutation1.blockToMove.isStoredToTreeId;
            const {tree} = createSelectBlockTree(trid)(store.getState());
            store.dispatch(createSetBlockTree(trid)(tree, ['swap-blocks', [mutation1, mutation2], 'dnd-spawner']));
            // if (this.dragData.trid !== updatedDragData.trid) todo 
            //     this.dragData.trid = updatedDragData.trid;
        }
    }
    /**
     * @access public
     */
    handleMainDndGotDrop() {
        const acceptDrop = this.newBlock.phase === BlockAddPhase.INSERTED_TO_TREE_AND_DOM;
        if (acceptDrop) {
            const {trid} = this.dragData;
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
        this.newBlock.phase = BlockAddPhase.READY_TO_INSERT_TO_TREE_AND_DOM;
        // keep this.preRender and this.newBlock.block in case the next draggable has the same type
        this.hideLoadingIndicatorIfVisible();
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
        this.unregisterables.forEach(unreg => unreg());
    }
    /**
     * @access protected
     */
    render(_, {isMounted, isOpen, reusables, globalBlockTrees}) {
        return <div
            class="new-block-spawner"
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
                <div class="scroller"><ul class="block-tree">{
                    reusables.map((cb, i) => {
                        const rootReusable = cb.blockBlueprints[0];
                        const blockType = api.blockTypes.get(rootReusable.blockType);
                        return [rootReusable.initialDefaultsData.title || __(blockType.friendlyName), 'reusableBranch', cb.blockBlueprints[0].blockType,
                            [i.toString()]];
                    })
                    .concat(this.selectableBlockTypes.map(([name, blockType]) =>
                        [__(blockType.friendlyName), 'blockType', name, []])
                    )
                    .concat(globalBlockTrees.map(({id, blocks, name}) =>
                        [name, 'globalBlockTree', blocks[0].type, [id]]
                    )).map(([label, flavor, rootBlockTypeName, vargs]) => {
                        const isNotGbt = flavor !== 'globalBlockTree';
                        return <li class={ `${isNotGbt ? 'page' : 'globalBlockTree'}-block ml-0` } data-block-type={ rootBlockTypeName } data-flavor={ flavor }><div class="d-flex">
                            <button
                                onDragStart={ this.onDragStart }
                                onDragEnd={ this.onDragEnd }
                                class="block-handle text-ellipsis"
                                data-block-type={ isNotGbt ? rootBlockTypeName : 'GlobalBlockReference' }
                                data-trid={ isNotGbt ? 'main' : vargs[0] }
                                data-reusable-branch-idx={ flavor !== 'reusableBranch' ? '' : vargs[0] }
                                title={ label }
                                type="button"
                                draggable>
                                <Icon iconId={ getIcon(rootBlockTypeName) } className="size-xs p-absolute"/>
                                <span class="text-ellipsis">{ label }</span>
                            </button>
                        </div></li>;
                    }) }</ul></div>
            ] : null }
        </div>;
    }
    /**
     * @access private
     */
    toggleIsOpen() {
        const currentlyIsOpen = this.state.isOpen;
        if (!currentlyIsOpen) {
            this.fetchOrGetReusableBranches()
                .then((reusables) => { this.setState({reusables}); });
            http.get('/api/global-block-trees')
                .then(this.receiveGlobalBlocks.bind(this))
                .catch(env.window.console.error);
            signals.emit('on-block-dnd-opened');
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
        const typeStr = dragEl.getAttribute('data-block-type');
        const reusableBranchIdx = dragEl.getAttribute('data-reusable-branch-idx');
        const isReusable = reusableBranchIdx !== '';
        const [newBlock, dragData, gbt, preRenderWithNewBlockId] = this.createBlock(typeStr, reusableBranchIdx, dragEl);
        this.newBlock.phase = BlockAddPhase.CREATED;
        this.newBlock.block = newBlock;
        this.dragData = dragData;

        if (preRenderWithNewBlockId) {
            this.preRender.html = preRenderWithNewBlockId;
            this.props.mainTreeDnd.setDragStartedFromOutside();
            return;
        }

        this.preRender.isRenderReady = false;
        this.preRender.blockType = typeStr;
        this.preRender.html = null;
        renderBlockAndThen(toTransferable(this.newBlock.block), ({html}) => {
            if (this.preRender.isRenderReady ||
                (this.dragData || {}).blockType !== typeStr) return;
            if (this.dragData.blockType === 'GlobalBlockReference')
                api.editApp.addBlockTree(gbt.id, gbt.blocks);
            this.preRender.html = html;
            this.hideLoadingIndicatorIfVisible();
            this.preRender.isRenderReady = true;
        }, api.blockTypes, isReusable);
        this.props.mainTreeDnd.setDragStartedFromOutside();
        //
        setTimeout(() => {
            if (!this.preRender.isRenderReady)
                this.showLoadingIndicator();
        }, 200);
    }
    /**
     * @param {String} typeStr
     * @param {String} reusableBranchIdx
     * @param {HTMLButtonElement} dragEl
     * @returns {[RawBlock, BlockDragDataInfo, RawGlobalBlockTree, String|undefined]}
     * @access private
     */
    createBlock(typeStr, reusableBranchIdx, dragEl) {
        let newBlock, dragData, gbt, patchedPreRender;
        if (typeStr !== 'GlobalBlockReference') {
            newBlock = reusableBranchIdx === '' ? createBlockFromType(typeStr, 'don\'t-know-yet')
                : createBlockFromBlueprint(this.state.reusables[parseInt(reusableBranchIdx, 10)].blockBlueprints[0], 'don\'t-know-yet');
        } else {
            gbt = this.state.globalBlockTrees.find(({id}) => id === dragEl.getAttribute('data-trid'));
            // todo if this.preRender same (was: `if (this.newBlock && this.newBlock.globalBlockTreeId === gbt.id) return;`)
            newBlock = createBlockFromType(typeStr, 'don\'t-know-yet', undefined, {
                globalBlockTreeId: gbt.id,
            });
        }
        //
        dragData = {blockId: newBlock.id, blockType: newBlock.type,
            trid: newBlock.isStoredToTreeId, globalBlockTreeId: !gbt ? null : gbt.id};
        //
        if (this.preRender.blockType === typeStr) {
            if (!gbt)
                patchedPreRender = withBlockId(this.preRender.html, newBlock.id);
            // else todo
        }
        return [newBlock, dragData, gbt, patchedPreRender];
    }
    /**
     * @param {DragEvent} _e
     * @access private
     */
    handleDragEnded(_e) {
        this.hideLoadingIndicatorIfVisible();
    }
    /**
     * @returns {Promise<ReusableBranch[]>}
     * @access private
     */
    fetchOrGetReusableBranches() {
        if (reusablesFetched)
            return Promise.resolve(store2.get().reusableBranches);
        return http.get('/api/reusable-branches')
            .then((reusables) => {
                const combined = [...store2.get().reusableBranches, ...reusables];
                store2.dispatch('reusableBranches/setAll', [combined]);
                reusablesFetched = true;
                return combined;
            })
            .catch(env.window.console.error);
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
 * @param {Array<RawBlock>} tree
 */
function deleteBlockFromTree(blockId, tree) {
    const [b, br] = blockTreeUtils.findBlock(blockId, tree);
    br.splice(br.indexOf(b), 1); // Mutate tree temporarily
}

const ordinals = [
    'Heading',
    'RichText',
    'Paragraph',
    'Image',
    'Button',

    'Section',
    'Columns',
    'Listing',
    'Menu',
    'Code',

    'GlobalBlockReference',
    'PageInfo',
].reduce((out, blockTypeName, i) =>
    Object.assign(out, {[blockTypeName]: i + 1})
, {});

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
