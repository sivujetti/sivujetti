import {
    __,
    api,
    blockTreeUtils,
    env,
    getAndPutAndGetToLocalStorage,
    isUndoOrRedo,
    objectUtils,
    putToLocalStorage,
    Tabs,
    timingUtils,
} from '@sivujetti-commons-for-edit-app';
import {getIsStoredToTreeIdFrom, isBrokenBlockId} from '../../includes/block/utils.js';
import {createInitialTabKind} from '../block-styles/style-tabs-commons.js';
import {pushBlockChanges} from './block-edit-funcs.js';
/** @typedef {import('../block-styles/style-tabs-commons.js').tabKind} tabKind */

/** @extends {preact.Component<BlockEditPopupProps, any>} */
class BlockEditPopup extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        const saveButton = api.saveButton.getInstance();
        this.blockType = api.blockTypes.get(this.props.block.type);
        this.blockIsStoredToTreeId = getIsStoredToTreeIdFrom(this.props.block.id, 'mainTree');
        if (!isBrokenBlockId(this.props.block.id)) {
            const editFormRenderer = this.blockType.editForm;
            this.editFormImpls = [
                ...(editFormRenderer ? [editFormRenderer] : []),
                ...(!this.blockType.extends ? [] : [api.blockTypes.get(this.blockType.extends).editForm])
            ];

            this.tabsInfo = [{kind: 'content', title: __('Content')}, {kind: 'styles', title: __('Styles')}];
            const tabKind = createInitialTabKind(
                getAndPutAndGetToLocalStorage('content', 'sivujettiLastBlockEditPopupTabKind'),
                this.tabsInfo
            );
            this.setState(createState(tabKind, objectUtils.cloneDeep(this.props.block)));
        } else {
            this.editFormImpls = [createMessageEditForm(__('This unique reusable content no longer appears to be available. You can delete it from the context menu.'))];
            this.tabsInfo = [{kind: 'content', title: __('Content')}, {kind: 'styles', title: __('Styles')}];
            this.setState({
                ...createState('content', objectUtils.cloneDeep(this.props.block)),
            });
        }

        const refreshBlockCopyForEditFormIfNeeded = (userCtx, ctx, flags, event, theTreeIn = null) => {
            const isIt = isUndoOrRedo(ctx);
            const doCheckDiffForEditForm = (
                (userCtx?.blockId === this.state.blockCopyForEditForm?.id) ||
                isIt
            );
            if (doCheckDiffForEditForm) {
                const theTree = theTreeIn || saveButton.getChannelState('theBlockTree');
                const [block, _branch, _parent, root] = doCheckDiffForEditForm && this.state.blockCopyForEditForm
                    ? blockTreeUtils.findBlockMultiTree(this.state.blockCopyForEditForm.id, theTree)
                    : [null, null, null, null];
                if (!block || this.state.blockCopyForEditForm.id !== block.id) return;
                if (JSON.stringify(this.state.blockCopyForEditForm.propsData) !== JSON.stringify(block.propsData) ||
                    this.state.blockCopyForEditForm.styleClasses !== block.styleClasses ||
                    this.state.blockCopyForEditForm.renderer !== block.renderer) {
                    this.blockIsStoredToTreeId = blockTreeUtils.getIdFor(root);
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
            refreshBlockCopyForEditFormIfNeeded(userCtx, ctx, flags, event, theTree);
            //
            this.closeInspectorPanelIfBlockIsDeletedOrReplaced(event, userCtx);
        }),

        saveButton.subscribeToChannel('globalBlockTrees', (_gbts, userCtx, ctx, flags) => {
            const event = userCtx?.event || '';
            refreshBlockCopyForEditFormIfNeeded(userCtx, ctx, flags, event, null);
            this.closeInspectorPanelIfBlockIsDeletedOrReplaced(event, userCtx);
        }),

        saveButton.subscribeToChannel('stylesBundle', (bundle, _userCtx, ctx) => {
            if (!doesTabContainStylesStuff(this.state.currentTabKind)) return;
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
     * @param {BlockEditPopupProps} props
     * @access protected
     */
    render(_, {currentTabKind, blockCopyForEditForm, lastBlockTreeChangeEventInfo}) {
        const blockId = blockCopyForEditForm.id;
        const {tabsInfo} = this;
        const hasMoreThat1Tab = tabsInfo.length > 1;
        return <div data-main>
            { hasMoreThat1Tab ? <Tabs
                links={ this.tabsInfo.map(({title}) => title) }
                getTabName={ (_, i) => tabsInfo[i].kind }
                onTabChanged={ (toIdx) => this.changeTab(this.tabsInfo[toIdx].kind) }
                className={ `text-tinyish mt-0${currentTabKind !== 'content' ? '' : ' mb-2'}` }
                initialTabIdx={ tabsInfo.findIndex(({kind}) => kind === currentTabKind) }/> : null }
            { tabsInfo.map(itm => {
                let content;
                if (itm.kind !== currentTabKind)
                    content = null;
                else if (itm.kind === 'content') {
                    content = this.editFormImpls.map(Renderer =>
                        <Renderer
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
                            key={ blockId }/>
                    );
                } else if (itm.kind === 'styles') {
                    content = <div>todo</div>;
                }
                return <div class={ itm.kind === currentTabKind ? '' : 'd-none' } key={ itm.kind }>
                    { content }
                </div>;
            }) }
        </div>;
    }
    /**
     * @param {tabKind} toKind
     * @access private
     */
    changeTab(toKind) {
        putToLocalStorage(toKind, 'sivujettiLastBlockEditPopupTabKind');
        const block = this.state.blockCopyForEditForm || objectUtils.cloneDeep(this.props.block);
        this.blockIsStoredToTreeId = getIsStoredToTreeIdFrom(block.id, 'mainTree');
        this.setState(createState(toKind, block));
    }
    /**
     * @param {{[key: string]: any;}} changes
     * @param {boolean} hasErrors = false
     * @param {blockPropValueChangeFlags} flags = null
     * @access private
     */
    handleValuesChanged(changes, hasErrors = false, flags = null) {
        if (this.state.currentTabKind.indexOf('content') < 0) return;

        pushBlockChanges(this.props.block.id, changes, flags);
    }
    /**
     * @param {string} event
     * @param {StateChangeUserContext} userCtx
     * @access private
     */
    closeInspectorPanelIfBlockIsDeletedOrReplaced(event, userCtx) {
        if ((event === 'delete' || event === 'replace-block') && userCtx.wasCurrentlySelectedBlock)
            this.props.inspectorPanel.close();
    }
}

/**
 * @param {preact.ComponentChildren} messageToShow
 * @returns {preact.ComponentClass}
 */
function createMessageEditForm(messageToShow) {
    return class extends preact.Component {
        /**
         * @access protected
         */
        render() {
            return <div class="pt-1">
                { messageToShow }
            </div>;
        }
    };
}

/**
 * @param {tabKind} newTabKind
 * @param {Object} block
 * @returns {Object}
 */
function createState(newTabKind, block) {
    return {
        currentTabKind: newTabKind,
        blockCopyForEditForm: block,
        ...(doesTabContainStylesStuff(newTabKind)
            ? {stylesStateId: api.saveButton.getInstance().getChannelState('stylesBundle')?.id}
            : {}
        )
    };
}

/**
 * @param {tabKind} tabKind
 * @returns {boolean}
 * @access private
 */
function doesTabContainStylesStuff(tabKind) {
    return tabKind.indexOf('styles') > -1;
}

/** @typedef {{
 *  block: Block;
 * }} BlockEditPopupProps */

export default BlockEditPopup;
