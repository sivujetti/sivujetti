/**
 * @param {Array<RawBlock>} newBlocks
 * @param {Object} previousState = {}
 * @returns {Object}
 */
function createPartialState(newBlocks, previousState = {}) {
    return {treeState: createTreeState(newBlocks, previousState.treeState)};
}

/**
 * @param {Array<RawBlock>} tree
 * @param {{[key: String]: BlockTreeItemState;}|null} previousTreeState
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
    blockTreeUtils.traverseRecursively(tree, (block, _i, paren) => {
        if (block.type !== 'GlobalBlockReference')
            addItem(block, paren);
        else
            blockTreeUtils.traverseRecursively(block.__globalBlockTree.blocks, (block2, _i2, paren2) => {
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

export {
    createPartialState,
};
