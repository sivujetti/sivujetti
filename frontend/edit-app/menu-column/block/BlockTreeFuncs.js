import {
    __,
    api,
    blockTreeUtils,
    generatePushID,
    objectUtils,
    traverseRecursively,
    writeBlockProps,
} from '@sivujetti-commons-for-edit-app';
import {callGetBlockPropChangesEvent} from '../../includes/block/create-block-tree-dnd-controller.js';
import {findGbt, removeFrom, replaceAt} from '../../includes/block/tree-dnd-controller-funcs.js';
import {extractChangeableClasses} from '../block-styles/StyleClassesPicker.jsx';

const autoCollapseNonUniqueRootLevelItems = true;

/**
 * @param {Array<Block>} newBlocks
 * @param {Array<UiStateEntry>} previousState
 * @returns {Object}
 */
function createPartialState(newBlocks, previousState = null) {
    return {uiStateTree: createTreeState(newBlocks, previousState)};
}

/**
 * @param {Array<Block>} tree
 * @param {Array<UiStateEntry>|null} previousState
 * @returns {Array<UiStateEntry>}
 */
function createTreeState(tree, previousState) {
    if (!previousState) {
        const out = createBranch(tree, {});
        if (autoCollapseNonUniqueRootLevelItems)
            out.forEach(entry => {
                setAsCollapsed(false, entry, false);
            });
        return out;
    }
    const newRootLevelItemIndices = autoCollapseNonUniqueRootLevelItems ? [] : null;
    const out = createBranchFromPrev(tree, createFindPrevUiStateEntryFn(previousState),
        {}, newRootLevelItemIndices);
    if (newRootLevelItemIndices?.length) newRootLevelItemIndices.forEach(idx => {
        setAsCollapsed(false, out[idx], false);
    });
    return out;
}

/**
 * @param {Array<Block>} branch
 * @param {(blockId: string, isPartOf: globalBlockReferenceBlockId = null) => UiStateEntry|null} findPrev
 * @param {{[key: keyof LiUiState]: boolean|string;}} parentProps
 * @param {Array<number>|null} collectNewRootItemIndicesTo
 * @returns {Array<UiStateEntry>}
 */
function createBranchFromPrev(branch, findPrev, parentProps, collectNewRootItemIndicesTo) {
    return branch.map((maybeGbtRefBlock, i) => {
        const b = getVisibleBlock(maybeGbtRefBlock);
        const p = findPrev(b.id, b === maybeGbtRefBlock ? null : maybeGbtRefBlock.id);

        // New content
        if (!p) {
            if (collectNewRootItemIndicesTo) collectNewRootItemIndicesTo.push(i);
            return createBranch([b], parentProps)[0];
        }

        // New child content (inserted or dragged)
        if (p.item.isCollapsed && b.children.length > p.children.length && !p.item.isPartOf)
            return {
                item: {...p.item, ...parentProps, isCollapsed: false},
                children: createBranchFromPrev(b.children, findPrev, {isHidden: false}, null)
            };

        return {
            item: {...p.item, ...parentProps},
            children: createBranchFromPrev(b.children, findPrev, {isHidden: p.item.isCollapsed}, null)
        };
    });
}

/**
 * @param {Array<Block>} branch
 * @param {{[key: keyof LiUiState]: boolean|string;}} parentProps = {}
 * @returns {Array<UiStateEntry>}
 */
function createBranch(branch, parentProps = {}) {
    return branch.map(maybeGbtRefBlock => {
        const b = getVisibleBlock(maybeGbtRefBlock);
        const hasChildren = b.children.length > 0;
        return {
            item: createTreeStateItem({...parentProps, isCollapsed: hasChildren, blockId: b.id, isPartOf: b === maybeGbtRefBlock ? null : maybeGbtRefBlock.id}),
            children: createBranch(b.children, {isHidden: hasChildren})
        };
    });
}

