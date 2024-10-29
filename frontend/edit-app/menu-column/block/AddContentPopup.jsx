import {
    __,
    api,
    scssWizard,
    Tabs,
} from '@sivujetti-commons-for-edit-app';
import {createBlockTreeInsertOrReplaceAtOp, getRealTarget} from '../../includes/block/tree-dnd-controller-funcs.js';
import {
    AddReusableContentTab,
    AddSimpleContentBlocksTab,
    AddTemplateContentTab,
} from './add-content-popup-tabs.jsx';

/** @extends {preact.Component<AddContentPopupProps, any>} */
class AddContentPopup extends preact.Component {
    // initialTabIdx;
    /**
     * @access protected
     */
    componentWillMount() {
        this.initialTabIdx = 1;
        this.setState({currentTabIdx: this.initialTabIdx});
    }
    /**
     * @access protected
     */
    render(_, {currentTabIdx}) {
        return <div class="pb-1">
            <Tabs
                links={ [__('Stored'), __('Blocks'), __('Templates')] }
                onTabChanged={ this.handleTabChanged.bind(this) }
                initialTabIdx={ this.initialTabIdx }
                className="text-tinyish mt-0"/>
            { (() => {
                if (currentTabIdx === 0)
                    return <AddReusableContentTab
                        onContentPicked={ this.handleContentPicked.bind(this) }/>;
                if (currentTabIdx === 1)
                    return <AddSimpleContentBlocksTab
                        onContentPicked={ this.handleContentPicked.bind(this) }/>;
                if (currentTabIdx === 2)
                    return <AddTemplateContentTab
                        getIsInsertAfterOrBeforeRootLevelBlock={ () => {
                            if (this.props.insertPos === 'as-child' && !this.props.isReplace) // Not after|before
                                return false;
                            const [trid, blockId] = getRealTarget(this.props.targetInfo);
                            if (trid !== 'main') // Inner gbt block, can't be a root level block
                                return false;
                            const block = api.saveButton.getInstance().getChannelState('theBlockTree').find(({id}) => id === blockId);
                            const isRootLevel = !!block;
                            return isRootLevel;
                        } }
                        onContentPicked={ this.handleContentPicked.bind(this) }/>;
            })() }
        </div>;
    }
    /**
     * @param {SpawnDescriptor} descr
     * @access private
     */
    handleContentPicked(descr) {
        const {targetInfo, insertPos, isReplace, wasCurrentlySelectedBlock} = this.props;
        const insertOrReplaceBlockOp = createBlockTreeInsertOrReplaceAtOp(descr.block, targetInfo,
            insertPos, isReplace, wasCurrentlySelectedBlock);
        if (!descr.styles?.length) {
            api.saveButton.getInstance().pushOp(...insertOrReplaceBlockOp);
        } else {
            const updatedAll = scssWizard.addManyNewChunksAndReturnAllRecompiled(descr.styles);
            api.saveButton.getInstance().pushOpGroup(
                insertOrReplaceBlockOp,
                ['stylesBundle', updatedAll]
            );
        }
        api.mainPopper.close();
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

/**
 * @typedef {{
 *   targetInfo: BlockDescriptor;
 *   insertPos: dropPosition;
 *   isReplace: boolean;
 *   wasCurrentlySelectedBlock: boolean;
 * }} AddContentPopupProps
 *
 * @typedef {string} blockTypeName
 */

export default AddContentPopup;
