import {
    __,
    api,
    Tabs,
} from '@sivujetti-commons-for-edit-app';
import {createBlockFromType} from '../../includes/block/utils.js';
import ContentTemplatePicker from '../../includes/ContentTemplatePicker.jsx';
import {pushInserBlockOp} from '../../menu-column/block/AddContentPopup.jsx';

/** @extends {preact.Component<IncontextAddRowPopupProps, {currentTabIdx: number;}>} */
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
    render({blockId, insertPos, isReplace}, {currentTabIdx}) {
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
                    insertPos={ insertPos }
                    isReplace={ isReplace }
                    onAfterInsertedBlock={ this.props.onAfterInsertedBlock }/>
                : <ContentTemplatePicker
                    listOnly="rows"
                    blockId={ blockId }
                    insertPos={ insertPos }
                    isReplace={ isReplace }/>
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
        return <div class="mt1" style="min-width: 360px">
            <div class="row-picker d-grid mt-2" style="grid-template-columns: 1fr 1fr 1fr; gap: .2rem">
                { this.createAddRowButton2(1) }
                { this.createAddRowButton2(2) }
                { this.createAddRowButton2(3) }

                { this.createAddRowButton2(4) }
                { this.createAddRowButton2(5) }
                { this.createAddRowButton2(6) }

                { this.createAddRowButton2('2-3/5') }
                { this.createAddRowButton2('3-2/5') }
                { this.createAddRowButton2('2-4/6') }

                { this.createAddRowButton2('4-2/6') }
                { this.createAddRowButton2('1-3/4') }
                { this.createAddRowButton2('3-1/4') }

                { this.createAddRowButton2('1-2-1/4') }
                { this.createAddRowButton2('1-3-1/5') }
                { this.createAddRowButton2('1-1-2/4') }

                { this.createAddRowButton2('2-1-1/4') }
                { this.createAddRowButton2('1-1-3/5') }
                { this.createAddRowButton2('3-1-1/5') }

                { this.createAddRowButton2('1-1-1-3/6') }
                { this.createAddRowButton2('3-1-1-1/6') }
            </div>
        </div>;
    }
    /**
     * @param {string|number} colsTot
     * @returns {preact.VNode}
     * @access private
     */
    createAddRowButton2(colsTot) {
        let colsCls;
        let emptyCols;
        let numColumns;
        let attrs;
        if (typeof colsTot === 'number') {
            numColumns = colsTot;
            emptyCols = [...Array(numColumns)];
            colsCls = ` cols-${numColumns}`;
        } else {
            const cols = colsTot.split('/')[0];
            numColumns = parseInt(cols.replaceAll('-', ''), 10);
            emptyCols = [...Array(cols.split('-').length)];
            colsCls = ` cols-${cols}`;
            attrs = {title: colsTot};
        }
        return <button
            class={ `btn btn no-color d-grid p-1 ${colsCls}` }
            onClick={ () => {
                const onCreate = this.props.onCreateBlock || (b => b);
                const newRowBlock = onCreate({
                    ...createBlockFromType('Columns', undefined, {
                        isRow: 1,
                        numColumns,
                        takeFullWidh: 1,
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
            type="button"
            { ...attrs }>
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
 *   onAfterInsertedBlock: (newBlock: Block) => void;
 *   onCreateBlock?: (newBlock: Block) => Block;
 * }} IncontextAddRowPopupProps
 */

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