/**
 * @param {Array<UiStateEntry>|null} fromsState
 * @returns {((blockId: string, isPartOf: globalBlockReferenceBlockId = null) => UiStateEntry|null)|null}
 */
function createFindPrevUiStateEntryFn(fromsState) {
    if (!fromsState)
        return null;
    return (blockId, isPartOf = null) =>
        blockTreeUtils.findRecursively(fromsState, ({item}) =>
            item.blockId === blockId && item.isPartOf === isPartOf
        )
    ;
}

/**
 * @param {boolean} asCollapsed
 * @param {UiStateEntry} entry
 * @param {boolean} recursive = true
 */
function setAsCollapsed(asCollapsed, entryMut, recursive = true) {
    // const visible = getVisibleBlock(block);
    if (entryMut.children.length) {
        // uncollpse|uncollapase outermost
        entryMut.item.isCollapsed = asCollapsed;
        // show|hide children
        hideOrShowChildren(asCollapsed, entryMut, recursive);
    }
}

/**
 * @param {{hovered: HTMLLIElement; visible: HTMLLIElement;}} curHigh
 */
function clearHighlight(curHigh) {
    curHigh.visible.classList.remove('highlighted');
    curHigh.hovered = null;
    curHigh.visible = null;
}

/**
 * @param {HTMLLIElement} li
 * @param {HTMLUListElement} ul
 * @param {HTMLLIElement} def
 * @returns {HTMLLIElement}
 */
function findVisibleLi(li, ul, def) {
    const parentBlockId = li.getAttribute('data-is-children-of');
    if (!parentBlockId) return def;
    const parentBlockLi = ul.querySelector(`li[data-block-id="${parentBlockId}"]`);
    if (!parentBlockLi.classList.contains('d-none')) // found it
        return parentBlockLi;
    // keep looking
    return findVisibleLi(parentBlockLi, ul, def);
}

/**
 * @template {T}
 * @param {Array<T>} blocks
 * @param {(idxPath: string, i: number, itm: T) => any} fn
 * @param {string} idxPath
 * @returns {any}
 */
function withIdxPathDo(blocks, fn, idxPath = '') {
    for (let i = 0; i < blocks.length; ++i) {
        const block = blocks[i];
        const ret = fn(`${idxPath}/${i}`, i, block);
        if (ret) return ret;
        if (block.children.length) {
            const ret2 = withIdxPathDo(block.children, fn, `${idxPath}/${i}`);
            if (ret2) return ret2;
        }
    }
}

/**
 * @param {string} path e.g. '/foo/bar'
 * @returns {Array<string>} e.g. ['foo', 'bar']
 */
function splitPath(path) {
    const pieces = path.split('/'); // '/foo/bar' -> ['', 'foo', 'bar']
    pieces.shift();                 //            -> ['foo', 'bar']
    return pieces;
}

/**
 * @param {boolean} setAsHidden
 * @param {UiStateEntry} entryMut
 * @param {boolean} recursive = true
 */
function hideOrShowChildren(setAsHidden, entryMut, recursive = true) {
    if (!entryMut.children.length)
        return;
    if (setAsHidden)
        entryMut.children.forEach(entry2 => {
            entry2.item.isHidden = true;
            // Always hide all children
            if (recursive) hideOrShowChildren(true, entry2);
        });
    else
        entryMut.children.forEach(entry2 => {
            entry2.item.isHidden = false;
            // Show children only if it's not collapsed
            if (recursive && !entry2.item.isCollapsed) hideOrShowChildren(false, entry2);
        });
}

/**
 * @param {Block} block
 * @param {BlockTypeDefinition} type
 * @returns {string}
 */
function getShortFriendlyName(block, type) {
    if (block.title)
        return __(block.title);
    const translated = __(type.friendlyName);
    const pcs = translated.split(' ('); // ['Name', 'PluginName)'] or ['Name']
    return pcs.length < 2 ? translated : pcs[0];
}

/**
 * @param {{[key: keyof LiUiState]: boolean|string;}} overrides = {}
 * @returns {LiUiState}
 */
