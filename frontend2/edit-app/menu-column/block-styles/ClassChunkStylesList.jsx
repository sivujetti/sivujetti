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
    render(_, {styleChunksVisible, listItemIsOpens}) {
        return [
            <ul class="list styles-list mb-2">{ styleChunksVisible.length
                ? styleChunksVisible.map((chunk, i) => {
                    const curIsActive = false;
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
                                        onClick={ () => `TODO` }
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
            ['theBlockTree', blockTreeUtils.createMutation(sb.getChannelState('theBlockTree'), newTreeCopy => {
                const [blockRef] = blockTreeUtils.findBlockMultiTree(this.props.blockId, newTreeCopy);
                blockRef.styleClasses = addOrRemoveStyleClass('add', newChunkClass, blockRef.styleClasses);
                return newTreeCopy;
            }), {event: 'update-single-block-prop', blockId: this.props.blockId}]
        );
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
 * @param {string} className
 * @param {string} to
 * @returns {string}
 */
function addOrRemoveStyleClass(type, className, to) {
    const currentAsArr = to.split(' ');
    if (type === 'add') {
        const maybeDuplicates = [...currentAsArr, className];
        return [...new Set(maybeDuplicates)].join(' ');
    }
    const filteredArr = currentAsArr.filter(cls => cls !== className);
    return filteredArr.length ? filteredArr.join(' ') : '';
}

/**
 * @typedef {{blockId: string; stylesStateId: number;}} ClassChunkStylesListProps
 */

export default ClassChunkStylesList;
