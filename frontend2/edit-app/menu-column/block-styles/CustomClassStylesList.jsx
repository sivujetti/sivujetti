import {
    __,
    api,
    blockTreeUtils,
    env,
    floatingDialog,
    Icon,
    Popup,
    scssWizard,
    timingUtils,
} from '@sivujetti-commons-for-edit-app';
import CustomClassStyleEditCustomizationsDialog from '../../main-column/popups/CustomClassStyleEditCustomizationsDialog.jsx';
import EditTitlePopup from '../../main-column/popups/CustomClassStyleEditTitlePopup.jsx';
import ScssEditor from './ScssEditor.jsx';
/** @typedef {import('../../main-column/popups/CustomClassStyleEditTitlePopup.jsx').CustomClassStyleEditTitlePopupProps} CustomClassStyleEditTitlePopupProps */

let saveButtonInstance;

/** @extends {preact.Component<CustomClassStylesListProps, any>} */
class CustomClassStylesList extends preact.Component {
    // emitChunksChangesThrottled;
    // listElRef;
    // popupRef;
    // idxOfOpenMoreMenuChunk;
    /**
     * @access protected
     */
    componentWillMount() {
        saveButtonInstance = api.saveButton.getInstance();
        const styleChunksVisible = createChunksState();
        this.emitChunksChangesThrottled = timingUtils.debounce(
            this.emitChunksChanges.bind(this),
            env.normalTypingDebounceMillis
        );
        this.listElRef = preact.createRef();
        this.popupRef = preact.createRef();
        //
        this.setState({
            styleChunksVisible,
            listItemIsOpens: styleChunksVisible.map(() => false),
        });
    }
    /**
     * @param {CustomClassStylesListProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.stylesStateId !== this.props.stylesStateId ||
            props.styleClasses !== this.props.styleClasses) {
            const next = createChunksState();
            const {styleChunksVisible, listItemIsOpens} = this.state;
            const end = styleChunksVisible.length;
            this.setState({
                styleChunksVisible: next,
                listItemIsOpens: next.map((v, i) => i < end ? listItemIsOpens[i] : true),
            });
        }
    }
    /**
     * @access protected
     */
    render({checkIsChunkActive}, {styleChunksVisible, listItemIsOpens, titleUncommitted, idxOfOpenPopupListItem, editTitlePopupCfg}) {
        return [
            <ul class="list styles-list mb-2" ref={ this.listElRef }>{ styleChunksVisible.length
                ? styleChunksVisible.map((chunk, i) => {
                    const curIsActive = checkIsChunkActive(chunk);
                    const cls = extractClassName(chunk);
                    const title = titleUncommitted && i === idxOfOpenPopupListItem
                        ? titleUncommitted
                        : (chunk.data?.title || cls);
                    return <li class={ `mt-1 py-1${!listItemIsOpens[i] ? '' : ' open'}` }>
                        <header class="p-relative">
                            <div>
                                <button onClick={ () => {
                                    this.setState({listItemIsOpens: listItemIsOpens.map((v, i2) => i2 !== i ? v : !v)});
                                } } class="row-item btn no-color d-flex p-1" title={ title + (title !== cls ? ` / ${cls}` : '') }>
                                    <Icon iconId="chevron-down" className="size-xs"/>
                                    <span class="ͼ1 text-ellipsis"><span class="ͼj cm-scroller text-ellipsis">{ title }</span></span>
                                </button>
                                <button onClick={ e => this.openMoreMenu(i, e) } class="row-item btn no-color d-flex p-1" type="button">
                                    <Icon iconId="dots" className="size-xs color-dimmed"/>
                                </button>
                            </div>
                            { curIsActive !== null
                                ? <label class="form-checkbox" title={ __('Use style') }>
                                    <input
                                        onClick={ e => this.toggleStyleIsActivated(e.target.checked, curIsActive, extractClassName(chunk, false)) }
                                        checked={ curIsActive }
                                        type="checkbox" value="unit-1"/>
                                    <i class="form-icon"></i>
                                </label>
                                : null
                            }
                        </header>
                        { !listItemIsOpens[i]
                            ? <div></div>
                            : <ScssEditor
                                editorId="dev-class-styles"
                                onInput={ scss => {
                                    this.emitChunksChangesThrottled({scss}, chunk);
                                } }
                                scss={ chunk.scss }/>
                        }
                    </li>;
                })
                : __('No styles')
            }</ul>,
            <button
                onClick={ this.addStyle.bind(this) }
                class="btn btn-primary btn-sm mr-1"
                type="button">{ __('Add style') }</button>,
            <button
                onClick={ () => 'TODO' }
                class="btn btn-sm"
                type="button">{ __('Show parent styles') }</button>,
            editTitlePopupCfg
                ? <Popup
                    Renderer={ EditTitlePopup }
                    rendererProps={ editTitlePopupCfg.formProps }
                    btn={ editTitlePopupCfg.arrowRefEl }
                    close={ this.closeEditTitlePopup.bind(this) }
                    ref={ this.popupRef }/>
                : null
        ];
    }
    /**
     * @access private
     */
    addStyle() {
        const initialScss = `\n  color: red;\n`;
        const prevMax = getAllChunks().reduce((out, chunk) => {
            const c = parseInt(extractClassName(chunk).split('-')[1], 10);
            return c > out ? c : out;
        }, 0);
        const newChunkClass = `cc-${prevMax + 1}`;
        const newAll = scssWizard.addNewDevsScssChunkAndReturnAllRecompiled(
            `.${newChunkClass} {${initialScss}}`,
            'custom-class',
        );
        saveButtonInstance.pushOpGroup(
            ['stylesBundle', newAll],
            createAddOrRemoveBlockClassOpArgs('add', newChunkClass, this.props.blockId),
        );
    }
    /**
     * @param {string} scss
     * @param {scss?: string; data?: CustomClassStyleChunkData;}} changes
     * @access private
     */
    emitChunksChanges(changes, chunkVisible) {
        const updatedAll = scssWizard.updateDevsExistingChunkWithScssChunkAndReturnAllRecompiled(
            changes,
            chunkVisible,
        );
        saveButtonInstance.pushOp('stylesBundle', updatedAll);
    }
    /**
     * @param {boolean} newIsActive
     * @param {boolean} curIsActive
     * @param {string} chunkClass
     * @access private
     */
    toggleStyleIsActivated(newIsActive, curIsActive, chunkClass) {
        if (newIsActive && !curIsActive)
            saveButtonInstance.pushOp(...createAddOrRemoveBlockClassOpArgs('add', chunkClass, this.props.blockId));
        else if (curIsActive && !newIsActive)
            saveButtonInstance.pushOp(...createAddOrRemoveBlockClassOpArgs('remove', chunkClass, this.props.blockId));
    }
    /**
     * @param {number} i
     * @param {Event} e
     * @access private
     */
    openMoreMenu(i, e) {
        this.idxOfOpenMoreMenuChunk = i;
        api.contextMenu.open(e, this.createContextMenuController());
    }
    /**
     * @returns {ContextMenuController}
     * @access private
     */
    createContextMenuController() {
        return {
            getLinks: () => ([
                {text: __('Edit name'), title: __('Edit style name'), id: 'edit-title'},
                {text: __('Edit customization settings'), title: __('Edit customization settings'), id: 'edit-settings'},
                {text: __('Delete'), title: __('Delete style'), id: 'delete'},
            ]),
            /**
             * @param {ContextMenuLink} link
             */
            onItemClicked: link => {
                const idx = this.idxOfOpenMoreMenuChunk;
                if (link.id === 'edit-title') {
                    this.setState({
                        idxOfOpenPopupListItem: idx,
                        editTitlePopupCfg: this.createEditTitlePopupCfg(idx),
                    });
                } else if (link.id === 'edit-settings') {
                    floatingDialog.open(CustomClassStyleEditCustomizationsDialog, {
                        title: __('Edit style customizations'),
                    }, {
                        currentSettings: this.state.styleChunksVisible[idx].data?.mutationRules?.varDefs,
                        onConfirm: newSettings => this.emitCustomClassSettingsData(idx, newSettings),
                    });
                } else if (link.id === 'delete')
                    api.saveButton.getInstance().pushOp(
                        'stylesBundle',
                        scssWizard.deleteStyleChunkAndReturnAllRecompiled(this.state.styleChunksVisible[idx])
                    );
            },
            onMenuClosed: () => {
                this.idxOfOpenMoreMenuChunk = null;
            },
        };
    }
    /**
     * @param {number} i
     * @returns {{formProps: CustomClassStyleEditTitlePopupProps; arrowRefEl: HTMLElement;}}
     * @access private
     */
    createEditTitlePopupCfg(i) {
        const chunk = this.state.styleChunksVisible[i];
        return {
            formProps: {
                currentTitle: chunk.data?.title || extractClassName(chunk),
                onTitleTyped: newTitle => { this.setState({titleUncommitted: newTitle}); },
                onSubmitOrDiscard: isSubmit => {
                    if (isSubmit) {
                        const newTitle = this.state.titleUncommitted;
                        const chunk = this.state.styleChunksVisible[this.state.idxOfOpenPopupListItem];
                        this.emitChunksChanges({data: {
                            ...(chunk.data || {}),
                            title: newTitle,
                        }}, chunk);
                    }
                    this.closeEditTitlePopup();
                },
            },
            arrowRefEl: this.listElRef.current.children[this.idxOfOpenMoreMenuChunk].querySelector('.ͼ1'),
        };
    }
    /**
     * @access private
     */
    closeEditTitlePopup() {
        this.setState({editTitlePopupCfg: null, titleUncommitted: null, idxOfOpenPopupListItem: null});
    }
    /**
     * @param {Array<VisualStylesFormVarDefinition>} newSettings
     * @access private
     */
    emitCustomClassSettingsData(i, newSettings) {
        const current = this.state.styleChunksVisible[i];
        const obj = {
            ...(current.data?.title ? {title: current.data.title}             : {}),
            ...(newSettings         ? {mutationRules: {varDefs: newSettings}} : {}),
        };
        const newAll = scssWizard.updateDevsExistingChunkWithScssChunkAndReturnAllRecompiled(
            {data: Object.keys(obj).length ? obj : null},
            current,
        );
        saveButtonInstance.pushOp('stylesBundle', newAll);
    }
}