function createTreeStateItem(overrides = {}) {
    return {
        isSelected: false,
        isCollapsed: false,
        isHidden: false,
        ...overrides,
    };
}

/**
 * @param {string} from
 * @param {string} to
 * @returns {(style: StyleChunk) => StyleChunk}
 */
function createStyleShunkcScssIdReplacer(from, to) {
    return s => ({
        ...s,
        ...{scss: s.scss.replace(new RegExp(from, 'g'), to)}, //  '$oldId' -> '$newId'
    });
}

/**
 * @param {Block} block
 * @param {(item: BlockBlueprint, block: Block) => BlockBlueprint} onEach = (blueprint, _block) => blueprint
 * @returns {BlockBlueprint}
 */
function blockToBlueprint(block, onEach = (blueprint, _block) => blueprint) {
    return onEach({
        blockType: block.type,
        initialOwnData: propsToObj(block.propsData),
        initialDefaultsData: {
            title: block.title || '',
            renderer: block.renderer,
            styleClasses: block.styleClasses || '',
        },
        initialChildren: block.children.map(w => blockToBlueprint(w, onEach)),
        initialStyles: [],
    }, block);
}
function propsToObj(propsData) { // Can these contain __private -fields? 
    const out = {};
    for (const field of propsData) {
        out[field.key] = field.value;
    }
    return out;
}

/**
 * @param {Block} block
 * @returns {Block}
 */
function duplicateDeepAndReAssignIds(block) {
    const out = objectUtils.cloneDeep(block);
    traverseRecursively([out], bRef => {
        bRef.id = generatePushID(true);
    });
    return out;
}

/**
 * @param {HTMLLIElement} li
 * @param {dropPosition} pos
 * @returns {[Array<Block>, Array<Block>]}
 */
function createAddContentPlacementCfg(li, pos) {
    if (pos === 'as-child' &&
        !li.classList.contains('collapsed') &&
        li.getAttribute('data-has-children') === 'true') {
        const childLis = li.parentElement.querySelectorAll(`li[data-is-children-of="${li.getAttribute('data-block-id')}"]`);
        return [[...childLis].at(-1).querySelector('.block-handle'), false];
    }
    return [li.querySelector('.block-handle'), pos === 'before'];
}

/**
 * @param {Block} maybeGbtRefBlock
 * @returns {Block}
 */
function getVisibleBlock(maybeGbtRefBlock) {
    return maybeGbtRefBlock.type !== 'GlobalBlockReference' ? maybeGbtRefBlock : blockTreeUtils.getTree(maybeGbtRefBlock.globalBlockTreeId).blocks[0];
}

/**
 * @param {string} blockToDeleteId
 * @param {string} blockToDeleteTrid
 * @param {boolean} wasCurrentlySelectedBlock
 * @returns {['theBlockTree'|'globalBlockTrees', Array<Block>|Array<GlobalBlockTree>, StateChangeUserContext]}
 */
function createDeleteBlockOp(blockToDeleteId, blockToDeleteTrid, wasCurrentlySelectedBlock) {
    if (blockToDeleteTrid === 'main')
        return [
            'theBlockTree',
            blockTreeUtils.createMutation(api.saveButton.getInstance().getChannelState('theBlockTree'), newTreeCopy => {
                const [ref, refBranch] = blockTreeUtils.findBlock(blockToDeleteId, newTreeCopy);
                removeFrom(ref, refBranch); // mutates newTreeCopy
                return newTreeCopy;
            }), {event: 'delete', wasCurrentlySelectedBlock}
        ];
    else
        return [
            'globalBlockTrees',
            objectUtils.cloneDeepWithChanges(api.saveButton.getInstance().getChannelState('globalBlockTrees'), newGbtsCopy => {
                const [ref, refBranch] = blockTreeUtils.findBlock(blockToDeleteId, findGbt(blockToDeleteTrid, newGbtsCopy).blocks);
                removeFrom(ref, refBranch); // mutates newGbtsCopy
                return newGbtsCopy;
            }), {event: 'delete', wasCurrentlySelectedBlock}
        ];
}

