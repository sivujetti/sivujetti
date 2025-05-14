import {
    __,
    api,
    Tabs,
} from '@sivujetti-commons-for-edit-app';
import {createBlockFromType} from '../../includes/block/utils.js';
import {pushInserBlockOp} from '../../menu-column/block/AddContentPopup.jsx';
import ContentTemplatePicker from '../../includes/ContentTemplatePicker.jsx';

/** @extends {preact.Component<{blockId: string; insertPos: dropPosition; isReplace: boolean; onAfterInsertedBlock: (newRowBlock: Block) => void;}, {currentTabIdx: number;}>} */
class AddRootSectionPopup extends preact.Component {
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
            <h6>{ __('Insert section') }</h6>
            <Tabs
                links={ [__('New section'), __('Add from library')] }
                onTabChanged={ this.handleTabChanged.bind(this) }
                initialTabIdx={ 0 }
                className="text-tinyish mt-0"/>
            { currentTabIdx === 0
                ? <div class="root-section-picker mt-1">
                    <button
                        class="btn btn no-color p-1 d-flex col-12"
                        onClick={ () => {
                            const newRootSectionBlock = {
                                ...createBlockFromType('RootSection'),
                                children: [
                                    createBlockFromType('ContentOrRowPlaceholder', undefined, {outerBlockType: 'RootSection'})
                                ],
                            };
                            //
                            const newBlockDescriptor = {block: newRootSectionBlock, isReusable: false, styles: null,};
                            const targetBlockId = this.props.blockId;
                            const targetTrid = 'main';
                            const wasCurrentlySelectedBlock = false;
                            pushInserBlockOp(newBlockDescriptor, targetBlockId, targetTrid, insertPos, isReplace, wasCurrentlySelectedBlock);
                            api.mainPopper.close();
                            this.props.onAfterInsertedBlock(newRootSectionBlock);
                        } }
                        style="height: initial"
                        type="button">
                        <span class="col-12 py-2">{ __('Regular') }</span>
                    </button>
                </div>
                : <ContentTemplatePicker
                    listOnly="root-sections"
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

export default AddRootSectionPopup;
