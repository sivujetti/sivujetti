import {__, http, urlUtils, signals, env} from '@sivujetti-commons-for-edit-app';
import {InputGroupInline} from '../commons/Form.jsx';
import toasters from '../commons/Toaster.jsx';
import BlockTrees from '../BlockTrees.jsx';
import store, {deleteItemsFromOpQueueAfter, observeStore, selectCurrentPageDataBundle,
               setOpQueue, createSelectBlockTree, selectOpQueue} from '../store.js';
import {treeToTransferable} from '../Block/utils.js';
import blockTreeUtils from '../blockTreeUtils.js';
import {CountingLinkItemFactory} from '../block-types/Menu/EditForm.jsx';
import {BlockValMutator} from '../BlockEditForm.jsx';

const ID_NONE = '-';
const featureFlagConditionUseReduxBlockTree = window.useReduxBlockTree;

class PageCreateMainPanelView extends preact.Component {
    // pageMetaData;
    // linkedMenuBlockVals;
    // unregisterSignalListener;
    // submitOpResult;
    /**
     * Note to self: getLayouts, initialLayoutId and getMenus are for tests.
     *
     * @param {{cancelAddPage: () => void; pageType: PageType; reRenderWithAnotherLayout: (layoutId: String) => void; blockTreesRef: preact.Ref; noAutoFocus?: Boolean; getLayouts?: () => Promise<Array<Layout>>; initialLayoutId?: String; getMenus?: () => Promise<Array<{block: Block; containingGlobalBlockTree: RawGlobalBlockTree;}>>}} props
     */
    constructor(props) {
        super(props);
        this.pageMetaData = {};
        this.linkedMenuBlockVals = null;
        if (!featureFlagConditionUseReduxBlockTree) {
        this.state = {layouts: [], menuInfos: [], addToMenuId: ID_NONE, currentPage: null};
        } else {
        const state = {layouts: [], menuInfos: [], addToMenuId: ID_NONE, currentPage: selectCurrentPageDataBundle(store.getState()).page};
        if (state.currentPage) this.onLoad();
        else this.unreg = observeStore(s => selectCurrentPageDataBundle(s), value => {
            if (!value.page) return;
            this.setState({currentPage: value.page});
            setTimeout(() => this.onLoad(), 1);
            this.unreg();
        });
        this.state = state;
        }
        if (!featureFlagConditionUseReduxBlockTree) {
        this.unregisterSignalListener = signals.on('on-page-info-form-value-changed',
            /**
             * @param {PageMetaRaw} pageMeta
             * @param {Boolean} _isInit
             */
            (pageMeta, _isInit) => {
                this.pageMetaData = pageMeta;
                if (this.linkedMenuBlockVals) {
                    const parsed = JSON.parse(this.linkedMenuBlockVals.getBlock().tree);
                    const ref = parsed[parsed.length - 1];
                    if (ref.text === pageMeta.title && ref.slug === pageMeta.slug) return;
                    Object.assign(ref, {slug: pathToFullSlug(pageMeta.path), text: pageMeta.title});
                    this.linkedMenuBlockVals.handleSingleValueChanged(JSON.stringify(parsed), 'tree', false, 0, 'debounce-none');
                }
            });
        (props.getLayouts ? props.getLayouts() : http.get('/api/layouts'))
            .then(layouts => {
                this.setState({layouts});
            })
            .catch(env.window.console.error);
        (props.getMenus ? props.getMenus() : http.get('/api/blocks/Menu'))
            .then(menuInfos => {
                this.setState({menuInfos: menuInfos.length
                    ? [{block: {id: ID_NONE}, containingGlobalBlockTree: null}].concat(menuInfos)
                    : []
                });
            })
            .catch(env.window.console.error);
        }
    }
    /**
     * @access private
     */
    onLoad() {
        if (!featureFlagConditionUseReduxBlockTree) {
        store.dispatch(setOpQueue([{opName: 'create-new-page', command: {
            doHandle: this.handleFormSubmitted.bind(this),
            args: []
        }}]));
        } else {
            this.emitCreatePageOp();
        }
        if (this.props.noAutoFocus)
            return;
        setTimeout(() => {
            env.document.querySelector('.block-tree li[data-block-type="PageInfo"] .block-handle').click();
        }, 1);
    }
    /**
     * @access private
     */
    emitCreatePageOp() {
        store.dispatch(setOpQueue([{opName: 'create-new-page', command: {
            doHandle: () => {
                //
                this.unreg = observeStore(s => selectOpQueue(s), queue => {
                    if (queue.length !== 0) return;
                    if (this.submitOpResult)
                        urlUtils.redirect(this.submitOpResult.redirectTo);
                    else
                        this.emitCreatePageOp();
                    this.unreg();
                });
                //
                return this.handleFormSubmitted();
            },
            args: []
        }}]));
    }
    /**
     * @access protected
     */
    componentDidMount() {
        if (!featureFlagConditionUseReduxBlockTree) {
        this.onLoad();
        }
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        store.dispatch(deleteItemsFromOpQueueAfter('create-new-page'));
        if (!featureFlagConditionUseReduxBlockTree) {
        this.unregisterSignalListener();
        }
    }
    /**
     * @access protected
     */
    render({pageType, cancelAddPage, blockTreesRef, initialLayoutId}, {layouts, menuInfos}) {
        const name = __(pageType ? pageType.friendlyName : 'page');
        return !featureFlagConditionUseReduxBlockTree ? <form>
            <header class="panel-section mb-2">
                <h1 class="mb-2">{ __('Create %s', name) }</h1>
                <button
                    onClick={ cancelAddPage }
                    class="btn btn-link btn-sm"
                    title={ __('Cancel add %s', name) }
                    type="button">&lt; { __('Back') }</button>
            </header>
            { layouts.length || menuInfos.length ?
            <section class="panel-section open pt-0"><div class="form-horizontal pt-0">
                <InputGroupInline>
                    <label class="form-label" htmlFor="layout">{ __('Layout') }</label>
                    <select
                        value={ initialLayoutId || (this.getCurrentPage() || {layoutId: '-'}).layoutId }
                        onChange={ e => this.props.reRenderWithAnotherLayout(e.target.value) }
                        class="form-select form-input tight"
                        name="layout"
                        id="layout">{ layouts.map(l =>
                        <option value={ l.id }>{ __(l.friendlyName) }</option>
                    ) }</select>
                </InputGroupInline>
                { menuInfos.length ? <InputGroupInline>
                    <label class="form-label" htmlFor="layout">{ __('Add to menu') }</label>
                    <select
                        value={ this.state.addToMenuId }
                        onChange={ this.handleAddToMenuChanged.bind(this) }
                        class="form-select form-input tight"
                        name="addToMenu"
                        id="addToMenu">{ menuInfos.map(({block, containingGlobalBlockTree}) =>
                        <option value={ block.id }>
                            { containingGlobalBlockTree ? `${containingGlobalBlockTree.name} > ${__('Menu')}` : '-' }
                        </option>
                    ) }</select>
                </InputGroupInline> : null }
            </div></section> : null }
            <section>
                <BlockTrees
                    containingView="CreatePage"
                    ref={ blockTreesRef }/>
            </section>
        </form> : <form>
            <header class="panel-section pb-0">
                <h1 class="mb-2">{ __('Create %s', name) }</h1>
                <button
                    onClick={ cancelAddPage }
                    class="btn btn-link btn-sm"
                    title={ __('Cancel add %s', name) }
                    type="button">&lt; { __('Back') }</button>
            </header>
            <section>
                <BlockTrees
                    containingView="CreatePage"
                    ref={ blockTreesRef }/>
            </section>
        </form>;
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleAddToMenuChanged(e) {
        const newValue = e.target.value;
        if (!featureFlagConditionUseReduxBlockTree) {
        //
        if (this.state.addToMenuId !== ID_NONE && this.linkedMenuBlockVals) {
            const parsed = JSON.parse(this.linkedMenuBlockVals.getBlock().tree);
            this.linkedMenuBlockVals.handleSingleValueChanged(JSON.stringify(parsed.slice(0, parsed.length - 1)), 'tree');
            this.linkedMenuBlockVals = null;
        }
        // Find selected menu's parent GlobalBlockReference block from current blockTree
        const linkedMenuBase = newValue === ID_NONE ? null : (function (menuInfos, blockTreesRef) {
            const info = menuInfos.find(({block}) => block.id === newValue);
            const containingGbtId = info.containingGlobalBlockTree.id;
            const curPageBlocks = blockTreesRef.current.getPageBlocks();
            return blockTreeUtils.findRecursively(curPageBlocks, b => {
                return b.type === 'GlobalBlockReference' && b.globalBlockTreeId === containingGbtId;
            });
        })(this.state.menuInfos, this.props.blockTreesRef);
        //
        if (linkedMenuBase) {
            const block = blockTreeUtils.findBlock(newValue, linkedMenuBase.__globalBlockTree.blocks)[0];
            //
            const linkCreator = new CountingLinkItemFactory();
            const parsed = linkCreator.setGetCounterUsingTreeOf(block);
            const newLink = linkCreator.makeLinkItem({slug: pathToFullSlug(this.pageMetaData.path), text: this.pageMetaData.title});
            parsed.push(newLink);
            //
            const metaProps = {block, base: linkedMenuBase, blockTreeCmp: this.props.blockTreesRef.current.blockTree.current};
            this.linkedMenuBlockVals = new BlockValMutator(metaProps);
            this.linkedMenuBlockVals.handleSingleValueChanged(JSON.stringify(parsed), 'tree', false, 0, 'debounce-none');
        }
        this.setState({addToMenuId: newValue});
        }
    }
    /**
     * @param {Event|undefined} e
     * @returns {Promise<Boolean>}
     * @access private
     */
    handleFormSubmitted(e) {
        if (e) e.preventDefault();
        let data;
        if (!featureFlagConditionUseReduxBlockTree) {
        // {title, slug, path, meta, customField1, customField2 ...}
        data = Object.assign({}, this.pageMetaData);
        data.level = 1;
        data.layoutId = this.getCurrentPage().layoutId;
        data.blocks = this.props.blockTreesRef.current.getPageBlocks();
        data.status = 0;
        } else {
        data = JSON.parse(JSON.stringify(selectCurrentPageDataBundle(store.getState()).page));
        data.blocks = treeToTransferable(createSelectBlockTree('main')(store.getState()).tree);
        this.submitOpResult = null;
        }
        //
        return http.post(`/api/pages/${this.props.pageType.name}`, data).then(resp => {
                if (Array.isArray(resp) && resp[0] === 'Page with identical slug already exists') {
                    toasters.editAppMain(__('Page "%s" already exist.', data.slug), 'error');
                    return true;
                }
                if (resp.ok !== 'ok') throw new Error('-');
                if (!featureFlagConditionUseReduxBlockTree)
                    urlUtils.redirect(`/_edit${pathToFullSlug(data.path, '')}`);
                else
                    this.submitOpResult = {ok: 'ok', redirectTo: `/_edit${pathToFullSlug(data.path, '')}`};
                return true;
            })
            .catch(err => {
                window.console.error(err);
                toasters.editAppMain(__('Something unexpected happened.'), 'error');
                this.form.setIsSubmitting(false);
                return false;
            });
    }
    /**
     * @returns {Page|undefined}
     * @access private
     */
    getCurrentPage() {
        return !featureFlagConditionUseReduxBlockTree
            ? BlockTrees.currentWebPage.data.page
            : this.state.currentPage;
    }
}

/**
 * @param {String} path
 * @param {String} fallback = '/'
 * @returns {String} 'foo/' -> '/foo'
 */
function pathToFullSlug(path, fallback = '/') {
    return path !== '/'
        ? `/${path.substring(0, path.length - 1)}` // 'foo/' -> '/foo'
        : fallback;
}

export default PageCreateMainPanelView;
