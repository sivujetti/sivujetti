import {
    __,
    blockTreeUtils,
    generatePushID,
    objectUtils,
    traverseRecursively,
} from '@sivujetti-commons-for-edit-app';

const autoCollapse = 'nonUniqueRootLevelItems'; // 'mainContentItem'|'nonUniqueRootLevelItems';

/**
 * @param {Array<Block>} newBlocks
 * @param {Object} previousState = {}
 * @returns {Object}
 */
function createPartialState(newBlocks, previousState = {}) {
    return {treeState: createTreeState(newBlocks, previousState.treeState)};
}

/**
 * @param {Array<Block>} tree
 * @param {{[key: String]: BlockTreeItemState;}|undefined} previousTreeState
 * @returns {{[key: String]: BlockTreeItemState;}}
 */
function createTreeState(tree, previousTreeState) {
    const out = {};
    const addItem = (block, parenBlock) => {
        if (!previousTreeState || !previousTreeState[block.id])
            out[block.id] = createTreeStateItem(!parenBlock ? null : out[parenBlock.id], !block.children.length ? undefined : {isCollapsed: true});
        else {
            const clone = {...previousTreeState[block.id]};
            out[block.id] = clone;
            // Visible block moved inside a collapsed one -> uncollapse
            if (parenBlock && out[parenBlock.id].isCollapsed && !clone.isHidden)
                setAsHidden(false, parenBlock, out, false);
        }
    };
    traverseRecursively(tree, (block, _i, paren) => {
        if (block.type !== 'GlobalBlockReference')
            addItem(block, paren);
        else
            traverseRecursively(block.__globalBlockTree.blocks, (block2, _i2, paren2) => {
                addItem(block2, paren2);
            });
    });
    if (autoCollapse === 'nonUniqueRootLevelItems')
        tree.forEach(block => {
            if (block.type === 'GlobalBlockReference') return;
            if (block.children.length)
                setAsHidden(false, block, out, false);
        });
    else if (autoCollapse === 'mainContentItem') {
        const main = getMainContent(tree);
        if (main) setAsHidden(false, main, out, false);
    }
    return out;
}

/**
 * @param {Array<Block>} tree
 * @returns {Block|null}
 */
function getMainContent(tree) {
    let headerIndex = null;
    tree.forEach((block, i) => {
        if (block.type === 'GlobalBlockReference') return;
        if (headerIndex === null && block.title.toLowerCase().indexOf('header') > -1)
            headerIndex = i;
    });
    if (headerIndex !== null) {
        const next = tree[headerIndex + 1];
        if (next && next.children.length) // next + next + ... ?
            return next;
    }
    if (tree.length === 4) {
        const [maybPageInfo, maybeMainMenu, maybeMainContent, maybeFooter] = tree;
        if (
            maybPageInfo.type === 'PageInfo' &&
            (maybeMainMenu.type === 'GlobalBlockReference' && blockTreeUtils.findRecursively(maybeMainMenu.__globalBlockTree.blocks, b=>b.type==='Menu')) &&
            maybeMainContent.children.length &&
            (maybeFooter.type === 'GlobalBlockReference' && (maybeFooter.__globalBlockTree.blocks[0] || {}).title.toLowerCase().indexOf('footer') > -1)
        ) return maybeMainContent;
    }
    if (tree.length === 2 && tree[0].type === 'PageInfo' && tree[1].children.length)
        return tree[1];
    return null;
}

/**
 * @param {Boolean} isHidden
 * @param {Block} block
 * @param {Object} mutTreeState
 * @param {Boolean} recursive = true
 */
function setAsHidden(isHidden, block, mutTreeState, recursive = true) {
    mutTreeState[block.id].isCollapsed = isHidden;
    hideOrShowChildren(isHidden, block, mutTreeState, recursive);
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
 * @param {(parentIdPath: String, block: Block) => any} fn
 * @param {String} parentIdPath
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
 * @param {String} path e.g. '/foo/bar'
 * @returns {Array<String>} e.g. ['foo', 'bar']
 */
function splitPath(path) {
    const pieces = path.split('/'); // '/foo/bar' -> ['', 'foo', 'bar']
    pieces.shift();                 //            -> ['foo', 'bar']
    return pieces;
}

/**
 * @param {Boolean} setAsHidden
 * @param {Block} block
 * @param {Object} mutTreeState
 * @param {Boolean} recursive = true
 */
function hideOrShowChildren(setAsHidden, block, mutTreeState, recursive = true) {
    if (!block.children.length) return;
    if (setAsHidden)
        block.children.forEach(b2 => {
            if (b2.type === 'GlobalBlockReference') return; // Ignore
            mutTreeState[b2.id].isHidden = true;
            // Always hide all children
            if (recursive) hideOrShowChildren(true, b2, mutTreeState);
        });
    else
        block.children.forEach(b2 => {
            if (b2.type === 'GlobalBlockReference') return; // Ignore
            mutTreeState[b2.id].isHidden = false;
            // Show children only if it's not collapsed
            if (recursive && !mutTreeState[b2.id].isCollapsed) hideOrShowChildren(false, b2, mutTreeState);
        });
}

/**
 * @param {Block} block
 * @param {BlockTypeDefinition} type
 * @returns {String}
 */
function getShortFriendlyName(block, type) {
    if (block.title)
        return block.title;
    const translated = __(type.friendlyName);
    const pcs = translated.split(' ('); // ['Name', 'PluginName)'] or ['Name']
    return pcs.length < 2 ? translated : pcs[0];
}

/**
 * @param {Object} overrides = {}
 * @returns {BlockTreeItemState}
 */
function createTreeStateItem(parentStateItem, overrides = {}) {
    return Object.assign({
        isSelected: false,
        isCollapsed: false,
        isHidden: parentStateItem && parentStateItem.isCollapsed,
        isNew: false,
    }, overrides);
}

/**
 * @param {String} from
 * @param {String} to
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
 * @returns {[Array<Block>, Array<Block]}
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

export {
    blockToBlueprint,
    clearHighlight,
    createAddContentPlacementCfg,
    createPartialState,
    createStyleShunkcScssIdReplacer,
    duplicateDeepAndReAssignIds,
    findVisibleLi,
    getShortFriendlyName,
    hideOrShowChildren,
    setAsHidden,
    splitPath,
    withParentIdPathDo,
};
