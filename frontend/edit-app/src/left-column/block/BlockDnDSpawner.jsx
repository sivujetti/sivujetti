import {__, api, env, http, signals, Icon} from '@sivujetti-commons-for-edit-app';
import {getIcon} from '../../block-types/block-types.js';
import {createTrier} from '../../block/dom-commons.js';
import {createBlockFromBlueprint, createBlockFromType, createGbtRefBlockProps} from '../../block/utils.js';
import store2, {observeStore as observeStore2} from '../../store2.js';
import blockTreeUtils from './blockTreeUtils.js';

/** @type {() => void} */
let unregScrollListener;
let reusablesFetched = false;

class BlockDnDSpawner extends preact.Component {
    // selectableBlockTypes;
    // firstPluginRegisteredBlockTypeIdx;
    // newBlock;
    // rootEl;
    // onDragStart;
    // onDrag;
    // onDragEnd;
    // unregisterables;
    // cachedGlobalBlockTreesAll;
    // styleTop;
    /**
     * @param {{mainTreeDnd: TreeDragDrop; initiallyIsOpen?: Boolean;}} props
     */
    constructor(props) {
        super(props);
        this.state = {isOpen: false, reusables: [], selectableGlobalBlockTrees: [], isMounted: false, gbtIdsCurrentlyInPage: null};
        this.rootEl = preact.createRef();
        this.overwriteDragListenerFuncs();
        this.unregisterables = [observeStore2('reusableBranches', ({reusableBranches}, [event]) => {
            if (event === 'reusableBranches/addItem' || event === 'reusableBranches/removeItem')
                this.setState({reusables: reusableBranches});
        }), signals.on('route-changed', (_, isRightColumView) => {
            if (isRightColumView) this.closeIfOpen();
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
     * @access protected
     */
    componentDidMount() {
        if (unregScrollListener) unregScrollListener();
        let blockTreeBottom = null;
        let invalidateBlockTreeBottom = null;
        const {initiallyIsOpen} = this.props;
        this.styleTop = 0;
        createTrier(() => {
            const blockTreeEl = this.rootEl.current.nextElementSibling;
            if (blockTreeEl) this.updateStyleTopAndAdjustRootEl(initiallyIsOpen);
            return blockTreeEl !== null;
        }, 50, 10)();
        this.setState({isMounted: true});
        const handleScroll = e => {
            const rootEl = this.rootEl.current;
            if (!rootEl || this.styleTop === 0) return;
            //
            if (blockTreeBottom === null) {
                const delta = this.state.isOpen ? 40 : -10;
                const blockTreeEl = this.rootEl.current.nextElementSibling;
                const blockTreeOuterEl = blockTreeEl.parentElement;
                blockTreeBottom = blockTreeOuterEl.offsetTop + blockTreeOuterEl.getBoundingClientRect().height + delta;
            } else {
                clearTimeout(invalidateBlockTreeBottom);
                invalidateBlockTreeBottom = setTimeout(() => { blockTreeBottom = null; }, 2000);
            }
            //
            let adjustedTop = this.styleTop - e.target.scrollTop;
            if (e.target.scrollTop > blockTreeBottom) {
                this.rootEl.current.classList.add('scrolled-past-main-block-tree');
            } else {
                this.rootEl.current.classList.remove('scrolled-past-main-block-tree');
                this.adjustRootElPos(e.target.scrollTop, adjustedTop);
            }
        };
        const mainPanelEl = this.rootEl.current.closest('#main-panel');
        mainPanelEl.addEventListener('scroll', handleScroll);
        unregScrollListener = () => {
            mainPanelEl.removeEventListener('scroll', handleScroll);
        };
        if (initiallyIsOpen)
            this.toggleIsOpen();
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.closeIfOpen();
        this.unregisterables.forEach(unreg => unreg());
    }
    /**
     * @access protected
     */
    render(_, {isMounted, isOpen, reusables, selectableGlobalBlockTrees}) {
        return <div class="new-block-spawner" ref={ this.rootEl }>
            <button
                onClick={ this.toggleIsOpen.bind(this) }
                class={ `p-0 btn btn-sm d-flex with-icon btn-primary${isMounted ? '' : ' d-none'}` }
                title={ __('Start adding content') }
                type="button"
                style="margin: -1px 0 0 -2px">
                <Icon iconId="chevron-right" className="mr-0 size-xs"/>
            </button>
            { isOpen ? [
                <input class="form-input tight" placeholder={ __('Filter') } disabled/>,
                <div class="scroller"><ul class="block-tree">{
                    reusables.map((cb, i) => {
                        const rootReusable = cb.blockBlueprints[0];
                        const blockType = api.blockTypes.get(rootReusable.blockType);
                        const label = rootReusable.initialDefaultsData.title || __(blockType.friendlyName);
                        return [i, label, 'reusableBranch', cb.blockBlueprints[0].blockType, [i.toString()]];
                    })
                    .concat(this.selectableBlockTypes.map(([name, blockType], i) =>
                        [
                            i !== this.firstPluginRegisteredBlockTypeIdx ? i : 0,
                            __(blockType.friendlyName),
                            i < this.firstPluginRegisteredBlockTypeIdx ? 'common' : 'regByPlugin',
                            name,
                            []
                        ]
                    ))
                    .concat(selectableGlobalBlockTrees.map(({id, blocks, name}, i) =>
                        [i, name, 'globalBlockTree', blocks[0].type, [id]]
                    )).map(([nthInGroup, label, group, rootBlockTypeName, vargs]) => {
                        const isNotGbt = group !== 'globalBlockTree';
                        const labelApdx = isNotGbt ? group !== 'reusableBranch' ? '' : ` (${__('reusable content')})` : ` (${__('Unique reusables').toLowerCase()})`;
                        const groupLabel = nthInGroup > 0 ? null : translateGroup(group);
                        return <li
                            class={ `${isNotGbt ? 'page' : 'globalBlockTree'}-block ml-0` }
                            data-block-type={ rootBlockTypeName }
                            data-group={ group }
                            data-first-in-group-title={ groupLabel }><div class="d-flex">
                            <button
                                onDragStart={ this.onDragStart }
                                onDrag={ this.onDrag }
                                onDragEnd={ this.onDragEnd }
                                class="block-handle text-ellipsis"
                                data-block-type={ isNotGbt ? rootBlockTypeName : 'GlobalBlockReference' }
                                data-is-stored-to-tree-id={ isNotGbt ? 'main' : vargs[0] }
                                data-reusable-branch-idx={ group !== 'reusableBranch' ? '' : vargs[0] }
                                title={ `${label}${labelApdx}` }
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
        const newIsOpen = !currentlyIsOpen;
        if (newIsOpen) {
            if (!this.selectableBlockTypes) {
                this.selectableBlockTypes = sort(Array.from(api.blockTypes.entries()).filter(([name, _]) =>
                    ['Heading', 'PageInfo', 'Paragraph', 'RichText'].indexOf(name) < 0 && name !== 'GlobalBlockReference'
                ));
                this.firstPluginRegisteredBlockTypeIdx = this.selectableBlockTypes.findIndex(([name, _]) =>
                    name === 'Code'
                ) + 1;
            }
            this.fetchOrGetReusableBranches()
                .then((reusables) => { this.setState({reusables}); });
            http.get('/api/global-block-trees')
                .then(this.receiveGlobalBlocks.bind(this))
                .catch(env.window.console.error);
            signals.emit('block-dnd-opened');
        } else {
            signals.emit('block-dnd-closed');
        }
        this.updateStyleTopAndAdjustRootEl(newIsOpen);
        this.setState({isOpen: newIsOpen});
    }
    /**
     * @param {Boolean} isOpen
     * @access private
     */
    updateStyleTopAndAdjustRootEl(isOpen) {
        const topEl = isOpen
            ? api.mainPanel.getSectionEl('onThisPage').querySelector('.section-title > span')
            : this.rootEl.current.nextElementSibling;
        const mainScrollTop = this.rootEl.current.closest('#main-panel').scrollTop;
        //
        this.styleTop = topEl.getBoundingClientRect().top + mainScrollTop;
        this.adjustRootElPos(mainScrollTop, this.styleTop - mainScrollTop);
    }
    /**
     * @param {Number} mainScrollTop
     * @param {Number} topVal = this.styleTop
     * @access private
     */
    adjustRootElPos(mainScrollTop, styleTop = this.styleTop) {
        if (mainScrollTop > this.styleTop) styleTop = 6;
        this.rootEl.current.style.top = `${styleTop}px`;
        this.rootEl.current.style.height = `calc(100% - ${styleTop}px - 0.6rem)`;
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
        const newBlock = this.createBlock(typeStr, reusableBranchIdx, dragEl);
        this.props.mainTreeDnd.handleDragStartedFromOutside({block: newBlock, isReusable});
    }
    /**
     * @param {DragEvent} e
     * @access private
     */
    handleDrag(e) {
        this.props.mainTreeDnd.handleDrag(e, true); // forward
    }
    /**
     * @param {String} typeStr
     * @param {String} reusableBranchIdx
     * @param {HTMLButtonElement} dragEl
     * @returns {[RawBlock, RawGlobalBlockTree]}
     * @access private
     */
    createBlock(typeStr, reusableBranchIdx, dragEl) {
        if (typeStr !== 'GlobalBlockReference') {
            return reusableBranchIdx === '' ? createBlockFromType(typeStr)
                : createBlockFromBlueprint(this.state.reusables[parseInt(reusableBranchIdx, 10)].blockBlueprints[0]);
        }
        const gbt = this.state.selectableGlobalBlockTrees.find(({id}) =>
            id === dragEl.getAttribute('data-is-stored-to-tree-id')
        );
        return createBlockFromType(typeStr, undefined, createGbtRefBlockProps(gbt));
    }
    /**
     * @param {DragEvent} _e
     * @access private
     */
    handleDragEnded(_e) {
        this.props.mainTreeDnd.handleDragEnded(); // forward
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
                reusables.reverse();
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
     * @access private
     */
    overwriteDragListenerFuncs() {
        this.onDragStart = this.handleDragStarted.bind(this);
        this.onDrag = this.handleDrag.bind(this);
        this.onDragEnd = this.handleDragEnded.bind(this);
    }
    /**
     * @access private
     */
    closeIfOpen() {
        if (this.state.isOpen) this.toggleIsOpen();
    }
}

const ordinals = [
    'Text',
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

/**
 * @param {'reusableBranch'|'common'|'regByPlugin'|'globalBlockTree'} group
 * @returns {String}
 */
function translateGroup(group) {
    return {
        reusableBranch: __('Reusables'),
        common: __('Common'),
        regByPlugin: __('Specialized'),
        globalBlockTree: __('Unique reusables')
    }[group];
}

export default BlockDnDSpawner;
