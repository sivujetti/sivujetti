import {__, api, env, timingUtils, Icon} from '@sivujetti-commons-for-edit-app';
import Tabs from '../../commons/Tabs.jsx';
import {objectUtils} from '../../commons/utils.js';
import {getIcon} from '../../block-types/block-types.js';
import store, {selectCurrentPageDataBundle, createSelectBlockTree, observeStore} from '../../store.js';
import store2, {observeStore as observeStore2} from '../../store2.js';
import BlockStylesTab from './BlockStylesTab.jsx';
import {emitMutateBlockProp, emitPushStickyOp} from './BlockTree.jsx';
import blockTreeUtils, {isGlobalBlockTreeRefOrPartOfOne} from './blockTreeUtils.js';

/** @type {BlockTypes} */
let blockTypes;

/** @type {Array} */
let fastChangesQueue;

class BlockEditForm extends preact.Component {
    // isOutermostBlockOfGlobalBlockTree;
    // userCanSpecializeGlobalBlocks;
    // blockType;
    // editFormImpl;
    // allowStylesEditing;
    // unregistrables;
    // dispatchFastChangeTimeout;
    /**
     * @param {{block: Block; inspectorPanel: preact.Component;}} props
     */
    constructor(props) {
        super(props);
        blockTypes = api.blockTypes;
        this.state = {currentTabIdx: 0};
        fastChangesQueue = [];
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const {block} = this.props;
        this.isOutermostBlockOfGlobalBlockTree = false;
        this.userCanSpecializeGlobalBlocks = api.user.can('specializeGlobalBlocks');
        this.blockType = blockTypes.get(block.type);
        this.editFormImpl = this.blockType.editForm;
        this.allowStylesEditing = !selectCurrentPageDataBundle(store.getState()).page.isPlaceholderPage;
        this.setState({currentTabIdx: 0});
        this.currentDebounceTime = null;
        this.currentDebounceType = null;
        this.boundEmitStickyChange = null;
        this.boundEmitFastChange = null;
        const trid = this.props.block.isStoredToTreeId;
        this.unregistrables = [observeStore2('theBlockTree', (_, [event, data]) => {
            const isUndo = event === 'theBlockTree/undo';
            if (event === 'theBlockTree/updatePropsOf' || isUndo) {
                if (!this.editFormImplsChangeGrabber && !this.stylesFormChangeGrabber)
                    return;
                const blockId = !isUndo
                    ? data[0]  // updatePropsOf: [<blockId>, <blockIsStoredToTreeId>, <changes>, <hasErrors>, <debounceMillis>]
                    : data[1]; // undo:          [<oldTree>, <blockId>, <blockIsStoredToTreeId>]
                if (blockId !== this.props.block.id || (isUndo && blockId === null))
                    return;
                if (this.editFormImplsChangeGrabber)
                    this.editFormImplsChangeGrabber(this.getCurrentBlockCopy(), event, isUndo);
                if (this.stylesFormChangeGrabber)
                    this.stylesFormChangeGrabber(this.getCurrentBlockCopy(), event, isUndo);
            } else if (event === 'theBlockTree/deleteBlock') {
                const [id, _isStoredToTreeId, _what, isChildOfOrCurrentlyOpenBlock] = data;
                if (isChildOfOrCurrentlyOpenBlock || id === block.id) this.props.inspectorPanel.close();
            }
        })].concat(!(window.useStoreonBlockTree !== false) ? observeStore(createSelectBlockTree(trid), ({tree, context}) => {
            if (!this.editFormImplsChangeGrabber && !this.stylesFormChangeGrabber)
                return;
            if (context[0] !== 'update-single-value' && context[0] !== 'undo-update-single-value')
                return;
            if (context[1].blockId !== this.props.block.id)
                return;
            const block = blockTreeUtils.findBlock(this.props.block.id, tree)[0];
            if (this.editFormImplsChangeGrabber)
                this.editFormImplsChangeGrabber(JSON.parse(JSON.stringify(block)), context[0], context[0].startsWith('undo-'));
            if (this.stylesFormChangeGrabber)
                this.stylesFormChangeGrabber(JSON.parse(JSON.stringify(block)), context[0], context[0].startsWith('undo-'));
        }) : []);
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
    render({block}, {currentTabIdx}) {
        const EditFormImpl = this.editFormImpl;
        const getCopy = (window.useStoreonBlockTree !== false ? this.getCurrentBlockCopy : getBlockCopyOld).bind(this);
        return <div data-main>
        <div class={ `with-icon pb-1${preactHooks.useMemo(() => {
                if (isGlobalBlockTreeRefOrPartOfOne(block)) return ' global-block-tree-block';
                if (block.type === 'PageInfo') return ' page-info-block';
                return '';
            }, [])}` }>
            <Icon iconId={ getIcon(this.blockType) } className="size-xs mr-1"/>
            { __(block.title || this.blockType.friendlyName) }
        </div>
        <Tabs
            links={ [__('Content'), __('Styles')] }
            onTabChanged={ toIdx => this.setState({currentTabIdx: toIdx}) }
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
                    emitValueChanged={ (val, key, ...vargs) => { window.useStoreonBlockTree !== false ? this.handleValueValuesChanged2({[key]: val}, ...vargs) : this.handleValueValuesChanged({[key]: val}, ...vargs); } }
                    emitManyValuesChanged={ window.useStoreonBlockTree !== false ? this.handleValueValuesChanged2.bind(this) : this.handleValueValuesChanged.bind(this) }
                    key={ block.id }/>
            </div>
        </div>
        <div class={ currentTabIdx === 1 ? '' : 'd-none' }>
            <BlockStylesTab
                getBlockCopy={ getCopy }
                grabBlockChanges={ withFn => { this.stylesFormChangeGrabber = withFn; } }
                emitAddStyleToBlock={ (styleClassToAdd, b) => {
                    const currentClasses = b.styleClasses;
                    const newClasses = currentClasses ? `${currentClasses} ${styleClassToAdd}` : styleClassToAdd;
                    this.updateBlockStyleClasses(newClasses, b);
                } }
                emitRemoveStyleFromBlock={ (styleClassToRemove, b) => {
                    const currentClasses = b.styleClasses;
                    const newClasses = currentClasses.split(' ').filter(cls => cls !== styleClassToRemove).join(' ');
                    this.updateBlockStyleClasses(newClasses, b);
                } }
                emitSetBlockStyles={ (newStyleClasses, b) => {
                    this.updateBlockStyleClasses(newStyleClasses, b);
                } }
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
            store2.dispatch('theBlockTree/updatePropsOf', [this.props.block.id, this.props.block.isStoredToTreeId, changes,
                hasErrors, debounceMillis]);
        // Throttle fast dispatch, which throttles commitChangeOpToQueue as well
        } else if (debounceType === 'debounce-re-render-and-commit-to-queue') {
            if (hasErrors) return;
            if (this.dispatchFastChangeTimeout) clearTimeout(this.dispatchFastChangeTimeout);
            const fn = () => {
                store2.dispatch('theBlockTree/updatePropsOf', [this.props.block.id, this.props.block.isStoredToTreeId, changes,
                    false, 0]);
            };
            this.dispatchFastChangeTimeout = setTimeout(fn, debounceMillis);
        }
    }
    /**
     * @param {Object} changes
     * @param {Boolean} hasErrors
     * @param {Number} debounceMillis = 0
     * @param {'debounce-commit-to-queue'|'debounce-re-render-and-commit-to-queue'|'debounce-none'} debounceType = 'debounce-commit-to-queue'
     * @access public
     */
    handleValueValuesChanged(changes, hasErrors = false, debounceMillis = 0, debounceType = 'debounce-commit-to-queue') {
        if (this.state.currentTabIdx === 1) return;
        if (this.currentDebounceTime !== debounceMillis || this.currentDebounceType !== debounceType) {
            const boundEmitStickyChange = (oldDataQ, contextData) => {
                emitPushStickyOp(oldDataQ, contextData);
            };
            const boundEmitFastChange = (newData, oldDataQ, contextData, hasErrors) => {
                emitMutateBlockProp(newData, contextData);
                if (!hasErrors) this.boundEmitStickyChange(oldDataQ, contextData);
                else env.console.log('Not implemented yet');
            };
            // Run reRender immediately, but throttle commitChangeOpToQueue
            if (debounceType === 'debounce-commit-to-queue') {
                this.boundEmitStickyChange = timingUtils.debounce(boundEmitStickyChange, debounceMillis);
                this.boundEmitFastChange = boundEmitFastChange;
            // Throttle reRender, which throttles commitToQueue as well
            } else if (debounceType === 'debounce-re-render-and-commit-to-queue') {
                this.boundEmitStickyChange = boundEmitStickyChange;
                this.boundEmitFastChange = timingUtils.debounce(boundEmitFastChange, debounceMillis);
            // Run both immediately
            } else {
                this.boundEmitStickyChange = boundEmitStickyChange;
                this.boundEmitFastChange = boundEmitFastChange;
            }
            this.currentDebounceTime = debounceMillis;
            this.currentDebounceType = debounceType;
        }
        const trid = this.props.block.isStoredToTreeId;
        const {tree} = createSelectBlockTree(trid)(store.getState());
        const block = blockTreeUtils.findBlock(this.props.block.id, tree)[0];
        fastChangesQueue.push(objectUtils.clonePartially(Object.keys(changes), block));
        const contextData = {blockId: block.id, blockType: block.type, trid};
        // Call emitFastChange, which then calls emitCommitChange
        this.boundEmitFastChange(changes, fastChangesQueue, contextData, hasErrors);
    }
    /**
     * @param {String} newStyleClasses
     * @param {RawBlock} blockCopy
     * @access private
     */
    updateBlockStyleClasses(newStyleClasses, {id, type, isStoredToTreeId, styleClasses}) {
        const contextData = {blockId: id, blockType: type, trid: isStoredToTreeId};
        const dataBefore = {styleClasses};
        emitMutateBlockProp({styleClasses: newStyleClasses}, contextData);
        emitPushStickyOp([dataBefore], contextData);
    }
    /**
     * @returns {RawBlock}
     * @access private
     */
    getCurrentBlockCopy() {
        const {id, isStoredToTreeId} = this.props.block;
        const rootOrInnerTree = blockTreeUtils.getRootFor(isStoredToTreeId, store2.get().theBlockTree);
        return JSON.parse(JSON.stringify(blockTreeUtils.findBlock(id, rootOrInnerTree)[0]));
    }
}

/**
 * @returns {RawBlock}
 */
function getBlockCopyOld() {
    const {tree} = createSelectBlockTree(this.props.block.isStoredToTreeId)(store.getState());
    return JSON.parse(JSON.stringify(blockTreeUtils.findBlock(this.props.block.id, tree)[0]));
}


export default BlockEditForm;
