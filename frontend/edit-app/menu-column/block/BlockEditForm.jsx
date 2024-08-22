import {
    __,
    api,
    blockTreeUtils,
    DefaultStyleCustomizatorForm,
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
import CustomClassStylesList, {extractClassName} from '../block-styles/CustomClassStylesList.jsx';
import StyleClassesPicker from '../block-styles/StyleClassesPicker.jsx';
import {createInitialTabKind, createTabsInfo} from '../block-styles/style-tabs-commons.js';
/** @typedef {import('../block-styles/style-tabs-commons.js').tabKind} tabKind */
/** @typedef {import('../block-styles/style-tabs-commons.js').TabInfo} TabInfo */

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
        const editFormRenderer = this.blockType.editForm;
        this.editFormImpls = [
            ...(editFormRenderer ? [editFormRenderer] : []),
            ...(!this.blockType.extends ? [] : [api.blockTypes.get(this.blockType.extends).editForm])
        ];
        this.userCanEditScss = api.user.can('editBlockCss');
        this.stylesEditForm = this.blockType.stylesEditForm !== 'default'
            ? this.blockType.stylesEditForm
            : DefaultStyleCustomizatorForm;

        const [tabs, blockHasCustomizableStyles] = this.createTabsInfo();
        this.tabsInfo = tabs;
        const tabKind = createInitialTabKind(
            getAndPutAndGetToLocalStorage('content', 'sivujettiLastBlockEditFormTabKind'),
            this.tabsInfo
        );
        this.setState({
            blockHasCustomizableStyles,
            ...createState(tabKind, objectUtils.cloneDeep(this.props.block)),
        });

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
                    this.state.blockCopyForEditForm.styleClasses !== block.styleClasses) {
                    this.blockIsStoredToTreeId = getIsStoredToTreeIdFrom(block.id, theTree);
                    this.setState({
                        blockCopyForEditForm: objectUtils.cloneDeep(block),
                        lastBlockTreeChangeEventInfo: {ctx, flags, isUndoOrRedo: isIt},
                        blockHasCustomizableStyles: this.state.blockCopyForEditForm.styleClasses !== block.styleClasses || isIt
                            ? getUserStyleTabHasContent(block, this.tabsInfo)
                            : this.state.blockHasCustomizableStyles,
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
            this.setState({stylesStateId: bundle.id, blockHasCustomizableStyles: getUserStyleTabHasContent(this.state.blockCopyForEditForm, this.tabsInfo)});
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
    render(_, {currentTabKind, blockCopyForEditForm, lastBlockTreeChangeEventInfo, blockHasCustomizableStyles}) {
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
                links={ tabsInfo.map(itm => [
                    itm.title.split('(')[0],
                    itm.kind === 'dev-styles'
                        ? <Icon iconId="settings" className="size-xs ml-1 color-dimmed3"/>
                        : itm.kind === 'user-styles'
                            ? <Icon iconId="palette" className={ `size-xs ml-1 color-pink${blockHasCustomizableStyles ? '' : ' color-saturated2'}` }/>
                            : null,
                ]) }
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
                } else if (itm.kind === 'user-styles') {
                    const Renderer = this.userCanEditScss && !blockHasCustomizableStyles ? NoContentStyleCustomizationsEditForm : this.stylesEditForm;
                    content = <Renderer
                        blockId={ blockId }
                        blockType={ this.blockType }
                        blockIsStoredToTreeId={ this.blockIsStoredToTreeId }
                        checkIsChunkActive={ createIsChunkStyleEnabledChecker(blockCopyForEditForm.styleClasses) }
                        stylesStateId={ this.state.stylesStateId }
                        styleClasses={ blockCopyForEditForm.styleClasses }/>;
                } else if (itm.kind === 'dev-styles') {
                    content = [
                        <CustomClassStylesList
                            blockId={ blockId }
                            blockTypeName={ this.blockType.name }
                            checkIsChunkActive={ createIsChunkStyleEnabledChecker(blockCopyForEditForm.styleClasses) }
                            stylesStateId={ this.state.stylesStateId }
                            styleClasses={ blockCopyForEditForm.styleClasses }/>,
                        <StyleClassesPicker
                            currentClasses={ blockCopyForEditForm.styleClasses }
                            onClassesChanged={ newClasses => {
                                const saveButton = api.saveButton.getInstance();
                                saveButton.pushOp(
                                    'theBlockTree',
                                    blockTreeUtils.createMutation(saveButton.getChannelState('theBlockTree'), newTreeCopy => {
                                        const [blockRef] = blockTreeUtils.findBlockMultiTree(blockId, newTreeCopy);
                                        blockRef.styleClasses = newClasses;
                                        return newTreeCopy;
                                    }),
                                    {event: 'update-single-block-prop', blockId},
                                );
                            } }/>
                    ];
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
        const block = this.state.blockCopyForEditForm || objectUtils.cloneDeep(this.props.block);
        this.blockIsStoredToTreeId = getIsStoredToTreeIdFrom(block.id, 'mainTree');
        this.setState(createState(toKind, block));
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
    /**
     * @returns {[Array<TabInfo>, boolean]}
     */
    createTabsInfo() {
        let tabs = createTabsInfo(this.userCanEditScss ? [
            ...(this.editFormImpls.length ? [{kind: 'content'}] : []),
            ...(this.blockType.name !== 'PageInfo' ? [
                {kind: 'dev-styles'},
                {kind: 'user-styles'},
            ] : []),
        ] : [
            ...(this.editFormImpls.length ? [{kind: 'content'}] : []),
            ...(this.stylesEditForm ? [{kind: 'user-styles'}] : []),
        ]);

        const blockHasCustomizableStyles = getUserStyleTabHasContent(this.props.block, tabs);

        if (!this.userCanEditScss) {
            if (!blockHasCustomizableStyles && tabs.some(({kind}) => kind === 'user-styles')) {
                tabs = tabs.filter(({kind}) => kind !== 'user-styles');
            }
            if (!tabs.length) {
                this.editFormImpls = [NoContentBlockEditForm];
                tabs = createTabsInfo([{kind: 'content'}]);
            }
        }

        return [tabs, blockHasCustomizableStyles];
    }
}

class NoContentBlockEditForm extends preact.Component {
    /**
     * @access protected
     */
    render() {
        return <div class="pt-1">
            { __('This content block does not have any editable properties.') }
        </div>;
    }
}

class NoContentStyleCustomizationsEditForm extends preact.Component {
    /**
     * @access protected
     */
    render() {
        return <div class="pt-1">
            { __('This content block currently has no styles active, or they don\'t contain customizable properties.') }
        </div>;
    }
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
 * @returns {Boolean}
 * @access private
 */
function doesTabContainStylesStuff(tabKind) {
    return tabKind.indexOf('styles') > -1;
}

/**
 * @param {string} currentClasses
 * @returns {(chunk: StyleChunk) => boolean}
 */
function createIsChunkStyleEnabledChecker(currentClasses) {
    const currentAsArr = currentClasses.split(' ');
    return chunk =>
        currentAsArr.indexOf(extractClassName(chunk, false)) > -1
    ;
}

/**
 * @param {Block} block
 * @param {Array<TabInfo>} block
 * @returns {boolean}
 * @access private
 */
function getUserStyleTabHasContent({styleClasses}, tabsInfo) {
    if (tabsInfo.some(({kind}) => kind === 'user-styles')) {
        const varList = DefaultStyleCustomizatorForm.getConfigurableVarsList(null, createIsChunkStyleEnabledChecker(styleClasses));
        return varList.length > 0;
    }
    return false;
}

export default BlockEditForm;