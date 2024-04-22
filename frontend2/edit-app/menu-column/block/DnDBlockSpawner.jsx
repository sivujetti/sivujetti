import {
    __,
    api,
    env,
    events,
    Icon,
    isUndoOrRedo,
    objectUtils,
    traverseRecursively,
} from '@sivujetti-commons-for-edit-app';
import {createBlockFromBlueprint, createBlockFromType} from '../../includes/block/utils.js';
import {fetchOrGet as fetchOrGetGlobalBlockTrees} from '../../includes/global-block-trees/repository.js';
import {fetchOrGet as fetchOrGetReusableBranches} from '../../includes/reusable-branches/repository.js';
import {createTrier} from '../../includes/utils.js';

const UNSPAWNABLES = ['Columns', 'Heading', 'PageInfo', 'Paragraph', 'RichText', 'Section'];

const EVENTS_THAT_NEVER_CHANGE_TREE_HEIGHT =  ['update-single-block-prop', 'convert-branch-to-global-block-reference-block'];

class DnDBlockSpawner extends preact.Component {
    // mainTreeDnd; // public
    // unregisterables;
    // selectableBlockTypes;
    // firstPluginRegisteredBlockTypeIdx;
    // lastSeparatorHeight;
    // unregisterSeparatorHeightUpdater;
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
        this.updateSeparatorHeightIfBlockTreeHeightsChanged = () => {
            const maybeNext = getNextSeparatorHeight();
            if (this.lastSeparatorHeight !== maybeNext) { this.setSeparatorHeight(maybeNext); return true; }
            return false;
        };
        this.overwriteDragListenerFuncs();
        const saveButton = api.saveButton.getInstance();
        this.unregisterables = [saveButton.subscribeToChannel('reusableBranches', (reusables, userCtx, ctx) => {
            if (userCtx?.event === 'create' || userCtx?.event === 'remove' || isUndoOrRedo(ctx))
                this.setState({reusables});
        }), saveButton.subscribeToChannel('theBlockTree', (theTree, userCtx, ctx) => {
            const event = userCtx?.event;
            if (event !== 'init' || isUndoOrRedo(ctx)) {
                this.setState(createGlobalBlockTreesState(saveButton.getChannelState('globalBlockTrees'), theTree));
                if (EVENTS_THAT_NEVER_CHANGE_TREE_HEIGHT.indexOf(event) < 0)
                    this.runUpdateSeparatorHeightLoop();
            }
        }), saveButton.subscribeToChannel('globalBlockTrees', (gbts, userCtx, ctx) => {
            if (userCtx?.event === 'create' || userCtx?.event === 'remove' || isUndoOrRedo(ctx)) {
                this.setState(createGlobalBlockTreesState(gbts));
                this.runUpdateSeparatorHeightLoop();
            }
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
            <div class="dnd-block-spawner-wrap">
                <input name="filterSpawnableBlocks" class="form-input tight" placeholder={ __('Filter') } disabled/>
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
        </div>;
    }
    /**
     * @access private
     */
    toggleIsOpen() {
        const currentlyIsOpen = this.state.isOpen;
        const newIsOpen = !currentlyIsOpen;
        getEditAppOuterEl().classList.toggle('dnd-block-spawner-opened');
        if (newIsOpen) {
            if (!this.selectableBlockTypes) {
                this.selectableBlockTypes = sort(Array.from(api.blockTypes.entries()).filter(([name, _]) =>
                    UNSPAWNABLES.indexOf(name) < 0 && name !== 'GlobalBlockReference'
                ));
                this.firstPluginRegisteredBlockTypeIdx = this.selectableBlockTypes.findIndex(([name, _]) =>
                    name === 'Code'
                ) + 1;
            }

            fetchOrGetReusableBranches()
                .then((reusables) => {
                    this.setState({reusables});
                    setTimeout(() => { this.calculateAndSetSeparatorHeight(); }, 100);
                });
            fetchOrGetGlobalBlockTrees()
                .then((gbts) => {
                    this.setState(createGlobalBlockTreesState(gbts));
                    setTimeout(() => { this.calculateAndSetSeparatorHeight(); }, 100);
                });

            env.document.documentElement.style.setProperty('--menu-column-offset', '200px');
            this.addOrRemoveSeparatorHeightUpdater(true);
            events.emit('dnd-block-spawner-opened');
        } else {
            env.document.documentElement.style.setProperty('--menu-column-offset', '0px');
            this.addOrRemoveSeparatorHeightUpdater(false);
            events.emit('dnd-block-spawner-closed');
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
     * @returns {[Block, GlobalBlockTree]}
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
    /**
     * @param {Boolean} doAdd
     * @access private
     */
    addOrRemoveSeparatorHeightUpdater(doAdd) {
        if (doAdd && !this.unregisterSeparatorHeightUpdater) {
            getEditAppOuterEl().addEventListener('scroll', this.updateSeparatorHeightIfBlockTreeHeightsChanged);
            //
            this.unregisterSeparatorHeightUpdater = () => {
                getEditAppOuterEl().removeEventListener('scroll', this.updateSeparatorHeightIfBlockTreeHeightsChanged);
                this.unregisterables = this.unregisterables.filter(fn => fn !== this.unregisterSeparatorHeightUpdater);
                this.unregisterSeparatorHeightUpdater = null;
            };
            this.unregisterables.push(this.unregisterSeparatorHeightUpdater);
        } else if (!doAdd && this.unregisterSeparatorHeightUpdater) {
            this.unregisterSeparatorHeightUpdater();
        }
    }
    /**
     * @access private
     */
    calculateAndSetSeparatorHeight() {
        const diff = getNextSeparatorHeight();
        this.setSeparatorHeight(diff);
    }
    /**
     * @param {Number} newHeight
     * @access private
     */
    setSeparatorHeight(newHeight) {
        this.lastSeparatorHeight = newHeight;
        env.document.documentElement.style.setProperty(
            '--dnd-block-spawner-separator-height',
            `${document.querySelector('.dnd-block-spawner-wrap').getBoundingClientRect().height - 2 - newHeight}px`
        );
    }
    /**
     * @access private
     */
    runUpdateSeparatorHeightLoop() {
        if (this.state.isOpen) createTrier(() => {
            return this.updateSeparatorHeightIfBlockTreeHeightsChanged();
        }, 20, 20, '')();
    }
}

/**
 * @param {Array<GlobalBlockTree>} allGbts
 * @param {Array<Block>} theBlockTree = null
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
    'Section2',
    'Columns',
    'Listing',
    'Menu',
    'Wrapper',
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
 * @param {Array<Block>} currentBlockTree
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

/**
 * @returns {Number}
 */
function getNextSeparatorHeight() {
    return Math.max(0,
        document.querySelector('.dnd-block-spawner-wrap').getBoundingClientRect().bottom -
        document.querySelector('.on-this-page.panel-section').getBoundingClientRect().bottom
    );
}

/**
 * @returns {HTMLElement}
 */
function getEditAppOuterEl() {
    return env.document.querySelector('#edit-app');
}

export default DnDBlockSpawner;
