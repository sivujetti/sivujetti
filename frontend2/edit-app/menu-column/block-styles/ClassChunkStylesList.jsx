import {
    __,
    api,
    blockTreeUtils,
    Icon,
    scssWizard,
} from '@sivujetti-commons-for-edit-app';

/** @extends {preact.Component<ClassChunkStylesListProps, any>} */
class ClassChunkStylesList extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        const styleChunksVisible = createChunksState();
        this.setState({
            styleChunksVisible,
            listItemIsOpens: styleChunksVisible.map(() => false),
        });
    }
    /**
     * @param {ClassChunkStylesListProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.stylesStateId !== this.props.stylesStateId) {
            const next = createChunksState();
            if (next.length !== this.state.styleChunksVisible.length)
                this.setState({
                    styleChunksVisible: next,
                    listItemIsOpens: [...this.state.listItemIsOpens, true]
                });
        }
    }
    /**
     * @access protected
     */
    render({currentClasses}, {styleChunksVisible, listItemIsOpens}) {
        const checkCurIsActive = createIsChunkStyleEnabledChecker(currentClasses);
        return [
            <ul class="list styles-list mb-2">{ styleChunksVisible.length
                ? styleChunksVisible.map((chunk, i) => {
                    const curIsActive = checkCurIsActive(chunk);
                    const title = extractClassName(chunk);
                    return <li class={ `mt-1 py-1${!listItemIsOpens[i] ? '' : ' open'}` }>
                        <header class="p-relative">
                            <div>
                                <button onClick={ () => {
                                    this.setState({listItemIsOpens: listItemIsOpens.map((v, i2) => i2 !== i ? v : !v)});
                                } } class="btn with-icon2 row-item no-color d-flex p-1" title={ title }>
                                    <Icon iconId="chevron-down" className="size-xs"/>
                                    <span class="ͼ1 text-ellipsis"><span class="ͼj cm-scroller text-ellipsis">{ title }</span></span>
                                </button>
                                <button onClick={ e => this.openMoreMenu(i, e) } class="btn row-item no-color d-flex p-1" type="button">
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
                            : 'todo'
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
        ];
    }
    /**
     * @access private
     */
    addStyle() {
        const initialScss = `  // ${__('Your code here ...') }\n  color: red;`;
        const prevMax = getAllChunks().reduce((out, chunk) => {
            const c = parseInt(extractClassName(chunk).split('-')[1], 10);
            return c > out ? c : out;
        }, 0);
        const newChunkClass = `c-${prevMax + 1}`;
        const newAll = scssWizard.addNewDevsScssChunkAndReturnAllRecompiled(
            `.${newChunkClass} {${initialScss}}`,
            'custom-class',
        );
        const sb = api.saveButton.getInstance();
        sb.pushOpGroup(
            ['stylesBundle', newAll],
            createAddOrRemoveBlockClassOpArgs('add', newChunkClass, this.props.blockId),
        );
    }
    /**
     * @param {boolean} newIsActive
     * @param {boolean} curIsActive
     * @param {string} chunkClass
     * @access private
     */
    toggleStyleIsActivated(newIsActive, curIsActive, chunkClass) {
        const saveButton = api.saveButton.getInstance();
        if (newIsActive && !curIsActive)
            saveButton.pushOp(...createAddOrRemoveBlockClassOpArgs('add', chunkClass, this.props.blockId));
        else if (curIsActive && !newIsActive)
            saveButton.pushOp(...createAddOrRemoveBlockClassOpArgs('remove', chunkClass, this.props.blockId));
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
    const sb = api.saveButton.getInstance();
    return ['theBlockTree', blockTreeUtils.createMutation(sb.getChannelState('theBlockTree'), newTreeCopy => {
        const [blockRef] = blockTreeUtils.findBlockMultiTree(blockId, newTreeCopy);
        blockRef.styleClasses = addOrRemoveStyleClass(type, chunkClass, blockRef.styleClasses);
        return newTreeCopy;
    }), {event: 'update-single-block-prop', blockId}];
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
 * @typedef {{blockId: string; currentClasses: string; stylesStateId: number;}} ClassChunkStylesListProps
 */

export default ClassChunkStylesList;
