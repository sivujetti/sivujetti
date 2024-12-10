import {
    __,
    api,
    env,
    floatingDialog,
    getAllCustomClassChunks,
    Icon,
    scssUtils,
    scssWizard,
    timingUtils,
} from '@sivujetti-commons-for-edit-app';
import CustomClassStyleEditCustomizationsDialog from '../../main-column/popups/CustomClassStyleEditCustomizationsDialog.jsx';
import EditTitlePopup from '../../main-column/popups/CustomClassStyleEditTitlePopup.jsx';
import ScssEditor from './ScssEditor.jsx';
/** @typedef {import('../../main-column/popups/CustomClassStyleEditTitlePopup.jsx').CustomClassStyleEditTitlePopupProps} CustomClassStyleEditTitlePopupProps */

const ccPlaceholder = '@customClass[0]';

let saveButtonInstance;

/** @type {{kind: 'add-style';}|{kind: 'duplicate-style'; chunkIdx: number;}|null} */
let prevAction = null;

/** @extends {preact.Component<CustomClassStylesListProps, ({styleChunksVisible: Array<StyleChunk>} && {[key: string]: any;})>} */
class CustomClassStylesList extends preact.Component {
    // emitChunksChangesThrottled;
    // listElRef;
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
        //
        this.setState({
            styleChunksVisible,
            listItemIsOpens: styleChunksVisible.reduce((out, sc) => ({...out, [sc.id]: false}), {}),
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
            this.setState({
                styleChunksVisible: next,
                listItemIsOpens: (() => {
                    if (!prevAction)
                        return next.reduce((out, sc) => ({...out, [sc.id]: this.state.listItemIsOpens[sc.id] || false}), {});
                    if (prevAction.kind === 'add-style') {
                        prevAction = null;
                        return {[next.at(-1).id]: true, ...this.state.listItemIsOpens};
                    } else if (prevAction.kind === 'duplicate-style') {
                        const {chunkIdx} = prevAction;
                        prevAction = null;
                        const orig = next[chunkIdx];
                        const cloned = next[chunkIdx + 1];
                        return {[orig.id]: false, [cloned.id]: false, ...this.state.listItemIsOpens};
                    }
                })(),
            });
            if (floatingDialog.getCurrentRendererCls() === CustomClassStyleEditCustomizationsDialog)
                floatingDialog.updateRendererProps({
                    currentSettings: next[this.state.idxOfOpenDialogListItem].data?.customizationSettings?.varDefs,
                    onSettingsChanged: newSettings => this.emitCustomClassSettingsData(this.state.idxOfOpenDialogListItem, newSettings),
                });
        }
    }
    /**
     * @access protected
     */
    render({checkIsChunkActive}, {styleChunksVisible, listItemIsOpens, titleUncommitted, idxOfOpenPopupListItem}) {
        return [
            <ul class="list styles-list mb-2" ref={ this.listElRef }>{ styleChunksVisible.length
                ? styleChunksVisible.map((chunk, i) => {
                    const curIsActive = checkIsChunkActive(chunk);
                    const cls = extractClassName(chunk);
                    const title = titleUncommitted && i === idxOfOpenPopupListItem
                        ? titleUncommitted
                        : (chunk.data?.title || cls);
                    return <li class={ `mt-1 py-1${!listItemIsOpens[chunk.id] ? '' : ' open'}` }>
                        <header class="p-relative">
                            <div>
                                <button onClick={ () => {
                                    this.setState({listItemIsOpens: {...listItemIsOpens, [chunk.id]: !listItemIsOpens[chunk.id]}});
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
                        { !listItemIsOpens[chunk.id]
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
                : <div class="mt-2">{ __('No styles') }</div>
            }</ul>,
            <button
                onClick={ () => this.addStyle() }
                class="btn btn-primary btn-sm mr-1"
                type="button">{ __('Add style') }</button>,
        ];
    }
    /**
     * @param {number} toCloneIdx = null
     * @access private
     */
    addStyle(toCloneIdx = null) {
        const newChunkClass = createCustomClassChunkClassNameCreator()();
        const newAll = scssWizard.addNewDevsScssChunkAndReturnAllRecompiled(...(
            toCloneIdx === null ? [
                `.${newChunkClass} {\n  color: red;\n}`,
                'custom-class',
                {associatedBlockTypes: [this.props.blockTypeName]},
            ] : (() => {
                const toClone = this.state.styleChunksVisible[toCloneIdx];
                const oldI = extractClassName(toClone).split('-')[1]; // '.cc-<n>' -> '<n>'
                const newI = newChunkClass.split('-')[1];
                const patchedString = JSON.stringify(toClone)
                    // .scss '.cc-<oldI> {\n' -> '.cc-<newI> {\n'
                    .replace(new RegExp(`"\\.cc-${oldI} `, 'g'), `".cc-${newI} `)
                    // .data.customizationSettings.varDefs[*].varNames 'cc<oldI>_1' -> 'cc<newI>_1'
                    .replace(new RegExp(`"cc${oldI}_`, 'g'), `"cc${newI}_`);
                const patched = JSON.parse(patchedString);
                patched.data.title += `_${__('Copy').toLowerCase()}`;
                return [
                    patched.scss,
                    'custom-class',
                    patched.data,
                    toClone,
                ];
            })()
        ));
        prevAction = !toCloneIdx ? {
            kind: 'add-style'
        } : {
            kind: 'duplicate-style',
            chunkIdx: toCloneIdx,
        };
        saveButtonInstance.pushOpGroup(
            ['stylesBundle', newAll],
            this.createAddOrRemoveBlockClassOp('add', newChunkClass),
        );
    }
    /**
     * @param {string} scss
     * @param {scss?: string; data?: CustomClassStyleChunkData;}} changes
     * @access private
     */
    emitChunksChanges(changes, chunkVisible) {
        const [updatedAll, error] = scssWizard.updateDevsExistingChunkWithScssChunkAndReturnAllRecompiled(
            changes,
            chunkVisible,
        );
        if (!updatedAll) {
            if (error === 'compiled css over 2MB') env.window.alert(error);
            return;
        }
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
            saveButtonInstance.pushOp(...this.createAddOrRemoveBlockClassOp('add', chunkClass));
        else if (curIsActive && !newIsActive)
            saveButtonInstance.pushOp(...this.createAddOrRemoveBlockClassOp('remove', chunkClass));
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
                {text: __('Duplicate'), title: __('Duplicate style'), id: 'duplicate'},
                {text: __('Delete'), title: __('Delete style'), id: 'delete'},
            ]),
            /**
             * @param {ContextMenuLink} link
             */
            onItemClicked: link => {
                const idx = this.idxOfOpenMoreMenuChunk;
                if (link.id === 'edit-title') {
                    this.setState({idxOfOpenPopupListItem: idx});
                    const cfg = this.createEditTitlePopupCfg(idx);
                    api.mainPopper.open(
                        EditTitlePopup,
                        cfg.arrowRefEl,
                        cfg.formProps,
                        {onClose: () => this.clearPopupState(), maxWidth: 174},
                    );
                } else if (link.id === 'edit-settings') {
                    this.setState({idxOfOpenDialogListItem: idx});
                    const currentDefs = this.state.styleChunksVisible[idx].data?.customizationSettings?.varDefs;
                    floatingDialog.open(CustomClassStyleEditCustomizationsDialog, {
                        title: __('Edit customization settings'),
                        height: Math.min((currentDefs || []).length * 86 + 468, window.innerHeight - 48),
                    }, {
                        currentSettings: currentDefs,
                        onSettingsChanged: newSettings => this.emitCustomClassSettingsData(idx, newSettings),
                    });
                } else if (link.id === 'duplicate') {
                    this.addStyle(idx);
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
                    this.clearPopupState();
                    api.mainPopper.close();
                },
            },
            arrowRefEl: this.listElRef.current.children[this.idxOfOpenMoreMenuChunk].querySelector('.ͼ1'),
        };
    }
    /**
     * @access private
     */
    clearPopupState() {
        this.setState({titleUncommitted: null, idxOfOpenPopupListItem: null});
    }
    /**
     * @param {number} i
     * @param {Array<VisualStylesFormVarDefinition>} newSettings
     * @access private
     */
    emitCustomClassSettingsData(i, newSettings) {
        const current = this.state.styleChunksVisible[i];
        const obj = {
            ...(current.data || {}),
            ...(newSettings ? {customizationSettings: {varDefs: maybePatchVarDefs(newSettings, current)}} : {}),
        };
        const newAll = scssWizard.updateDevsExistingChunkWithScssChunkAndReturnAllRecompiled(
            {data: Object.keys(obj).length ? obj : null},
            current,
        )[0];
        saveButtonInstance.pushOp('stylesBundle', newAll);
    }
    /**
     * @param {'add'|'remove'} type
     * @param {string} chunkClass
     * @returns {['theBlockTree', Array<Block>, StateChangeUserContext]|['globalBlockTrees', Array<GlobalBlockTree>, StateChangeUserContext]}
     * @access private
     */
    createAddOrRemoveBlockClassOp(type, chunkClass) {
        return this.props.createUpdateBlockPropOp(this.props.blockId, blockRefMut => {
            const newClasses = addOrRemoveStyleClass(type, chunkClass, blockRefMut.styleClasses);
            if (newClasses.startsWith(' ') || newClasses.endsWith(' ') || newClasses.indexOf('  ') > -1) {
                env.window.console.error('Bad white space', newClasses);
                return {};
            }
            return {styleClasses: newClasses};
        });
    }
}

/**
 * @param {Array<VisualStylesFormVarDefinition>} arr
 * @param {StyleChunk} chunk
 * @returns {Array<VisualStylesFormVarDefinition>}
 */
function maybePatchVarDefs(arr, chunk) {
    return arr.map(v => {
        if (v.varName !== '@pending')
            return v;
        const cls = extractClassName(chunk, false).replace('-', '');
        const next = arr.reduce((out, {varName}) => {
            const c = parseInt(varName.split('_')[1], 10);
            return c > out ? c : out;
        }, 0) + 1;
        return {...v, varName: `${cls}_${next}`};
    });
}

/**
 * @returns {Array<StyleChunk>}
 */
function createChunksState() {
    return getAllCustomClassChunks();
}

/**
 * @param {StyleChunk} scss
 * @param {boolean} withDot = true
 * @returns {string}
 */
function extractClassName({scss}, withDot = true) {
    const s1 = scss.split(' {')[0];
    return withDot ? s1 : s1.substring(1);
}

/**
 * @param {Array<StyleChunk>} curCustomClassChunks = null
 * @returns {() => string}
 */
function createCustomClassChunkClassNameCreator(curCustomClassChunks = null) {
    let max = curCustomClassChunks || getAllCustomClassChunks().reduce((out, chunk) => {
        const cc = extractClassName(chunk);
        const c = parseInt(cc.split('-')[1], 10);
        return c > out ? c : out;
    }, 0);
    return () => {
        max += 1;
        return `cc-${max}`;
    };
}

/**
 * @param {Array<StyleChunk>} curCustomClassChunks = null
 * @returns {(chunk: StyleChunk) => string|false}
 */
function createIsDuplicateCustomClassChunkChecker(curCustomClassChunks = null) {
    const [current, clses] = curCustomClassChunks || getAllCustomClassChunks().reduce((out, {scss}) => {
        const cls = scss.match(/\.cc-[0-9]+/)[0];
        return [
            [...out[0], scssUtils.compileToString(scss.replace(cls, `.${ccPlaceholder}`))],
            [...out[1], cls.substring(1)],
        ];
    }, [[], []]);
    return ({scss}) => {
        const idx = current.indexOf(scssUtils.compileToString(scss));
        return idx > -1 ? clses[idx] : false;
    };
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
 *   blockTypeName: string;
 *   stylesStateId: number;
 *   checkIsChunkActive: (chunk: StyleChunk) => boolean;
 *   createUpdateBlockPropOp: (blockId: string, getChanges: (blockRefMut: Block) => {[key: string]: any;}) => ['theBlockTree', Array<Block>, StateChangeUserContext]|['globalBlockTrees', Array<GlobalBlockTree>, StateChangeUserContext];
 *   styleClasses: string;
 * }} CustomClassStylesListProps
 */

export default CustomClassStylesList;
export {
    ccPlaceholder,
    createCustomClassChunkClassNameCreator,
    createIsDuplicateCustomClassChunkChecker,
    extractClassName,
};