/**
 * @param {Block} newGbRefBlock
 * @param {GlobalBlockTree} newGbt
 * @param {string} originalBlockId
 * @param {string} originalBlockIsStoredTo
 * @param {SaveButton} saveButton
 * @returns {Array<['theBlockTree'|'globalBlockTrees', Array<Block>|Array<GlobalBlockTree>, StateChangeUserContext]>}
 */
function createConvertBlockToGlobalOps(newGbRefBlock, newGbt, originalBlockId, originalBlockIsStoredTo, saveButton) {
    const currentGbts = saveButton.getChannelState('globalBlockTrees');

    if (originalBlockIsStoredTo === 'main') {
        // Push a new 'globalBlockTrees' state (which includes the new gbt)
        const pushNewGbtsStateOp = ['globalBlockTrees', objectUtils.cloneDeepWithChanges(currentGbts, copy => {
            copy.push(newGbt);
            return copy;
        }), {event: 'create'}];

        // Swap original block/branch with the new 'GlobalBlockReference' block
        const updateBlockTreeOp = [
            'theBlockTree',
            blockTreeUtils.createMutation(saveButton.getChannelState('theBlockTree'), newTreeCopy => {
                replaceAt(newGbRefBlock, newTreeCopy, originalBlockId);
                return newTreeCopy;
            }),
            {
                event: 'convert-branch-to-global-block-reference-block',
                originalBlockId: originalBlockId,
                newBlockId: newGbRefBlock.id,
            }
        ];

        return [
            pushNewGbtsStateOp,
            updateBlockTreeOp
        ];
    } else {
        // Push a new 'globalBlockTrees' state (which includes both the new and updated gbt)
        return [['globalBlockTrees', objectUtils.cloneDeepWithChanges(currentGbts, copy => {
            // 1
            copy.push(newGbt);
            // 2
            replaceAt(newGbRefBlock, findGbt(originalBlockIsStoredTo, copy).blocks, originalBlockId);

            return copy;
        }), {event: 'create-and-convert'}]];
    }
}

/**
 * @param {string} blockId
 * @param {string} blockIsStoredTo
 * @param {SaveButton} saveButton
 * @returns {[['theBlockTree'|'globalBlockTrees', Array<Block>|Array<GlobalBlockTree>, StateChangeUserContext], Block]} [duplicateOp, clonedBlock]
 */
function createDuplicateBlockOp(blockId, blockIsStoredTo, saveButton) {
    let cloned, channel, newState;
    if (blockIsStoredTo === 'main') {
        channel = 'theBlockTree';
        newState = blockTreeUtils.createMutation(saveButton.getChannelState('theBlockTree'), newTreeCopy => {
            cloned = duplicateBlockWithin(blockId, newTreeCopy);
            return newTreeCopy;
        });
    } else {
        channel = 'globalBlockTrees';
        newState = objectUtils.cloneDeepWithChanges(saveButton.getChannelState('globalBlockTrees'), newGbtsCopy => {
            const gbt = findGbt(blockIsStoredTo, newGbtsCopy);
            cloned = duplicateBlockWithin(blockId, gbt.blocks); // mutates gbt.blocks (and thus gbt and newGbtsCopy)
            return newGbtsCopy;
        });
    }
    return [
        [channel, newState, {event: 'duplicate'}],
        cloned,
    ];
}

/**
 * @param {string} blockId
 * @param {Array<Block>} treeMut
 * @returns {Block} clonedBlock
 */
function duplicateBlockWithin(blockId, treeMut) {
    const [origBlockRef, refBranch] = blockTreeUtils.findBlock(blockId, treeMut);
    const cloned = duplicateDeepAndReAssignIds(origBlockRef);
    const changes = callGetBlockPropChangesEvent(cloned.type, 'cloneBlock', [cloned]);
    if (changes) writeBlockProps(cloned, changes);

    // insert after current
    refBranch.splice(refBranch.indexOf(origBlockRef) + 1, 0, cloned);
    return cloned;
}

