import {
    __,
    api,
    Tabs,
} from '@sivujetti-commons-for-edit-app';
import {createBlockFromType} from '../../includes/block/utils.js';
import {pushInserBlockOp} from '../../menu-column/block/AddContentPopup.jsx';

/** @extends {preact.Component<{blockId: string; onAfterInsertedBlock: (newRowBlock: Block) => void;}, {currentTabIdx: number;}>} */
class AddRowPopup extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState({currentTabIdx: 0});
    }
    /**
     * @access protected
     */
    render(_, {currentTabIdx}) {
        return <div>
            <h6>{ __('Insert row') }</h6>
            <Tabs
                links={ [__('New row'), __('Add from library')] }
                onTabChanged={ this.handleTabChanged.bind(this) }
                initialTabIdx={ 0 }
                className="text-tinyish mt-0"/>
            { currentTabIdx === 0
                ? <RowPicker
                    blockId={ this.props.blockId }
                    insertPos="as-child"
                    isReplace={ true }
                    onAfterInsertedBlock={ this.props.onAfterInsertedBlock }/>
                : <div>todo</div>
            }
        </div>;
    }
    /**
     * @param {number} toIdx
     * @access private
     */
    handleTabChanged(toIdx) {
        if (this.state.currentTabIdx !== toIdx)
            this.setState({currentTabIdx: toIdx});
    }
}

/** @extends {preact.Component<RowPickerProps, any>} */
class RowPicker extends preact.Component {
    render() {
        return <div class="row-picker mt-1">
            { this.createAddRowButton(1) }
            { this.createAddRowButton(2) }
            { this.createAddRowButton(3) }
            { this.createAddRowButton(4) }
            { this.createAddRowButton(5) }
            { this.createAddRowButton(6) }
        </div>;
    }
    /**
     * @param {number} numCols
     * @returns {preact.VNode}
     * @access private
     */
    createAddRowButton(numCols) {
        const emptyCols = [...Array(numCols)];
        return <button
            class="btn btn no-color p-1 d-flex col-12"
            onClick={ () => {
                const onCreate = this.props.onCreateBlock || (b => b);
                const newRowBlock = onCreate({
                    ...createBlockFromType('Columns', undefined, {
                        isRow: 1,
                        numColumns: numCols,
                        takeFullWitdh: 1,
                    }),
                    children: emptyCols.map(_ =>
                        createBlockFromType('ContentOrRowPlaceholder', undefined, {outerBlockType: 'Columns'})
                    ),
                });
                //
                const newBlockDescriptor = {block: newRowBlock, isReusable: false, styles: null,};
                const targetBlockId = this.props.blockId;
                const targetTrid = 'main';
                const {insertPos, isReplace} = this.props;
                const wasCurrentlySelectedBlock = false;
                pushInserBlockOp(newBlockDescriptor, targetBlockId, targetTrid, insertPos, isReplace, wasCurrentlySelectedBlock);
                api.mainPopper.close();
                this.props.onAfterInsertedBlock(newRowBlock);
            } }
            type="button">
            { emptyCols.map(__ =>
                <span class="col-12"></span>)
            }
        </button>;
    }
}

/**
 * @typedef {{
 *   blockId: string;
 *   insertPos: dropPosition;
 *   isReplace: boolean;
 *   onAfterInsertedBlock: (newRowBlock: Block) => void;
 *   onCreateBlock?: (newRowBlock: Block) => Block;
 * }} RowPickerProps
 */

export default AddRowPopup;
export {RowPicker};
