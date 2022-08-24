import {__, api, signals, env, Icon} from '@sivujetti-commons-for-edit-app';
import Tabs from './commons/Tabs.jsx';
import {timingUtils, objectUtils} from './commons/utils.js';
import BlockStylesTab from './Block/BlockStylesTab.jsx';
import {getIcon} from './block-types/block-types.js';
import BlockTrees from './BlockTrees.jsx';
import blockTreeUtils, {isGlobalBlockTreeRefOrPartOfOne} from './blockTreeUtils.js';
import store, {selectCurrentPageDataBundle, createSelectBlockTree, pushItemToOpQueue, observeStore,
               createUpdateBlockTreeItemData} from './store.js';

/** @type {BlockTypes} */
let blockTypes;

/** @type {Boolean} */
let currentPageIsPlaceholderPage;

/** @type {Array} */
let fastChangesQueue;

class BlockEditForm extends preact.Component {
    // isOutermostBlockOfGlobalBlockTree;
    // userCanSpecializeGlobalBlocks;
    // blockType;
    // editFormImpl;
    // allowStylesEditing;
    // unregistrables;
    // static undoingLockIsOn;
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
        BlockEditForm.undoingLockIsOn = false;
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
        currentPageIsPlaceholderPage = selectCurrentPageDataBundle(store.getState()).page.isPlaceholderPage;
        this.unregistrables = [signals.on('on-block-deleted', ({id}, isChildOfOrCurrentlyOpenBlock) => {
            if (isChildOfOrCurrentlyOpenBlock || id === block.id) this.props.inspectorPanel.close();
        }), observeStore(createSelectBlockTree(trid), ({tree, context}) => {
            if (!this.editFormImplsChangeGrabber && !this.stylesFormChangeGrabber)
                return;
            if (context[0] !== 'update-single-value' && context[0] !== 'undo-update-single-value')
                return;
            const block = blockTreeUtils.findBlock(this.props.block.id, tree)[0];
            if (context[1].blockId !== block.id)
                return;
            if (this.editFormImplsChangeGrabber)
                this.editFormImplsChangeGrabber(JSON.parse(JSON.stringify(block)), context[0], context[0].startsWith('undo-'));
            if (this.stylesFormChangeGrabber)
                this.stylesFormChangeGrabber(JSON.parse(JSON.stringify(block)), context[0], context[0].startsWith('undo-'));
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
    render({block}, {currentTabIdx}) {
        const EditFormImpl = this.editFormImpl;
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
                    getBlockCopy={ getBlockCopy.bind(this) }
                    grabChanges={ withFn => { this.editFormImplsChangeGrabber = withFn; } }
                    emitValueChanged={ (val, key, ...vargs) => { this.handleValueValuesChanged({[key]: val}, ...vargs); } }
                    emitManyValuesChanged={ this.handleValueValuesChanged.bind(this) }
                    key={ block.id }/>
            </div>
        </div>
        <div class={ currentTabIdx === 1 ? '' : 'd-none' }>
            <BlockStylesTab
                getBlockCopy={ getBlockCopy.bind(this) }
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
}

/**
 * @param {{[key]: any;}} newData
 * @param {DefaultChangeEventData} contextData
 */
function emitMutateBlockProp(newData, contextData) {
    store.dispatch(createUpdateBlockTreeItemData(contextData.trid)(
        newData,
        contextData.blockId,
        ['update-single-value', contextData]
    ));
}

/**
 * @param {Array<{[key]: any;}>} oldDataQ
 * @param {DefaultChangeEventData} contextData
 */
function emitPushStickyOp(oldDataQ, contextData) {
    const oldData = takeOldestValues(oldDataQ);
    oldDataQ.splice(0, oldDataQ.length);
    //
    store.dispatch(pushItemToOpQueue(`update-block-tree#${contextData.trid}`, {
        doHandle: contextData.trid !== 'main' || !currentPageIsPlaceholderPage
            ? () => {
                const {trid} = contextData;
                const {tree} = createSelectBlockTree(trid)(store.getState());
                return BlockTrees.saveExistingBlocksToBackend(tree, trid);
            }
            : null,
        doUndo: () => {
            store.dispatch(createUpdateBlockTreeItemData(contextData.trid)(
                oldData,
                contextData.blockId,
                ['undo-update-single-value', contextData]
            ));
        },
        args: [],
    }));
}

/**
 * In: [{text: 'Fo'}, {text: 'Foo'}, {level: 2}]
 * Out: {text: 'Fo', level: 2}
 *
 * @param {Array<{[key]: any;}>} oldDataQ
 * @returns {{[key]: any;}}
 */
function takeOldestValues(oldDataQ) {
    const out = {};
    for (const obj of oldDataQ) {
        for (const key in obj) {
            if (!Object.prototype.hasOwnProperty.call(out, key))
                out[key] = obj[key];
            // else ignore newer value obj[key]
        }
    }
    return out;
}

/**
 * @returns {RawBlock}
 */
function getBlockCopy() {
    return JSON.parse(JSON.stringify(blockTreeUtils.findBlock(this.props.block.id, createSelectBlockTree(this.props.block.isStoredToTreeId)(store.getState()).tree)[0]));
}

export default BlockEditForm;
