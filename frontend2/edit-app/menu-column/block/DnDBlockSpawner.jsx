import {
    __,
    api,
    env,
    Icon,
    isUndoOrRedo,
    objectUtils,
    traverseRecursively,
} from '@sivujetti-commons-for-edit-app';
import {fetchOrGet as fetchOrGetReusableBranches} from '../../includes/reusable-branches/repository.js';
import {fetchOrGet as fetchOrGetGlobalBlockTrees} from '../../includes/global-block-trees/repository.js';
import {createBlockFromBlueprint, createBlockFromType} from '../../includes/block/utils.js';

class DnDBlockSpawner extends preact.Component {
    // mainTreeDnd; // public
    // unregisterables;
    // selectableBlockTypes;
    // firstPluginRegisteredBlockTypeIdx;
    /**
     * @param {{initiallyIsOpen?: Boolean;}} props
     */
    constructor(props) {
        super(props);
        this.mainTreeDnd = null;
        this.state = {
            gbtIdsCurrentlyInPage: null,
            isMounted: false,
            isOpen: false, // Handled at componentDidMount()
            reusables: [],
            selectableGlobalBlockTrees: [],
        };
        this.overwriteDragListenerFuncs();
        const saveButton = api.saveButton.getInstance();
        this.unregisterables = [saveButton.subscribeToChannel('reusableBranches', (reusables, userCtx, ctx) => {
            if (userCtx?.event === 'create' || userCtx?.event === 'remove' || isUndoOrRedo(ctx))
                this.setState({reusables});
        }), saveButton.subscribeToChannel('theBlockTree', (theTree, userCtx, ctx) => {
            if (userCtx?.event !== 'init' || isUndoOrRedo(ctx))
                this.setState(createGlobalBlockTreesState(saveButton.getChannelState('globalBlockTrees'), theTree));
        }), saveButton.subscribeToChannel('globalBlockTrees', (gbts, userCtx, ctx) => {
            if (userCtx?.event === 'create' || userCtx?.event === 'remove' || isUndoOrRedo(ctx))
                this.setState(createGlobalBlockTreesState(gbts));
        })];
    }
    /**
     * @param {TreeDragDrop} mainTreeDnd
     * @access public
     */
    setMainTreeDnd(mainTreeDnd) {
        this.mainTreeDnd = mainTreeDnd;
    }
    /**
     * @access protected
     */
    componentDidMount() {
        this.setState({isMounted: true});
        if (this.props.initiallyIsOpen)
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
        return <div id="dnd-block-spawner">
            <button
                onClick={ this.toggleIsOpen.bind(this) }
                class={ `p-0 btn btn-sm d-flex with-icon btn-primary${isMounted ? '' : ' d-none'}` }
                title={ __('Start adding content') }
                type="button">
                <Icon iconId="chevron-right" className="mr-0 size-xs"/>
            </button>
            <div class="wrp">
                <input class="form-input tight" placeholder={ __('Filter') } disabled/>
                <div class="d-scroller">
                    { isOpen ? <ul class="block-tree no-hover">{ [
                        // Reusable blocks/branches
                        ...reusables.map(({blockBlueprints}, i) => {
                            const rootReusable = blockBlueprints[0];
                            const blockType = api.blockTypes.get(rootReusable.blockType);
                            return {
                                label: rootReusable.initialDefaultsData.title || __(blockType.friendlyName),
                                group: 'reusableBranch',
                                nthInGroup: i,
                                rootBlockTypeName: rootReusable.blockType,
                                trid: 'main',
                                varargs: {reusableBranchIdx: i.toString()},
                            };
                        }),
                        // Plain blocks
                        ...this.selectableBlockTypes.map(([name, blockType], i) =>
                            ({
                                label: __(blockType.friendlyName),
                                group: i < this.firstPluginRegisteredBlockTypeIdx ? 'common' : 'registeredByPlugin',
                                nthInGroup: i !== this.firstPluginRegisteredBlockTypeIdx ? i : 0,
                                rootBlockTypeName: name,
                                trid: 'main',
                                varargs: {},
                            })
                        ),
                        // Unique blocks/branches
                        ...selectableGlobalBlockTrees.map(({id, blocks, name}, i) =>
                            ({
                                label: name,
                                group: 'globalBlockTree',
                                nthInGroup: i,
                                rootBlockTypeName: blocks[0].type,
                                trid: id,
                                varargs: {}
                            })
                        )
                    ].map(({group, label, nthInGroup, rootBlockTypeName, trid, varargs}) => {
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
                                data-is-stored-to-tree-id={ trid }
                                data-reusable-branch-idx={ varargs.reusableBranchIdx || '' }
                                title={ `${label}${labelApdx}` }
                                type="button"
                                draggable>
                                <Icon iconId={ api.blockTypes.getIconId(rootBlockTypeName) } className="size-xs p-absolute"/>
                                <span class="text-ellipsis">{ label }</span>
                            </button>
                        </div></li>;
                    }) }</ul> : null }
                </div>
            </div>
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
            fetchOrGetReusableBranches()
                .then((reusables) => {
                    this.setState({reusables});
                });
            fetchOrGetGlobalBlockTrees()
                .then((gbts) => {
                    this.setState(createGlobalBlockTreesState(gbts));
                });
        }
        this.setState({isOpen: newIsOpen});
    }
    /**
     * @param {DragEvent} e
     * @access private
     */
    handleDragStarted(e) {
        const dragEl = e.target.nodeName === 'BUTTON' ? e.target : e.target.closest('button');
        const typeStr = dragEl.getAttribute('data-block-type');
        const reusableBranchIdx = dragEl.getAttribute('data-reusable-branch-idx');
        if (!reusableBranchIdx) {
            const newBlock = this.createBlock(typeStr, dragEl);
            this.mainTreeDnd.handleDragStartedFromOutside({block: newBlock, isReusable: false, styles: null});
        } else {
            const root = this.state.reusables[parseInt(reusableBranchIdx, 10)].blockBlueprints[0];
            const blockTmp = createBlockFromBlueprint(root);
            const newBlock = {...blockTmp, ...{title: `${blockTmp.title} ${__('duplicated')}`}};
            this.mainTreeDnd.handleDragStartedFromOutside({block: newBlock, isReusable: true});
        }
    }
    /**
     * @param {DragEvent} e
     * @access private
     */
    handleDrag(e) {
        this.mainTreeDnd.handleDrag(e, true); // forward
    }
    /**
     * @param {String} typeStr
     * @param {HTMLButtonElement} dragEl
     * @returns {[RawBlock, RawGlobalBlockTree]}
     * @access private
     */
    createBlock(typeStr, dragEl) {
        if (typeStr !== 'GlobalBlockReference') {
            return createBlockFromType(typeStr);
        }
        const gbt = this.state.selectableGlobalBlockTrees.find(({id}) =>
            id === dragEl.getAttribute('data-is-stored-to-tree-id')
        );
        return createBlockFromType(typeStr, {__globalBlockTree: objectUtils.cloneDeep(gbt)});
    }
    /**
     * @param {DragEvent} _e
     * @access private
     */
    handleDragEnded(_e) {
        this.mainTreeDnd.handleDragEnded(); // forward
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

/**
 * @param {Array<RawGlobalBlockTree>} allGbts
 * @param {Array<RawBlock>} theBlockTree = null
 */
function createGlobalBlockTreesState(allGbts, theBlockTree = null) {
    if (!allGbts) return {};
    const alreadyInCurrentPage = getGbtIdsFrom(theBlockTree || api.saveButton.getInstance().getChannelState('theBlockTree'));
    //
    const filtered = allGbts.filter(gbt =>
        alreadyInCurrentPage.indexOf(gbt.id) < 0
    );
    return {
        selectableGlobalBlockTrees: filtered,
        gbtIdsCurrentlyInPage: alreadyInCurrentPage,
    };
}

const ordinals = [
    'Text',
    'Image',
    'Button',

    'Section',
    'Columns',
    'Columns2',
    'Listing',
    'Menu',
    'Code',

    'GlobalBlockReference',
    'PageInfo',
].reduce((out, blockTypeName, i) =>
    ({...out, ...{[blockTypeName]: i + 1}})
, {});

/**
 * @param {Array<[blockTypeName, BlockTypeDefinition]>} selectableBlockTypes
 * @returns {Array<[blockTypeName, BlockTypeDefinition]>}
 */
function sort(selectableBlockTypes) {
    selectableBlockTypes.sort(([a], [b]) => {
        const oA = ordinals[a] || Infinity;
        const oB = ordinals[b] || Infinity;
        return oA === oB ? 0 : oA < oB ? -1 : 1;
    });
    return selectableBlockTypes;
}

/*
 * @param {Array<RawBlock>} currentBlockTree
 * @returns {Array<String>}
 */
function getGbtIdsFrom(currentBlockTree) {
    const ids = [];
    traverseRecursively(currentBlockTree, b => {
        if (b.type === 'GlobalBlockReference') ids.push(b.globalBlockTreeId);
    });
    ids.sort();
    return ids;
}

/**
 * @param {'reusableBranch'|'common'|'registeredByPlugin'|'globalBlockTree'} group
 * @returns {String}
 */
function translateGroup(group) {
    return {
        reusableBranch: __('Reusables'),
        common: __('Common'),
        registeredByPlugin: __('Specialized'),
        globalBlockTree: __('Unique reusables')
    }[group];
}

export default DnDBlockSpawner;