/**
 * @returns {Array<StyleChunk>}
 */
function createChunksState() {
    return getAllChunks();
}

/**
 * @returns {Array<StyleChunk>}
 */
function getAllChunks() {
    const chunks = scssWizard.findStyles('custom-class', undefined, ({scope}) =>
        scope.layer === 'dev-styles'
    );
    return chunks;
}

/**
 * @returns {Array<StyleChunk>}
 * @param {boolean} withDot = true
 * @returns {string}
 */
function extractClassName({scss}, withDot = true) {
    const s1 = scss.split(' {')[0];
    return withDot ? s1 : s1.substring(1);
}

/**
 * @param {'add'|'remove'} type
 * @param {string} chunkClass
 * @param {string} blockId
 * @returns {['theBlockTree', Array<Block>, StateChangeUserContext]}
 */
function createAddOrRemoveBlockClassOpArgs(type, chunkClass, blockId) {
    return [
        'theBlockTree',
        blockTreeUtils.createMutation(saveButtonInstance.getChannelState('theBlockTree'), newTreeCopy => {
            const [blockRef] = blockTreeUtils.findBlockMultiTree(blockId, newTreeCopy);
            blockRef.styleClasses = addOrRemoveStyleClass(type, chunkClass, blockRef.styleClasses);
            if (blockRef.styleClasses.startsWith(' ') || blockRef.styleClasses.endsWith(' ') || blockRef.styleClasses.indexOf('  ') > -1) throw new Error('Bad white space');
            return newTreeCopy;
        }),
        {event: 'update-single-block-prop', blockId}
    ];
}

/**
 * @param {'add'|'remove'} type
 * @param {string} chunkClass
 * @param {string} to
 * @returns {string}
 */
function addOrRemoveStyleClass(type, chunkClass, to) {
    const currentAsArr = to.trim().length ? to.split(' ') : [];
    if (type === 'add') {
        const maybeDuplicates = [...currentAsArr, chunkClass];
        return [...new Set(maybeDuplicates)].join(' ');
    }
    const filteredArr = currentAsArr.filter(cls => cls !== chunkClass);
    return filteredArr.length ? filteredArr.join(' ') : '';
}

/**
 * @typedef {{
 *   blockId: string;
 *   stylesStateId: number;
 *   checkIsChunkActive: (chunk: StyleChunk) => boolean;
 *   styleClasses: string;
 * }} CustomClassStylesListProps
 */

export default CustomClassStylesList;
export {extractClassName};
