import {
    __,
    api,
    blockTreeUtils,
    env,
    isUndoOrRedo,
    objectUtils,
    Tabs,
    timingUtils,
} from '@sivujetti-commons-for-edit-app';
import {isBrokenBlockId} from '../../includes/block/utils.js';
import AutoBlockEditForm, {isRootSectionOrRow} from '../../includes/AutoBlockEditForm.jsx';
import {pushBlockChanges} from '../../menu-column/block/block-edit-funcs.js';
import {createIsChunkStyleEnabledChecker} from '../../menu-column/block/BlockEditForm.jsx'; // siirrä block-edit-fundiin?
import CustomClassStylesList from '../../menu-column/block-styles/CustomClassStylesList.jsx';

/** @extends {preact.Component<BlockEditPopupProps, BlockEditPopupState>} */
class BlockEditPopup extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        const {block} = this.props;
        const blockType = api.blockTypes.get(block.type);
        this.isRootSectionOrRow = isRootSectionOrRow(block);
        this.includeVisualStylesTab = this.isRootSectionOrRow || blockType.editForm.prototype instanceof AutoBlockEditForm;
        /** @type {Array<{kind: tabKind2; title: string;}>} */
        this.tabsInfo = [
            {kind: 'content', title: __('Content')},
            // @ts-ignore Type 'string' is not assignable to type 'tabKind2'
            ...(this.includeVisualStylesTab ? [{kind: 'visual-styles', title: __('Styles')}] : []),
            // @ts-ignore
            ...(api.user.can('editBlockCss') ? [{kind: 'css-styles', title: __('Css')}] : []),
        ];
        const saveButton = api.saveButton.getInstance();
        if (!isBrokenBlockId(block.id)) {
            this.editFormImpl = !this.isRootSectionOrRow ? blockType.editForm : AutoBlockEditForm;
            this.setState({
                blockCopyForEditForm: objectUtils.cloneDeep(block),
                currentTabKind: this.tabsInfo[0].kind,
                stylesStateId: saveButton.getChannelState('stylesBundle').id,
            });
        } else {
            // todo
        }
        const refreshBlockCopyForEditFormIfNeeded = (userCtx, ctx, flags, theTreeIn = null) => {
            const isIt = isUndoOrRedo(ctx);
            const doCheckDiffForEditForm = (
                (userCtx?.blockId === this.state.blockCopyForEditForm?.id) ||
                isIt
            );
            if (doCheckDiffForEditForm) {
                const theTree = theTreeIn || blockTreeUtils.getMainTree(saveButton);
                const block = doCheckDiffForEditForm && this.state.blockCopyForEditForm
                    ? blockTreeUtils.findBlockMultiTree(this.state.blockCopyForEditForm.id, theTree)[0]
                    : null;
                if (!block || this.state.blockCopyForEditForm.id !== block.id) return;
                if (JSON.stringify(this.state.blockCopyForEditForm.propsData) !== JSON.stringify(block.propsData) ||
                    this.state.blockCopyForEditForm.styleClasses !== block.styleClasses ||
                    this.state.blockCopyForEditForm.renderer !== block.renderer) {
                    this.setState({
                        blockCopyForEditForm: objectUtils.cloneDeep(block),
                        lastBlockTreeChangeEventInfo: {ctx, flags, isUndoOrRedo: isIt},
                    });
                }
            }
        };
        this.unregistrables = [saveButton.subscribeToChannel('theBlockTree', (theTree, userCtx, ctx, flags) => {
            const event = userCtx?.event || '';
            if (event === 'convert-branch-to-global-block-reference-block') {
                api.inspectorPanel.close();
                return;
            }
            //
            refreshBlockCopyForEditFormIfNeeded(userCtx, ctx, flags, theTree);
            //
            closeFloatingDialogIfBlockIsDeletedOrReplaced(event, userCtx);
        }),

        saveButton.subscribeToChannel('stylesBundle', (bundle, _userCtx, ctx) => {
            if (!this.includeVisualStylesTab) return;
            if (ctx === 'initial') return;
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
     * @param {BlockEditPopupProps} _
     * @param {BlockEditPopupState} state
     * @access protected
     */
    render(_, {blockCopyForEditForm, currentTabKind, stylesStateId, lastBlockTreeChangeEventInfo}) {
        const EditForm = this.editFormImpl;
        let content = null;
        if (currentTabKind === 'content' || currentTabKind === 'visual-styles')
            // @ts-ignore Property 'propGroup' is optional ...
            content = <EditForm
                block={ blockCopyForEditForm }
                nthOfBlockId={ 1 }
                lastBlockTreeChangeEventInfo={ lastBlockTreeChangeEventInfo }
                emitValueChanged={ (val, key, ...varargs) => { this.handleValuesChanged({[key]: val}, ...varargs); } }
                emitValueChangedThrottled={ (val, key, hasErrors = false, source = null) => {
                    if (!this.emitValuesChangeThrottled)
                        this.emitValuesChangeThrottled = timingUtils.debounce(changes => {
                            this.handleValuesChanged(changes, false, null);
                        }, env.normalTypingDebounceMillis);

                    if (!isUndoOrRedo(source)) {
                        if (hasErrors) { env.window.console.error('Had error, skipping'); return; }
                        const changes = {[key]: val};
                        // Emit "fast"/mergeable op
                        this.handleValuesChanged(changes, false, 'is-throttled');
                        // Call throttled func, which emits the "slow"/commit op
                        this.emitValuesChangeThrottled(changes);
                    }
                } }
                emitManyValuesChanged={ this.handleValuesChanged.bind(this) }
                key={ blockCopyForEditForm.id }
                { ...(this.includeVisualStylesTab
                    ? {
                        propGroup: currentTabKind === 'content' ? 'contentTab' : 'visualStylesTab',
                        stylesStateId,
                    }
                    : {}) }/>;
        else if (currentTabKind === 'css-styles')
            content = <CustomClassStylesList
                blockId={ blockCopyForEditForm.id }
                blockTypeName={ blockCopyForEditForm.type }
                checkIsChunkActive={ createIsChunkStyleEnabledChecker(blockCopyForEditForm.styleClasses) }
                stylesStateId={ stylesStateId }
                styleClasses={ blockCopyForEditForm.styleClasses }/>;
        //
        return <div>
            { this.tabsInfo.length > 1 ?
                <Tabs
                    links={ this.tabsInfo.map(({title}) => title) }
                    getTabName={ (_, i) => this.tabsInfo[i].kind }
                    onTabChanged={ (toIdx) => this.setState({currentTabKind: this.tabsInfo[toIdx].kind}) }
                    className="text-tinyish mt-0"/>
                : null
            }
            { content }
        </div>;
    }
    /**
     * @param {{[key: string]: any;}} changes
     * @param {boolean} _hasErrors = false
     * @param {blockPropValueChangeFlags} flags = null
     * @access private
     */
    handleValuesChanged(changes, _hasErrors = false, flags = null) {
        if (this.state.currentTabKind.indexOf('content') < 0) return;

        pushBlockChanges(this.props.block.id, changes, flags);
    }
}

/**
 * @param {string} event
 * @param {StateChangeUserContext} userCtx
 */
function closeFloatingDialogIfBlockIsDeletedOrReplaced(event, userCtx) {
    if ((event === 'delete' || event === 'replace-block') && userCtx.wasCurrentlySelectedBlock)
        api.floatingDialog2.close();
}

/** @typedef {{
 *   block: Block;
 * }} BlockEditPopupProps */

/** @typedef {{
 *   blockCopyForEditForm: BlockProto;
 *   currentTabKind: tabKind2;
 *   lastBlockTreeChangeEventInfo?: {ctx: stateChangeContext; flags: blockPropValueChangeFlags; isUndoOrRedo: boolean;};
 *   stylesStateId: number;
 * }} BlockEditPopupState */

/**
 * @typedef {'content'|'visual-styles'|'css-styles'} tabKind2
 */

export default BlockEditPopup;
