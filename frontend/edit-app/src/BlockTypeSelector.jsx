import {__, api} from '@sivujetti-commons-for-edit-app';
import Tabs from './commons/Tabs.jsx';
import Block from './Block.js';
import blockTreeUtils from './blockTreeUtils.js';
import GlobalBlockTreeSelector from './GlobalBlockTreeSelector.jsx';

class BlockTypeSelector extends preact.Component {
    // selectableBlockTypes;
    /**
     * @param {{onSelectionConfirmed: (placeholderBlock: Block) => void; onSelectionChanged: (blockBluePrint: BlockBlueprint, placeholderBlock: Block) => void; onSelectionDiscarded: (placeholderBlock: Block) => void; block: Block; targetParentBlock: Block|null; tree: Array<Block>;}} props
     */
    constructor(props) {
        super(props);
        this.state = {
            blockBluePrint: {blockType: props.block.type},
            currentTabIdx: 0,
        };
        this.selectableBlockTypes = Array.from(api.blockTypes.entries()).filter(([name, _]) =>
            name !== 'PageInfo' && name !== 'GlobalBlockReference'
        );
    }
    /**
     * @access protected
     */
    render({targetParentBlock}, {blockBluePrint, currentTabIdx}) {
        return <div class="dashed pt-1 pr-2 pb-2 pl-2" draggable onDragStart={ e => {
                e.preventDefault();
                e.stopPropagation();
            } }>
            <Tabs
                links={ [__('Common'), __('Globals')] }
                onTabChanged={ this.handeTabChanged.bind(this) }
                className="text-tinyish mt-0 mb-2"/>
            <div class={ currentTabIdx === 0 ? '' : 'd-none' }>
                <select
                    value={ blockBluePrint.blockType }
                    onChange={ e => this.selectBlockType(e.target.value) }
                    class="form-input form-select tight mb-2">{ this.selectableBlockTypes.map(([name, blockType]) =>
                    <option value={ name }>
                        { __((typeof blockType !== 'function' ? blockType : blockType()).friendlyName || name) }
                    </option>
                ) }</select>
            </div>
            <div class={ currentTabIdx === 1 ? '' : 'd-none' }>
                { (!targetParentBlock || targetParentBlock.isStoredTo !== 'globalBlockTree')
                    ? <GlobalBlockTreeSelector
                        filterSelectables={
                        /**
                         * @param {RawGlobalBlockTree} item
                         * @returns {Boolean}
                         */
                        ({id}) => blockTreeUtils.findRecursively(this.props.tree,
                            b => b.type === 'GlobalBlockReference' && b.globalBlockTreeId === id) === null
                        }
                        onItemSelected={ this.selectRefBlockType.bind(this) }
                        isVisible={ currentTabIdx === 1 }/>
                    : <p class="mt-0 mb-2 ml-1">Nested global blocks not supported yet</p>
                }
            </div>
            <button class="btn btn-sm btn-primary widen ml-0" onClick={ this.apply.bind(this) } type="button">Ok</button>
            <button class="btn btn-sm btn-link" onClick={ this.discard.bind(this) } type="button">{ __('Cancel') }</button>
        </div>;
    }
    /**
     * @param {Number} toIdx
     * @access private
     */
    handeTabChanged(toIdx) {
        const newState = {currentTabIdx: toIdx};
        if (toIdx === 0)
            this.selectBlockType('Paragraph');
        this.setState(newState);
    }
    /**
     * @param {String} blockTypeName
     * @access private
     */
    selectBlockType(blockTypeName) {
        if (this.state.blockBluePrint.blockType === blockTypeName) return;
        const blockType = api.blockTypes.get(blockTypeName);
        const providedInitialData = blockType.initialData; // BlockBlueprint|Object
        const blockBluePrint = !providedInitialData.blockType
            ? {blockType: blockType.name, data: providedInitialData, children: []}
            : providedInitialData;
        this.setState({blockBluePrint});
        this.props.onSelectionChanged(blockBluePrint, this.props.block);
    }
    /**
     * @param {RawGlobalBlockTree} globalBlockTree
     * @access private
     */
    selectRefBlockType(globalBlockTree) {
        const gbrBlockType = api.blockTypes.get('GlobalBlockReference');
        const initialData = Object.assign({}, gbrBlockType.initialData, {globalBlockTreeId: globalBlockTree.id, __globalBlockTree: {
            id: globalBlockTree.id,
            name: globalBlockTree.name,
            blocks: blockTreeUtils.mapRecursively(globalBlockTree.blocks, blockRaw => {
                const b = Block.fromObject(blockRaw);
                normalizeGlobalBlockTreeBlock(b, globalBlockTree.id);
                return b;
            }),
        }});
        const blockBluePrint = {blockType: 'GlobalBlockReference', data: initialData, children: []};
        this.setState({blockBluePrint});
        this.props.onSelectionChanged(blockBluePrint, this.props.block);
    }
    /**
     * @access private
     */
    apply() {
        this.props.onSelectionConfirmed(this.props.block);
    }
    /**
     * @access private
     */
    discard() {
        this.props.onSelectionDiscarded(this.props.block);
    }
}

/**
 * @param {Block|RawBlock} block
 * @param {String} globalBlockTreeId
 */
function normalizeGlobalBlockTreeBlock(block, globalBlockTreeId) {
    block.isStoredTo = 'globalBlockTree';
    block.globalBlockTreeId = globalBlockTreeId;
}

export default BlockTypeSelector;
export {normalizeGlobalBlockTreeBlock};
