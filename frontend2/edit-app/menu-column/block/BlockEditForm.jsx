import {
    __,
    api,
    blockTreeUtils,
    env,
    getAndPutAndGetToLocalStorage,
    Icon,
    isUndoOrRedo,
    objectUtils,
    putToLocalStorage,
    Tabs,
    timingUtils,
    writeBlockProps,
} from '@sivujetti-commons-for-edit-app';
import {getIsStoredToTreeIdFrom, isMetaBlock} from '../../includes/block/utils.js';
import CodeBasedStylesList from '../block-styles/CodeBasedStylesTab.jsx';

const Tab1Text = __('Content');
const Tab2Text = __('Styles');
const Tab3Text = __('Styles (code)');

class BlockEditForm extends preact.Component {
    // blockCopyForEditForm;
// --     // userCanEditVisualStyles;
    // userCanEditCss;
// --     // useVisualStyles;
    // blockType;
// --     // blockIsStoredToTreeId;
    // editFormImpls;
    // stylesEditForm;
// --     // allowStylesEditing;
    // unregistrables;
    /**
     * @access protected
     */
    componentWillMount() {
// --         this.userCanEditVisualStyles = api.user.can('editBlockStylesVisually');
        this.userCanEditCss = api.user.can('editBlockCss');
// --         this.useVisualStyles = !this.userCanEditCss && this.userCanEditVisualStyles;
        this.blockType = api.blockTypes.get(this.props.block.type);
        this.blockIsStoredToTreeId = getIsStoredToTreeIdFrom(this.props.block.id, 'mainTree');
        this.editFormImpls = [
            this.blockType.editForm,
            ...(!this.blockType.extends ? [] : [api.blockTypes.get(this.blockType.extends).editForm])
        ];
        this.stylesEditForm = this.blockType.stylesEditForm || 'DefaultWidgetBasedStylesEditForm';
// --         this.allowStylesEditing = !selectCurrentPageDataBundle(store.getState()).page.isPlaceholderPage;
        const currentTabIdx = this.getLargestAllowedTabIdx(parseInt(getAndPutAndGetToLocalStorage('0', 'sivujettiLastBlockEditFormTabIdx'), 10));

        this.setState({
            currentTabIdx,
            ...this.createStylesState(currentTabIdx, api.saveButton.getInstance().getChannelState('stylesBundle')?.id),
            blockCopyForEditForm: objectUtils.cloneDeep(this.props.block),
        });

        this.unregistrables = [api.saveButton.getInstance().subscribeToChannel('theBlockTree', (theTree, userCtx, ctx, flags) => {
            const event = userCtx?.event || '';
            if (event === 'convert-branch-to-global-block-reference-block') {
                api.inspectorPanel.close();
                return;
            }
            //
            const doCheckDiffForEditForm = (
                (event === 'update-single-block-prop' && userCtx?.blockId === this.state.blockCopyForEditForm.id) ||
                ctx === 'undo'
            );
            if (doCheckDiffForEditForm) {
                const block = doCheckDiffForEditForm ? blockTreeUtils.findBlockSmart(this.state.blockCopyForEditForm.id, theTree)[0] : null;
                if (!block || this.state.blockCopyForEditForm.id !== block.id) return;
                if (JSON.stringify(this.state.blockCopyForEditForm.propsData) !== JSON.stringify(block.propsData)) {
                    this.setState({blockCopyForEditForm: objectUtils.cloneDeep(block), lastBlockTreeChangeEventInfo: {ctx, flags}});
                }
            }
            //
            if (event === 'delete') { // todo
                // const [id, _blockIsStoredToTreeId, isChildOfOrCurrentlyOpenBlock] = data;
                // if (isChildOfOrCurrentlyOpenBlock || id === block.id) this.props.inspectorPanel.close();
            }
        }),

        api.saveButton.getInstance().subscribeToChannel('stylesBundle', (bundle, userCtx, ctx) => {
            const doesIt = this.doesCurrentTabContainStylesStuff(this.state.currentTabIdx);
            if (!doesIt) return;
            if (ctx === 'initial') return;
            // if chnanged?
            this.setState({stylesStateId: bundle.id});
        })];
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unregistrables.forEach(unreg => unreg());
    }
    /**
     * @param {{block: RawBlock; inspectorPanel: preact.Component;}} props
     * @access protected
     */
    render({block}, {currentTabIdx, blockCopyForEditForm, lastBlockTreeChangeEventInfo}) {
        const isMeta = isMetaBlock(block);
        const typeid = isMeta ? ' page-info-block' : this.blockIsStoredToTreeId === 'main' ? '' : ' global-block-tree-block';
        const StylesEditFormCls = this.stylesEditForm;
        return <div data-main>
            <div class={ `with-icon pb-1${typeid}` }>
                <Icon iconId={ api.blockTypes.getIconId(this.blockType) } className="size-xs mr-1"/>
                { __(block.title || this.blockType.friendlyName) }
            </div>
            <Tabs
                links={ [...[Tab1Text, Tab2Text], ...(this.userCanEditCss && !isMeta ? [Tab3Text] : [])] }
                getTabName={ link => ({
                    [Tab1Text]: 'content',
                    [Tab2Text]: 'user-styles',
                    [Tab3Text]: 'dev-styles'
                }[link]) }
                onTabChanged={ this.changeTab.bind(this) }
                className="text-tinyish mt-0 mb-2"
                initialIndex={ currentTabIdx }/>
            { currentTabIdx === 0
                ? <div class={ currentTabIdx === 0 ? 'mt-2' : 'd-none' }>
                    { this.editFormImpls.map(EditFormImpl =>
                        <EditFormImpl
                            block={ blockCopyForEditForm }
                            lastBlockTreeChangeEventInfo={ lastBlockTreeChangeEventInfo }
                            emitValueChanged={ (val, key, ...varargs) => { this.handleValueValuesChanged({[key]: val}, ...varargs); } }
                            emitValueChangedThrottled={ (val, key, hasErrors = false, source = null) => {
                                if (!this.emitValuesChangeThrottled)
                                    this.emitValuesChangeThrottled = timingUtils.debounce(changes => {
                                        this.handleValueValuesChanged(changes, false, null);
                                    }, env.normalTypingDebounceMillis);

                                if (!isUndoOrRedo(source)) {
                                    if (hasErrors) throw new Error('todo');
                                    const changes = {[key]: val};
                                    // Emit "fast"/mergeable op
                                    this.handleValueValuesChanged(changes, false, 'is-throttled');
                                    // Call throttled func, which emits the "slow"/commit op
                                    this.emitValuesChangeThrottled(changes);
                                }
                            } }
                            emitManyValuesChanged={ this.handleValueValuesChanged.bind(this) }
                            key={ block.id }
                            { ...(block.type !== 'Section2' ? {} : {stylesStateId: this.state.stylesStateId}) }/>)
                    }
                </div>
                : null }
            { currentTabIdx === 1
                ? block.type !== 'Section2'
                    ? <div class={ `block-styles-tab-content${currentTabIdx === 1 ? '' : ' d-none'}` }>
                        <StylesEditFormCls
                            blockId={ blockCopyForEditForm.id }
                            stateId={ this.state.stylesStateId }/>
                    </div>
                    : '?'
                : null }
            { currentTabIdx === 2
                ? <div class={ `block-styles-tab-content${currentTabIdx === 2 ? '' : ' d-none'}` }>
                    <CodeBasedStylesList
                        stylesStateId={ this.state.stylesStateId }
                        blockId={ blockCopyForEditForm.id }/>
                </div>
                : null }
        </div>;
    }
    /**
     * @param {Number} toIdx
     * @access private
     */
    changeTab(toIdx) {
        putToLocalStorage(toIdx.toString(), 'sivujettiLastBlockEditFormTabIdx');
        this.setState({
            ...{currentTabIdx: toIdx},
            ...this.createStylesState(toIdx, this.state.stylesStateId)
        });
    }
    /**
     * @param {{[key: String]: any;}} changes
     * @param {Boolean} hasErrors = false
     * @param {blockPropValueChangeFlags} flags = null
     * @access public
     */
    handleValueValuesChanged(changes, hasErrors = false, flags = null) {
        if (this.state.currentTabIdx > 0) return;

        const saveButton = api.saveButton.getInstance();
        const blockId = this.props.block.id;
        saveButton.pushOp(
            'theBlockTree',
            blockTreeUtils.createMutation(saveButton.getChannelState('theBlockTree'), newTreeCopy => {
                const [blockRef] = blockTreeUtils.findBlockSmart(blockId, newTreeCopy);
                /*
                Note: this mutates block from 1. (main/root tree)
                [
                    <mainTreeBlock1>,
                    <mainTreeBlock2> <------------------- here (main/root tree)
                ], or 2. (embedded global block tree)
                [
                    <mainTreeBlock1>,
                    <mainTreeBlock2>,
                    <mainTreeBlockThatIsGbtReference __globalBlockTree: [
                        <gbtBlock1>,
                        <gbtBlock2>, <------------------- here
                    ]>
                ]*/
                writeBlockProps(blockRef, changes);
                return newTreeCopy;
            }),
            {event: 'update-single-block-prop', blockId},
            flags
        );
    }
    /**
     * @param {Number} savedIdx
     * @returns {Number}
     * @access private
     */
    getLargestAllowedTabIdx(savedIdx) {
        if (savedIdx > 1 && !this.userCanEditCss)
            return 1;
        return savedIdx;
    }
    /**
     * @param {Number} currentTabIdx
     * @param {Number} stylesStateId
     * @returns {Boolean}
     * @access private
     */
    createStylesState(currentTabIdx, stylesStateId) {
        if (this.doesCurrentTabContainStylesStuff(currentTabIdx))
            return {stylesStateId: stylesStateId};
    }
    /**
     * @param {Number} currentTabIdx
     * @returns {Boolean}
     * @access private
     */
    doesCurrentTabContainStylesStuff(currentTabIdx) {
        return currentTabIdx >= 1 || (currentTabIdx === 0 && this.props.block.type === 'Columns2');
    }
}

export default BlockEditForm;