/**
 * @param {UiStateEntry} uiStateEntry
 * @returns {number}
 */
function getVisibleLisCount(uiStateEntry) {
    const single = ent =>
        ent.item.isCollapsed || !ent.children.length
            ? 1
            : ent.children.reduce((tot, ent2) => tot + single(ent2), 1)
    ;
    return single(uiStateEntry);
}

/**
 * @returns {(gbtRefBlock: Block) => Array<GlobalBlockTree>}
 */
function createGetTreeBlocksFn() {
    if (api.saveButton.getInstance().getChannelState('theBlockTree'))
        return ({globalBlockTreeId}) => blockTreeUtils.getTree(globalBlockTreeId).blocks;
    return _ => [];
}

/**
 * @param {string} blockId
 * @param {string} nthOfId
 * @param {Array<Block>} blockBranch
 * @param {Array<UiStateEntry} uiStateBranch
 * @param {{nthFound: number;}} stat = {nthFound: 0}
 * @param {(gbtRefBlock: Block) => Array<GlobalBlockTree>} getTreeBlocks = createGetTreeBlocksFn()
 * @returns {Block|undefined}
 */
function findUiStateEntry(blockId, nthOfId, blockBranch, uiStateBranch, stat = {nthFound: 0}, getTreeBlocks = createGetTreeBlocksFn()) {
    for (let i = 0; i < blockBranch.length; ++i) {
        const block = blockBranch[i];
        if (block.type !== 'GlobalBlockReference') {
            if (block.id === blockId) {
                stat.nthFound += 1;
                if (stat.nthFound === nthOfId) return uiStateBranch[i];
            }
            if (block.children.length) {
                const s = findUiStateEntry(blockId, nthOfId, block.children, uiStateBranch[i].children, stat, getTreeBlocks);
                if (s) return s;
            }
        } else {
            const s2 = findUiStateEntry(blockId, nthOfId, getTreeBlocks(block), [uiStateBranch[i]], stat, getTreeBlocks);
            if (s2) return s2;
        }
    }
}

/**
 * @param {Block} block
 * @param {Array<BlockBehaviourDefinition>} defs
 * @returns {Array<BlockBehaviour>}
 */
function getActiveBehaviours(block, defs) {
    const classes = extractChangeableClasses(block.styleClasses).split(' ');
    const names = defs.map(({name}) => name);
    return classes
        .filter(cls => names.indexOf(cls) > -1)
        .map(name => {
            const def = defs.find(def => def.name === name);
            return {
                name,
                data: def.createData ? def.createData(classes.filter(cls => !cls.startsWith('cc-'))) : {},
            };
        });
}

/**
 * @param {Block} block
 * @param {string} behaviourName
 * @returns {boolean}
 */
function hasBehaviour({styleClasses}, behaviourName) {
    return styleClasses.indexOf(behaviourName) > -1;
}

/**
 * @typedef {{item: LiUiState; children: Array<LiUiState>;}} UiStateEntry
 *
 * @typedef {{isSelected: boolean; isCollapsed: boolean; isHidden: boolean; blockId: string; isPartOf: globalBlockReferenceBlockId|null;}} LiUiState
 */

export {
    blockToBlueprint,
    clearHighlight,
    createAddContentPlacementCfg,
    createConvertBlockToGlobalOps,
    createDeleteBlockOp,
    createDuplicateBlockOp,
    createGetTreeBlocksFn,
    createPartialState,
    createStyleShunkcScssIdReplacer,
    findUiStateEntry,
    findVisibleLi,
    getActiveBehaviours,
    getShortFriendlyName,
    getVisibleLisCount,
    hasBehaviour,
    hideOrShowChildren,
    setAsCollapsed,
    splitPath,
    withIdxPathDo,
};
