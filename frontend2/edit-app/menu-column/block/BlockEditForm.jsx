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

const ContentTabText = __('Content');
const UserStylesTabText = __('Styles');
const DevStylesTabText = __('Styles (code)');

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
            this.blockType.editForm,
            ...(!this.blockType.extends ? [] : [api.blockTypes.get(this.blockType.extends).editForm])
        ];
        this.stylesEditForm = this.blockType.stylesEditForm || 'DefaultWidgetBasedStylesEditForm';

        const userCanEditCss = api.user.can('editBlockCss');
        this.tabsInfo = createTabsInfo(this.blockType.name, userCanEditCss);
        const currentTabIdx = createInitialTabIdx(
            parseInt(getAndPutAndGetToLocalStorage('0', 'sivujettiLastBlockEditFormTabIdx'), 10),
            this.tabsInfo,
            userCanEditCss
        );
        this.setState(createState(currentTabIdx, this.tabsInfo, this.props.block));

        this.unregistrables = [saveButton.subscribeToChannel('theBlockTree', (theTree, userCtx, ctx, flags) => {
            const event = userCtx?.event || '';
            if (event === 'convert-branch-to-global-block-reference-block') {
                api.inspectorPanel.close();
                return;
            }
            //
            const doCheckDiffForEditForm = (
                (event === 'update-single-block-prop' && userCtx?.blockId === this.state.blockCopyForEditForm?.id) ||
                ctx === 'undo'
            );
            if (doCheckDiffForEditForm) {
                const block = doCheckDiffForEditForm ? blockTreeUtils.findBlockMultiTree(this.state.blockCopyForEditForm.id, theTree)[0] : null;
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

        saveButton.subscribeToChannel('stylesBundle', (bundle, userCtx, ctx) => {
            const doesIt = doesTabContainStylesStuff(
                this.state.currentTabIdx,
                this.tabsInfo,
            );
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
        const {tabsInfo} = this;
        const hasMoreThat1Tab = tabsInfo.length > 1;
        return <div data-main>
            <div class={ `with-icon${typeid} ${hasMoreThat1Tab ? 'pb-1' : 'pb-2 mb-8'}` }>
                <Icon iconId={ api.blockTypes.getIconId(this.blockType) } className="size-xs mr-1"/>
                { __(block.title || this.blockType.friendlyName) }
            </div>
            { hasMoreThat1Tab ? <Tabs
                links={ tabsInfo.map(itm => itm.title) }
                getTabName={ (_, i) => tabsInfo[i].title }
                onTabChanged={ (toIdx) => this.changeTab(toIdx) }
                className={ `text-tinyish mt-0${currentTabIdx < 1 ? ' mb-2' : ''}` }
                initialIndex={ currentTabIdx }/> : null }
            { tabsInfo.map((itm, i) => {
                let content;
                if (currentTabIdx !== i)
                    content = null;
                else if (itm.kind === 'content' || itm.kind === 'content+user-styles') {
                    content = this.editFormImpls.map(EditFormImpl =>
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
                            { ...(block.type !== 'Section2' ? {} : {stylesStateId: this.state.stylesStateId}) }/>
                    );
                } else if (itm.kind === 'user-styles') {
                    const StylesEditFormCls = this.stylesEditForm;
                    content = <StylesEditFormCls
                        blockId={ block.id }
                        stateId={ this.state.stylesStateId }/>;
                } else if (itm.kind === 'dev-styles') {
                    content = <CodeBasedStylesList
                        stylesStateId={ this.state.stylesStateId }
                        blockId={ block.id }/>;
                }
                return <div class={ currentTabIdx === i ? '' : 'd-none' } key={ itm.kind }>
                    { content }
                </div>;
            }) }
        </div>;
    }
    /**
     * @param {Number} toIdx
     * @access private
     */
    changeTab(toIdx) {
        putToLocalStorage(toIdx.toString(), 'sivujettiLastBlockEditFormTabIdx');
        this.setState(createState(toIdx, this.tabsInfo, this.props.block));
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
}

/**
 * @param {String} blockTypeName
 * @param {Boolean} userCanEditCss
 * @returns {Array<TabInfo>}
 */
function createTabsInfo(blockTypeName, userCanEditCss) {
    const all = createTabConfig(blockTypeName);
    const filtered = userCanEditCss ? all : all.filter(({kind}) => kind !== 'dev-styles');
    return filtered.map((itm) => {
        if (itm.kind === 'content')
            return {...itm, ...{title: ContentTabText}};
        if (itm.kind === 'user-styles')
            return {...itm, ...{title: UserStylesTabText}};
        if (itm.kind === 'content+user-styles')
            return {...itm, ...{title: `${ContentTabText} & ${UserStylesTabText}`}};
        if (itm.kind === 'dev-styles')
            return {...itm, ...{title: DevStylesTabText}};
    });
}

/**
 * @param {String} blockTypeName
 * @returns {Array<{kind: tabKind;}>}
 */
function createTabConfig(blockTypeName) {
    if (blockTypeName === 'PageInfo')
        return [
            {kind: 'content'}
        ];
    if (blockTypeName === 'Section2')
        return [
            {kind: 'content+user-styles'},
            {kind: 'dev-styles'}
        ];
    return [
        {kind: 'content'},
        {kind: 'user-styles'},
        {kind: 'dev-styles'},
    ];
}

/**
 * @param {Number} newTabIdx
 * @param {Array<TabInfo>} tabsInfo
 * @param {Object} thisPropsBlock
 * @returns {Object}
 */
function createState(newTabIdx, tabsInfo, thisPropsBlock) {
    const  out =  {
        currentTabIdx: newTabIdx,
        ...(tabsInfo[newTabIdx].kind.indexOf('content') > -1
            ? {blockCopyForEditForm: objectUtils.cloneDeep(thisPropsBlock)}
            : {}
        ),
        ...(doesTabContainStylesStuff(newTabIdx, tabsInfo)
            ? {stylesStateId: api.saveButton.getInstance().getChannelState('stylesBundle')?.id}
            : {}
        )
    };
    return out;
}

/**
 * @param {Number} savedIdx
 * @param {Array<TabInfo>} tabsInfo
 * @param {Boolean} userCanEditCss
 * @returns {Number}
 */
function createInitialTabIdx(savedIdx, tabsInfo, userCanEditCss) {
    const tabIdx1 = getLargestAllowedTabIdx(savedIdx, userCanEditCss);
    return Math.min(tabIdx1, tabsInfo.length - 1);
}

/**
 * @param {Number} savedIdx
 * @param {Boolean} userCanEditCss
 * @returns {Number}
 */
function getLargestAllowedTabIdx(savedIdx, userCanEditCss) {
    if (savedIdx > 1 && !userCanEditCss)
        return 1;
    return savedIdx;
}

/**
 * @param {Number} tabIdx
 * @param {Array<TabInfo>} tabsInfo
 * @returns {Boolean}
 * @access private
 */
function doesTabContainStylesStuff(tabIdx, tabsInfo) {
    return tabsInfo[tabIdx]?.kind.indexOf('styles') > -1;
}

/**
 * @typedef {'content'|'user-styles'|'dev-styles'|'content+user-styles'} tabKind
 *
 * @typedef TabInfo
 * @prop {tabKind} kind
 * @prop {String} title
 */

export default BlockEditForm;
