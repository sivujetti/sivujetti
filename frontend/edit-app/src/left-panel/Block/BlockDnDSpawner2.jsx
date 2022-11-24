import {__, api, env, http, signals, Icon} from '@sivujetti-commons-for-edit-app';
import {renderBlockAndThen} from '../../shar.js';
import {withBlockId} from '../../../../webpage/src/EditAppAwareWebPage.js';
import {getIcon} from '../../block-types/block-types.js';
import {createBlockFromBlueprint, createBlockFromType, toTransferable} from '../../Block/utils.js';
import store, {createSelectBlockTree, createSetBlockTree} from '../../store.js';
import store2, {observeStore as observeStore2} from '../../store2.js';
import blockTreeUtils from './blockTreeUtils.js';

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
    // cachedGlobalBlockTreesAll;
    /**
     * @param {{mainTreeDnd: TreeDragDrop; initiallyIsOpen?: Boolean;}} props
     */
    constructor(props) {
        super(props);
        this.state = {isOpen: false, reusables: [], selectableGlobalBlockTrees: [], isMounted: false, gbtIdsCurrentlyInPage: null};
        this.selectableBlockTypes = sort(Array.from(api.blockTypes.entries()).filter(([name, _]) =>
            name !== 'PageInfo' && name !== 'GlobalBlockReference'
        ));
        this.dragData = null;
        this.preRender = {phase: null, blockType: null, html: null};
        this.newBlock = {phase: null, block: null};
        this.rootEl = preact.createRef();
        this.overwriteDragListenerFuncs();
        this.unregisterables = [observeStore2('reusableBranches', ({reusableBranches}, [event]) => {
            if (event === 'reusableBranches/addItem' || event === 'reusableBranches/removeItem')
                this.setState({reusables: reusableBranches});
        })];
    }
    /**
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.mainTreeDnd !== this.props.mainTreeDnd) {
            this.overwriteDragListenerFuncs();
            throw new Error('??');
        }
        if (this.state.gbtIdsCurrentlyInPage === null) return;
        const maybeChanged = getGbtIdsFrom(store2.get().theBlockTree);
        if (this.state.gbtIdsCurrentlyInPage.toString() !== maybeChanged.toString())
            this.setSelectableGbtsToState(maybeChanged);
    }
    /**
     * @access public
     */
    handleMainDndDraggedOut() {
        if (window.useStoreonBlockTree !== false) {
            throw new Error();
        } else {
        if (this.newBlock.phase === BlockAddPhase.INSERTED_TO_TREE_AND_DOM) {
            const {trid} = this.dragData;
            const {tree} = createSelectBlockTree(trid)(store.getState());
            deleteBlockFromTree(this.dragData.blockId, tree);
            const data = this.createDeleteEventData(trid);
            store.dispatch(createSetBlockTree(trid)(tree, ['delete-single-block', data, 'dnd-spawner']));
            this.newBlock.phase = BlockAddPhase.READY_TO_INSERT_TO_TREE_AND_DOM;
        }
        }
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
    render(_, {isMounted, isOpen, reusables, selectableGlobalBlockTrees}) {
        return <div
            class="new-block-spawner"
            ref={ this.rootEl }>
            <button
                onClick={ this.toggleIsOpen.bind(this) }
                class={ `p-0 btn btn-sm d-flex with-icon btn-primary${isMounted ? '' : ' d-none'}` }
                title={ __('Start adding content') }
                type="button"
                style="margin: 2px 0px 0px -2px">
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
                    .concat(selectableGlobalBlockTrees.map(({id, blocks, name}) =>
                        [name, 'globalBlockTree', blocks[0].type, [id]]
                    )).map(([label, flavor, rootBlockTypeName, vargs]) => {
                        const isNotGbt = flavor !== 'globalBlockTree';
                        return <li class={ `${isNotGbt ? 'page' : 'globalBlockTree'}-block ml-0` } data-block-type={ rootBlockTypeName } data-flavor={ flavor }><div class="d-flex">
                            <button
                                onDragStart={ this.onDragStart }
                                onDragEnd={ this.onDragEnd }
                                class="block-handle text-ellipsis"
                                data-block-type={ isNotGbt ? rootBlockTypeName : 'GlobalBlockReference' }
                                data-is-stored-to-trid={ isNotGbt ? 'main' : vargs[0] }
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
        if (window.useStoreonBlockTree !== false) {
        this.props.mainTreeDnd.handleDragStartedFromOutside({block: newBlock, isReusable});
        } else {
        this.newBlock.phase = BlockAddPhase.CREATED;
        this.newBlock.block = newBlock;
        this.dragData = dragData;

        if (preRenderWithNewBlockId) {
            this.preRender.html = preRenderWithNewBlockId;
            this.props.mainTreeDnd.setDragStartedFromOutside(this);
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
            this.preRender.isRenderReady = true;
        }, api.blockTypes, isReusable);
        this.props.mainTreeDnd.setDragStartedFromOutside(this);
        }
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
            gbt = this.state.selectableGlobalBlockTrees.find(({id}) => id === dragEl.getAttribute('data-is-stored-to-trid'));
            newBlock = createBlockFromType(typeStr, 'don\'t-know-yet', undefined, {
                globalBlockTreeId: gbt.id,
                __globalBlockTree: {
                    id: gbt.id,
                    name: gbt.name,
                    blocks: JSON.parse(JSON.stringify(gbt.blocks)),
                }
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
        this.props.mainTreeDnd.eventController.end(this.props.mainTreeDnd.lastAcceptedIdx);
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
        this.cachedGlobalBlockTreesAll = globalBlockTrees;
        const alreadyInCurrentPage = getGbtIdsFrom(store2.get().theBlockTree);
        this.setSelectableGbtsToState(alreadyInCurrentPage);
    }
    /**
     * @param {Array<String>} alreadyInCurrentPage
     * @access private
     */
    setSelectableGbtsToState(alreadyInCurrentPage) {
        const filtered = this.cachedGlobalBlockTreesAll.filter(gbt =>
            alreadyInCurrentPage.indexOf(gbt.id) < 0
        );
        this.setState({selectableGlobalBlockTrees: filtered, gbtIdsCurrentlyInPage: alreadyInCurrentPage});
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
    overwriteDragListenerFuncs() {
        this.onDragStart = this.handleDragStarted.bind(this);
        this.onDragEnd = this.handleDragEnded.bind(this);
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

/**
 * @param {Array<RawBlock>} currentBlockTree
 * @returns {Array<String>}
 */
function getGbtIdsFrom(currentBlockTree) {
    const ids = [];
    blockTreeUtils.traverseRecursively(currentBlockTree, b => {
        if (b.type === 'GlobalBlockReference') ids.push(b.globalBlockTreeId);
    });
    ids.sort();
    return ids;
}

export default BlockDnDSpawner;
