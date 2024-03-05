class BlockTree extends preact.Component {
    /**
     * @access private
     */
    deSelectAllBlocks() {
        const mutRef = this.state.treeState;
        for (const key in mutRef) mutRef[key].isSelected = false;
        this.selectedRoot = null;
        this.setState({treeState: mutRef});
    }

function duplicateDeepAndReAssignIds(block) { // where to put this 
    const out = objectUtils.cloneDeep(block);
    console.log('bef',{...out});
    blockTreeUtils.traverseRecursively([out], bRef => {
        bRef.id = generateShortId();
    });
    console.log('then',{...out});
    return out;
}

/**
 * @param {RawBlock} original
 * @param {RawBlock} cloned
 * @returns {[Array<RawBlock>, Array<RawBlock]}
 */
function flattenBlocksRecursive(original, cloned) {
    const flatOriginal = [];
    blockTreeUtils.traverseRecursively([original], b1 => {
        flatOriginal.push(b1);
    });
    const flatCloned = [];
    blockTreeUtils.traverseRecursively([cloned], b2 => {
        flatCloned.push(b2);
    });
    return [flatOriginal, flatCloned];
}

/**
 * @param {RawBlock} block
 * @param {(item: BlockBlueprint, block: RawBlock) => BlockBlueprint} onEach
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

export default BlockTree;
