import {__, api, Icon} from '@sivujetti-commons-for-edit-app';
import Tabs from '../../commons/Tabs.jsx';
import {HAS_ERRORS, NO_OP_QUEUE_EMIT} from '../../block/dom-commons.js';
import {getIcon} from '../../block-types/block-types.js';
import store, {selectCurrentPageDataBundle} from '../../store.js';
import store2, {observeStore as observeStore2} from '../../store2.js';
import {cloneObjectDeep} from '../../block/theBlockTreeStore.js';
import blockTreeUtils from './blockTreeUtils.js';
import {findBlockFrom, getIsStoredToTreeIdFrom} from '../../block/utils-utils.js';
import BlockStylesTab from './BlockStylesTab.jsx';

/** @type {BlockTypes} */
let blockTypes;

class BlockEditForm extends preact.Component {
    // editFormImplsChangeGrabber;
    // userCanSpecializeGlobalBlocks;
    // userCanEditVars;
    // userCanEditCss;
    // useVisualStyles;
    // blockType;
    // blockIsStoredToTreeId;
    // editFormImpl;
    // allowStylesEditing;
    // isOutermostBlockOfGlobalBlockTree;
    // unregistrables;
    // dispatchFastChangeTimeout;
    /**
     * @param {{block: RawBlock; inspectorPanel: preact.Component;}} props
     */
    constructor(props) {
        super(props);
        blockTypes = api.blockTypes;
        this.state = {currentTabIdx: 0};
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const {block} = this.props;
        this.userCanSpecializeGlobalBlocks = api.user.can('specializeGlobalBlocks');
        this.userCanEditVars = api.user.can('editThemeVars');
        this.userCanEditCss = api.user.can('editThemeCss');
        this.useVisualStyles = !this.userCanEditCss && this.userCanEditVars;
        this.blockType = blockTypes.get(block.type);
        this.blockIsStoredToTreeId = getIsStoredToTreeIdFrom(block.id, 'mainTree');
        this.editFormImpl = this.blockType.editForm;
        this.allowStylesEditing = !selectCurrentPageDataBundle(store.getState()).page.isPlaceholderPage;
        this.isOutermostBlockOfGlobalBlockTree = false;
        this.setState({currentTabIdx: 0});
        this.unregistrables = [observeStore2('theBlockTree', (_, [event, data]) => {
            const isUndo = event === 'theBlockTree/undo';
            const isSomeOtherBlock = eventBlockId => eventBlockId !== this.props.block.id || (isUndo && eventBlockId === null);
            if (event === 'theBlockTree/updatePropsOf' || isUndo) {
                if (!this.editFormImplsChangeGrabber)
                    return;
                const blockId = !isUndo
                    ? data[0]  // updatePropsOf: [<blockId>, <blockIsStoredToTreeId>, <changes>, <flags>, <debounceMillis>]
                    : data[1]; // undo:          [<oldTree>, <blockId>, <isUndoOfConvertToGlobal>]
                if (isSomeOtherBlock(blockId))
                    return;
                this.editFormImplsChangeGrabber(this.getCurrentBlockCopy(), event, isUndo);
                return;
            }

            if (event === 'theBlockTree/updateDefPropsOf' && this.state.currentBlockCopy) {
                this.setState({currentBlockCopy: this.getCurrentBlockCopy()});
            } else if (event === 'theBlockTree/deleteBlock') {
                const [id, _blockIsStoredToTreeId, isChildOfOrCurrentlyOpenBlock] = data;
                if (isChildOfOrCurrentlyOpenBlock || id === block.id) this.props.inspectorPanel.close();
            }
        })];
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unregistrables.forEach(unreg => unreg());
    }
    /**
     * @access protected
     */
    render({block}, {currentTabIdx, currentBlockCopy}) {
        const EditFormImpl = this.editFormImpl;
        const getCopy = this.getCurrentBlockCopy.bind(this);
        const t = block.type === 'PageInfo' ? ' page-info-block' : this.blockIsStoredToTreeId === 'main' ? '' : ' global-block-tree-block';
        const tr1 = __('Styles (bundles)');
        const tr2 = __('Styles');
        return <div data-main>
        <div class={ `with-icon pb-1${t}` }>
            <Icon iconId={ getIcon(this.blockType) } className="size-xs mr-1"/>
            { __(block.title || this.blockType.friendlyName) }
        </div>
        <Tabs
            links={ [__('Content'), tr2] }
            getTabName={ link => link === tr1 ? 'style-units' : 'combined-styles' }
            onTabChanged={ toIdx => this.setState({
                ...{currentTabIdx: toIdx},
                ...(toIdx === 1 ? {currentBlockCopy: this.getCurrentBlockCopy()} : {})
            }) }
            className="text-tinyish mt-0 mb-2"/>
        <div class={ currentTabIdx === 0 ? '' : 'd-none' }>
            <div class="mt-2">
                { this.userCanSpecializeGlobalBlocks && this.isOutermostBlockOfGlobalBlockTree
                    ? 'todo'
                    : null
                }
                <EditFormImpl
                    getBlockCopy={ getCopy }
                    grabChanges={ withFn => { this.editFormImplsChangeGrabber = withFn; } }
                    emitValueChanged={ (val, key, ...vargs) => { this.handleValueValuesChanged2({[key]: val}, ...vargs); } }
                    emitManyValuesChanged={ this.handleValueValuesChanged2.bind(this) }
                    key={ block.id }/>
            </div>
        </div>
        <div class={ `block-styles-tab-content${currentTabIdx === 1 ? '' : ' d-none'}` }>
            <BlockStylesTab
                getBlockCopy={ getCopy }
                userCanEditVars={ this.userCanEditVars }
                userCanEditCss={ this.userCanEditCss }
                useVisualStyles={ this.useVisualStyles }
                emitAddStyleClassToBlock={ (styleClassToAdd, b) => {
                    const currentClasses = b.styleClasses;
                    const newClasses = currentClasses ? `${currentClasses} ${styleClassToAdd}` : styleClassToAdd;
                    this.dispatchNewBlockStyleClasses(newClasses, b);
                } }
                emitRemoveStyleClassFromBlock={ (styleClassToRemove, b) => {
                    const currentClasses = b.styleClasses;
                    const newClasses = currentClasses.split(' ').filter(cls => cls !== styleClassToRemove).join(' ');
                    this.dispatchNewBlockStyleClasses(newClasses, b);
                } }
                emitSetBlockStylesClasses={ (newStyleClasses, b) => {
                    this.dispatchNewBlockStyleClasses(newStyleClasses, b);
                } }
                grabBlockChanges={ () => {} }
                isVisible={ currentTabIdx === 1 }/>
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
    handleValueValuesChanged2(changes, hasErrors = false, debounceMillis = 0, debounceType = 'debounce-commit-to-queue') {
        if (this.state.currentTabIdx === 1) return;
        // Run fast dispatch (reRender) immediately, which throttles commitChangeOpToQueue if debounceMillis > 0 (see OpQueueItemEmitter.js)
        if (debounceType === 'debounce-commit-to-queue' || debounceType === 'debounce-none') {
            store2.dispatch('theBlockTree/updatePropsOf', [this.props.block.id, this.blockIsStoredToTreeId, changes,
                !hasErrors ? 0 : HAS_ERRORS, debounceMillis]);
        // Throttle fast dispatch, which throttles commitChangeOpToQueue as well
        } else if (debounceType === 'debounce-re-render-and-commit-to-queue') {
            if (hasErrors) return;
            if (this.dispatchFastChangeTimeout) clearTimeout(this.dispatchFastChangeTimeout);
            const fn = () => {
                store2.dispatch('theBlockTree/updatePropsOf', [this.props.block.id, this.blockIsStoredToTreeId, changes,
                    0, 0]);
            };
            this.dispatchFastChangeTimeout = setTimeout(fn, debounceMillis);
        }
    }
    /**
     * @param {String} newStyleClasses
     * @param {RawBlock} blockCopy
     * @access private
     */
    dispatchNewBlockStyleClasses(newStyleClasses, {id}) {
        const changes = {styleClasses: newStyleClasses};
        const isOnlyStyleClassesChange = true;
        const isStoredToTreeId = getIsStoredToTreeIdFrom(id, 'mainTree');
        store2.dispatch('theBlockTree/updateDefPropsOf', [id, isStoredToTreeId, changes, isOnlyStyleClassesChange]);
    }
    /**
     * @returns {RawBlock}
     * @access private
     */
    getCurrentBlockCopy() {
        return cloneObjectDeep(findBlockFrom(this.props.block.id, 'mainTree')[0]);
    }
}

/**
 * @param {String} blockId
 * @param {(block: RawBlock|null) => {changes: {[key: String]: any;}; flags?: Number;}|void} getUpdateSettings
 */
function updateBlockProps(blockId, getUpdateSettings) {
    const [block, _, __, root] = blockTreeUtils.findBlockSmart(blockId, store2.get().theBlockTree);
    if (!block) { getUpdateSettings(null); return; }
    const {changes, flags} = getUpdateSettings(block);
    store2.dispatch('theBlockTree/updatePropsOf', [
        block.id,
        blockTreeUtils.getIdFor(root),
        changes,
        typeof flags === 'number' ? flags : NO_OP_QUEUE_EMIT,
        0 // debounceMillis
    ]);
}

export default BlockEditForm;
export {updateBlockProps};
