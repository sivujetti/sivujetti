import {
    generatePushID,
    objectUtils,
    traverseRecursively,
} from '@sivujetti-commons-for-edit-app';
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
            // Visible block moved inside a collapsed one
            if (parenBlock && out[parenBlock.id].isCollapsed && !clone.isHidden)
                clone.isHidden = true;
            out[block.id] = clone;
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
    return null; // todo
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
 * @param {(item: BlockBlueprint, block: Block) => BlockBlueprint} onEach
 * @returns {BlockBlueprint}
 */
function blockToBlueprint(block, onEach) {
    return onEach({
        blockType: block.type,
        initialOwnData: propsToObj(block.propsData),
        initialDefaultsData: {
            title: block.title || '',
            renderer: block.renderer,
            styleClasses: block.styleClasses || '',
            styleGroup: block.styleGroup || '',
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

export {
    blockToBlueprint,
    createPartialState,
    createStyleShunkcScssIdReplacer,
    duplicateDeepAndReAssignIds,
    getShortFriendlyName,
    hideOrShowChildren,
    setAsHidden,
    splitPath,
    withParentIdPathDo,
};
