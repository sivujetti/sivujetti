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
import {createInitialTabKind, createTabsInfo} from '../block-styles/style-tabs-commons.js';
/** @typedef {import('../block-styles/style-tabs-commons.js').tabKind} tabKind */

class BlockEditForm extends preact.Component {
    // blockType;
    // blockIsStoredToTreeId;
    // editFormImpls;
    // stylesEditForm;
    // tabsInfo;
    // unregistrables;
    /**
     * @access protected
     */
    componentWillMount() {
        const saveButton = api.saveButton.getInstance();
        this.blockType = api.blockTypes.get(this.props.block.type);
        this.blockIsStoredToTreeId = getIsStoredToTreeIdFrom(this.props.block.id, 'mainTree');
        this.editFormImpls = [
            createBlockEditFormCfg(this.blockType),
            ...(!this.blockType.extends ? [] : [createBlockEditFormCfg(api.blockTypes.get(this.blockType.extends))])
        ];
        this.stylesEditForm = this.blockType.stylesEditForm;

        this.tabsInfo = createTabsInfo(createTabConfig(this.blockType.editFormType, !!this.stylesEditForm));
        const currentTabKind = createInitialTabKind(
            getAndPutAndGetToLocalStorage('content', 'sivujettiLastBlockEditFormTabKind'),
            this.tabsInfo
        );
        this.setState(createState(currentTabKind, this.props.block));

        this.unregistrables = [saveButton.subscribeToChannel('theBlockTree', (theTree, userCtx, ctx, flags) => {
            const event = userCtx?.event || '';
            if (event === 'convert-branch-to-global-block-reference-block') {
                api.inspectorPanel.close();
                return;
            }
            //
            const isIt = isUndoOrRedo(ctx);
            const doCheckDiffForEditForm = (
                (event === 'update-single-block-prop' && userCtx?.blockId === this.state.blockCopyForEditForm?.id) ||
                isIt
            );
            if (doCheckDiffForEditForm) {
                const block = doCheckDiffForEditForm && this.state.blockCopyForEditForm
                    ? blockTreeUtils.findBlockMultiTree(this.state.blockCopyForEditForm.id, theTree)[0]
                    : null;
                if (!block || this.state.blockCopyForEditForm.id !== block.id) return;
                if (JSON.stringify(this.state.blockCopyForEditForm.propsData) !== JSON.stringify(block.propsData) ||
                    this.state.blockCopyForEditForm.styleGroup !== block.styleGroup ||
                    this.state.blockCopyForEditForm.styleClasses !== block.styleClasses) {
                    this.setState({
                        blockCopyForEditForm: objectUtils.cloneDeep(block),
                        lastBlockTreeChangeEventInfo: {ctx, flags, isUndoOrRedo: isIt}
                    });
                }
            }
            //
            if (event === 'delete') {
                const {wasCurrentlySelectedBlock} = userCtx || {};
                if (wasCurrentlySelectedBlock) this.props.inspectorPanel.close();
            }
        }),

        saveButton.subscribeToChannel('stylesBundle', (bundle, userCtx, ctx) => {
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
     * @param {{block: Block; inspectorPanel: preact.Component;}} props
     * @access protected
     */
    render(_, {currentTabKind, blockCopyForEditForm, lastBlockTreeChangeEventInfo}) {
        const blockId = blockCopyForEditForm.id;
        const isMeta = isMetaBlock(blockCopyForEditForm);
        const typeid = isMeta ? ' page-info-block' : this.blockIsStoredToTreeId === 'main' ? '' : ' global-block-tree-block';
        const {tabsInfo} = this;
        const hasMoreThat1Tab = tabsInfo.length > 1;
        return <div data-main>
            <div class={ `with-icon${typeid} ${hasMoreThat1Tab ? 'pb-1' : 'pb-2 mb-1'}` }>
                <Icon iconId={ api.blockTypes.getIconId(this.blockType) } className="size-xs mr-1"/>
                { __(blockCopyForEditForm.title || this.blockType.friendlyName) }
            </div>
            { hasMoreThat1Tab ? <Tabs
                links={ tabsInfo.map(itm => itm.title) }
                getTabName={ (_, i) => tabsInfo[i].kind }
                onTabChanged={ (toIdx) => this.changeTab(this.tabsInfo[toIdx].kind) }
                className={ `text-tinyish mt-0${currentTabKind !== 'content' ? '' : ' mb-2'}` }
                initialIndex={ tabsInfo.findIndex(({kind}) => kind === currentTabKind) }/> : null }
            { tabsInfo.map(itm => {
                let content;
                if (itm.kind !== currentTabKind)
                    content = null;
                else if (itm.kind === 'content' || itm.kind === 'content+user-styles') {
                    content = this.editFormImpls.map(({Renderer, type}) =>
                        <Renderer
                            block={ blockCopyForEditForm }
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
                            key={ blockId }
                            { ...(type !== 'content+user-styles'
                                ? {}
                                : {stylesStateId: this.state.stylesStateId, blockId: blockId}
                            ) }/>
                    );
                } else if (itm.kind === 'user-styles') {
                    const StylesEditFormCls = this.stylesEditForm;
                    content = <StylesEditFormCls
                        blockId={ blockId }
                        blockStyleGroup={ blockCopyForEditForm.styleGroup }
                        stateId={ this.state.stylesStateId }/>;
                } else if (itm.kind === 'dev-styles') {
                    content = <CodeBasedStylesList
                        stylesStateId={ this.state.stylesStateId }
                        blockId={ block.id }/>;
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
        putToLocalStorage(toKind, 'sivujettiLastBlockEditFormTabKind');
        this.setState(createState(toKind, this.props.block));
    }
    /**
     * @param {{[key: String]: any;}} changes
     * @param {Boolean} hasErrors = false
     * @param {blockPropValueChangeFlags} flags = null
     * @access public
     */
    handleValuesChanged(changes, hasErrors = false, flags = null) {
        if (this.state.currentTabKind.indexOf('content') < 0) return;

        const saveButton = api.saveButton.getInstance();
        const blockId = this.props.block.id;
        saveButton.pushOp(
            'theBlockTree',
            blockTreeUtils.createMutation(saveButton.getChannelState('theBlockTree'), newTreeCopy => {
                const [blockRef] = blockTreeUtils.findBlockMultiTree(blockId, newTreeCopy);
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
}

/**
 * @param {editFormType} editFormType
 * @param {Boolean} hasStylesForm
 * @returns {Array<{kind: tabKind;}>}
 */
function createTabConfig(editFormType, hasStylesForm) {
    if (editFormType === 'content+user-styles')
        return [
            {kind: 'content+user-styles'},
            {kind: 'dev-styles'}
        ];
    if (hasStylesForm)
        return [
            {kind: 'content'},
            {kind: 'user-styles'},
            {kind: 'dev-styles'},
        ];
    return [
        {kind: 'content'}
    ];
}

/**
 * @param {tabKind} newTabKind
 * @param {Object} thisPropsBlock
 * @returns {Object}
 */
function createState(newTabKind, thisPropsBlock) {
    const  out =  {
        currentTabKind: newTabKind,
        blockCopyForEditForm: objectUtils.cloneDeep(thisPropsBlock),
        ...(doesTabContainStylesStuff(newTabKind)
            ? {stylesStateId: api.saveButton.getInstance().getChannelState('stylesBundle')?.id}
            : {}
        )
    };
    return out;
}

/**
 * @param {tabKind} tabKind
 * @returns {Boolean}
 * @access private
 */
function doesTabContainStylesStuff(tabKind) {
    return tabKind.indexOf('styles') > -1;
}

/**
 * @param {BlockTypeDefinition} input
 * @returns {Renderer: preact.Component; type: 'content'|'content+user-styles';}
 */
function createBlockEditFormCfg(input) {
    return {
        Renderer: input.editForm,
        type: input.editFormType || 'content'
    };
}

export default BlockEditForm;
