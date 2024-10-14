import {
    __,
    api,
    blockTreeUtils,
    generatePushID,
    objectUtils,
    traverseRecursively,
} from '@sivujetti-commons-for-edit-app';
import {findGbt, removeFrom} from '../../includes/block/tree-dnd-controller-funcs.js';

const autoCollapseNonUniqueRootLevelItems = true;

/**
 * @param {Array<Block>} newBlocks
 * @param {Object} previousState = {}
 * @returns {Object}
 */
function createPartialState(newBlocks, previousState = {}) {
    return {uiStateTree: createTreeState(newBlocks, previousState.uiStateTree)};
}

/**
 * @param {Array<Block} tree
 * @returns {Array<UiStateEntry>}
 */
function createTreeState(tree) {
    const out = createBranch(tree, {});
    if (autoCollapseNonUniqueRootLevelItems)
        out.forEach(entry => {
            setAsCollapsed(false, entry, false);
        });
    return out;
}

/**
 * @param {Array<Block} branch
 * @returns {Array<UiStateEntry>}
 */
function createBranch(branch, parentProps = {}) {
    return branch.map(maybeGbtRefBlock => {
        const b = getVisibleBlock(maybeGbtRefBlock);
        const hasChildren = b.children.length > 0;
        return {
            item: createTreeStateItem(null, {...parentProps,  isCollapsed: hasChildren, bid: b.type+':'+b.id}),
            children: createBranch(b.children, {isHidden: hasChildren})
        };
    });
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
 * @param {Array<Block>} blocks
 * @param {(parentIdPath: string, block: Block) => any} fn
 * @param {string} parentIdPath
 * @returns {any}
 */
function withParentIdPathDo(blocks, fn, parentIdPath = '') {
    for (const block of blocks) {
        const ret = fn(parentIdPath, block);
        if (ret) return ret;
        if (block.children.length) {
            const ret2 = withParentIdPathDo(block.children, fn, `${parentIdPath}/${block.id}`);
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
        return block.title;
    const translated = __(type.friendlyName);
    const pcs = translated.split(' ('); // ['Name', 'PluginName)'] or ['Name']
    return pcs.length < 2 ? translated : pcs[0];
}

/**
 * @param {LiUiState|null} parent
 * @param {{[key: keyof LiUiState]: boolean;}} overrides = {}
 * @returns {LiUiState}
 */
function createTreeStateItem(parentStateItem, overrides = {}) {
    return {
        isSelected: false,
        isCollapsed: false,
        isHidden: parentStateItem && parentStateItem.item.isCollapsed,
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
                const [curBlockRef, refBranch] = blockTreeUtils.findBlock(originalBlockId, newTreeCopy);
                refBranch[refBranch.indexOf(curBlockRef)] = newGbRefBlock;
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
            const [block, branch] = blockTreeUtils.findBlock(originalBlockId, findGbt(originalBlockIsStoredTo, copy).blocks);
            branch[branch.indexOf(block)] = newGbRefBlock;

            return copy;
        }), {event: 'create-and-convert'}]];
    }
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
 * @typedef {{item: LiUiState; children: Array<LiUiState>;}} UiStateEntry
 *
 * @typedef {{isSelected: boolean; isCollapsed: boolean; isHidden: boolean;}} LiUiState
 */

export {
    blockToBlueprint,
    clearHighlight,
    createAddContentPlacementCfg,
    createConvertBlockToGlobalOps,
    createDeleteBlockOp,
    createGetTreeBlocksFn,
    createPartialState,
    createStyleShunkcScssIdReplacer,
    duplicateDeepAndReAssignIds,
    findVisibleLi,
    getShortFriendlyName,
    hideOrShowChildren,
    setAsCollapsed,
    splitPath,
    withParentIdPathDo,
};
