// -- import {HAS_ERRORS, isMetaBlock} from '../../block/dom-commons.js';
// -- import store from '../../store.js';
import {
    __,
    api,
    blockTreeUtils,
    cloneDeep,
    getAndPutAndGetToLocalStorage,
    Icon,
    putToLocalStorage,
    Tabs,
    writeBlockProps,
} from '../../../sivujetti-commons-unified.js';
// -- import store2, {observeStore as observeStore2} from '../../store2.js';
// -- import {cloneObjectDeep} from '../../block/theBlockTreeStore.js';
// -- import {treeToTransferable} from '../../block/utils.js';
// -- import {findBlockFrom, getIsStoredToTreeIdFrom} from '../../block/utils-utils.js';

class BlockEditForm extends preact.Component {
    // editFormImplsChangeGrabbers;
    // userCanSpecializeGlobalBlocks;
    // userCanEditVisualStyles;
    // userCanEditCss;
    // useVisualStyles;
    // blockType;
    // blockIsStoredToTreeId;
    // editFormImpls;
    // allowStylesEditing;
    // isOutermostBlockOfGlobalBlockTree;
    // unregistrables;
    // dispatchFastChangeTimeout;
    /**
     * @access protected
     */
    componentWillMount() {
        const blockCopyForEditForm = cloneDeep(this.props.block);
        this.editFormImplsChangeGrabbers = [];
        this.userCanSpecializeGlobalBlocks = api.user.can('specializeGlobalBlocks');
        this.userCanEditVisualStyles = api.user.can('editBlockStylesVisually');
        this.userCanEditCss = api.user.can('editBlockCss');
        this.useVisualStyles = !this.userCanEditCss && this.userCanEditVisualStyles;
        this.blockType = api.blockTypes.get(blockCopyForEditForm.type);
        this.blockIsStoredToTreeId = 'main'; // --  getIsStoredToTreeIdFrom(block.id, 'mainTree');
        this.editFormImpls = [
            this.blockType.editForm,
            ...(!this.blockType.extends ? [] : [api.blockTypes.get(this.blockType.extends).editForm])
        ];
        this.allowStylesEditing = !globalData.pageDataBundle.page.isPlaceholderPage;
        this.isOutermostBlockOfGlobalBlockTree = false;

        const currentTabIdx = this.getLargestAllowedTabIdx(parseInt(getAndPutAndGetToLocalStorage('0', 'sivujettiLastBlockEditFormTabIdx'), 10));
        this.setState({
            currentTabIdx,
            ...this.createState2(currentTabIdx, -1),
            blockCopyForEditForm,
        });

        this.unregistrables = [api.saveButton.getInstance().subscribeToChannel('theBlockTree', (theTree, userCtx, ctx) => {
            if (!(this.blockType.name === 'Menu' || this.blockType.name === 'Columns2')) return;
            const doCheckDifference = (userCtx?.event === 'update-single-block-prop' && userCtx?.blockId === this.state.blockCopyForEditForm.id) ||
                                        ctx === 'undo';
            const block = doCheckDifference ? blockTreeUtils.findBlock(this.state.blockCopyForEditForm.id, theTree)[0] : null;
            if (this.state.blockCopyForEditForm.id !== block.id) return;
            const a = JSON.stringify(this.state.blockCopyForEditForm.propsData);
            const b = JSON.stringify(block.propsData);
            if (a !== b)
                this.setState({blockCopyForEditForm: cloneDeep(block)});
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
    render({block}, {currentTabIdx, blockCopyForEditForm}) {
        const tr1 = __('Content');
        const tr2 = __('Styles');
        const tr3 = __('Styles (code)');
        const StyleListCls = [null, WidgetBasedStylesList, CodeBasedStylesList][currentTabIdx];
        const isMeta = false; // -- isMetaBlock(block);
        const t = isMeta ? ' page-info-block' : this.blockIsStoredToTreeId === 'main' ? '' : ' global-block-tree-block';
        return <div data-main>
        <div class={ `with-icon pb-1${t}` }>
            <Icon iconId={ api.blockTypeGetIconId(this.blockType) } className="size-xs mr-1"/>
            { __(block.title || this.blockType.friendlyName) }
        </div>
        <Tabs
            links={ [...[tr1, tr2], ...(this.userCanEditCss && !isMeta ? [tr3] : [])] }
            getTabName={ link => ({
                [tr1]: 'content',
                [tr2]: 'style-units',
                [tr3]: 'style-templates'
            }[link]) }
            onTabChanged={ this.changeTab.bind(this) }
            className="text-tinyish mt-0 mb-2"
            initialIndex={ currentTabIdx }/>
        <div class={ currentTabIdx === 0 ? '' : 'd-none' }>
            <div class="mt-2">
                { this.userCanSpecializeGlobalBlocks && this.isOutermostBlockOfGlobalBlockTree
                    ? 'todo'
                    : null
                }
                { this.editFormImpls.map(EditFormImpl =>
                    <EditFormImpl
                        block={ blockCopyForEditForm }
                        emitValueChanged={ (val, key, ...vargs) => { this.handleValueValuesChanged({[key]: val}, ...vargs); } }
                        emitManyValuesChanged={ this.handleValueValuesChanged.bind(this) }
                        key={ block.id }
                        { ...(block.type !== 'Columns2' ? {} : {stylesStateId: this.state.stylesStateId}) }/>)
                }
            </div>
        </div>
        <div class={ `block-styles-tab-content${currentTabIdx > 0 ? '' : ' d-none'}` }>
            { currentTabIdx > 0 ? <StyleListCls blockId={ blockCopyForEditForm.id } stateId={ this.state.stylesStateId }/> : null }
        </div>
        </div>;
    }
    /**
     * @param {Object} changes
     * @param {Boolean} hasErrors = false
     * @param {Number} debounceMillis = 0
     * @param {'debounce-commit-to-queue'|'debounce-re-render-and-commit-to-queue'|'debounce-none'} debounceType = 'debounce-commit-to-queue'
     * @access public
     */
    handleValueValuesChanged(changes, hasErrors = false, debounceMillis = 0, debounceType = 'debounce-commit-to-queue') {
        if (this.state.currentTabIdx > 0) return;

        const saveButton = api.saveButton.getInstance();
        const blockId = this.props.block.id;
        saveButton.pushOp(
            'theBlockTree', blockTreeUtils.createMutation(saveButton.getChannelState('theBlockTree'), clonedTree => {
                const [blockRef] = blockTreeUtils.findBlock(blockId, clonedTree);
                mutateBlockData(blockRef, changes);
                return clonedTree;
            }), {event: 'update-single-block-prop', blockId}
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
     * @returns {{stylesStateId: Number;}|{todo: todo;}}
     * @access private
     */
    createState2(currentTabIdx, stylesStateId) {
        if (currentTabIdx === 1)
            return {stylesStateId: stylesStateId + 1};
        if (currentTabIdx === 2) {
            return {todo: null};
        }
    }
    /**
     * @param {Number} toIdx
     * @access private
     */
    changeTab(toIdx) {
        putToLocalStorage(toIdx.toString(), 'sivujettiLastBlockEditFormTabIdx');
        this.setState({
            ...{currentTabIdx: toIdx},
            ...this.createState2(toIdx, this.state.stylesStateId - 1)
        });
    }
}

class WidgetBasedStylesList extends preact.Component { render() { return 'todo'; } }

class CodeBasedStylesList extends preact.Component { render() { return 'todo'; } }

/**
 * @param {RawBlock} block
 * @param {{[key: String]: any;}} data
 */
function mutateBlockData(block, data) {
    for (const key in data) {
        // b.*
        block[key] = data[key];
        if (['type', 'title', 'renderer', 'id', 'styleClasses'].indexOf(key) < 0) {
            // b.propsData[*]
            const idx = block.propsData.findIndex(p => p.key === key);
            if (idx > -1) block.propsData[idx].value = data[key];
            else block.propsData.push({key, value: data[key]});
        }
    }
}

export default BlockEditForm;
