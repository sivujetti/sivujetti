import {__, http, urlUtils, signals, env} from '@sivujetti-commons-for-edit-app';
import {InputGroupInline} from '../commons/Form.jsx';
import toasters from '../commons/Toaster.jsx';
import BlockTrees from '../BlockTrees.jsx';
import store, {deleteItemsFromOpQueueAfter, setOpQueue} from '../store.js';
import blockTreeUtils from '../blockTreeUtils.js';
import {CountingLinkItemFactory} from '../block-types/Menu/EditForm.jsx';
import {BlockValMutator} from '../BlockEditForm.jsx';

const ID_NONE = '-';

class PageCreateMainPanelView extends preact.Component {
    // pageMetaData;
    // linkedNavBlockVals;
    // unregisterSignalListener;
    /**
     * Note to self: getLayouts and initialLayoutId are for tests.
     *
     * @param {{cancelAddPage: () => void; pageType: PageType; reRenderWithAnotherLayout: (layoutId: String) => void; blockTreesRef: preact.Ref; noAutoFocus?: Boolean; getLayouts?: () => Promise<Array<Layout>>; initialLayoutId?: String;}} props
     */
    constructor(props) {
        super(props);
        this.pageMetaData = {};
        this.linkedNavBlockVals = null;
        this.state = {layouts: [], menuInfos: [], addToMenuId: ID_NONE};
        this.unregisterSignalListener = signals.on('on-page-info-form-value-changed',
            /**
             * @param {PageMetaRaw} pageMeta
             * @param {Boolean} _isInit
             */
            (pageMeta, _isInit) => {
                this.pageMetaData = pageMeta;
                if (this.linkedNavBlockVals) {
                    const parsed = JSON.parse(this.linkedNavBlockVals.getBlock().tree);
                    const ref = parsed[parsed.length - 1];
                    Object.assign(ref, {slug: pageMeta.slug, text: pageMeta.title});
                    this.linkedNavBlockVals.handleValueChanged(JSON.stringify(parsed), 'tree', false, 0, 'debounce-none');
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
    /**
     * @access protected
     */
    componentDidMount() {
        store.dispatch(setOpQueue([{opName: 'create-new-page', command: {
            doHandle: this.handleFormSubmitted.bind(this),
            args: []
        }}]));
        if (!this.props.noAutoFocus) setTimeout(() => {
            env.document.querySelector('.block-tree li[data-block-type="PageInfo"] .block-handle').click();
        }, 1);
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        store.dispatch(deleteItemsFromOpQueueAfter('create-new-page'));
        this.unregisterSignalListener();
    }
    /**
     * @access protected
     */
    render({pageType, cancelAddPage, blockTreesRef, initialLayoutId}, {layouts, menuInfos}) {
        return <form onSubmit={ this.handleFormSubmitted.bind(this) }>
            <header class="panel-section mb-2">
                <h1 class="mb-2">{ __('Create %s', __(pageType.friendlyNameSingular || 'page')) }</h1>
                <button
                    onClick={ cancelAddPage }
                    class="btn btn-link btn-sm"
                    title={ __('Cancel add %s', pageType.name) }
                    type="button">&lt; { __('Back') }</button>
            </header>
            { layouts.length || menuInfos.length ?
            <section class="panel-section open pt-0"><div class="form-horizontal pt-0">
                <InputGroupInline>
                    <label class="form-label" htmlFor="layout">{ __('Layout') }</label>
                    <select
                        value={ initialLayoutId || BlockTrees.currentWebPage.data.page.layoutId }
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
                        onChange={ this.handleAddToNavChanged.bind(this) }
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
        </form>;
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleAddToNavChanged(e) {
        const newValue = e.target.value;
        //
        if (this.state.addToMenuId !== ID_NONE && this.linkedNavBlockVals) {
            const parsed = JSON.parse(this.linkedNavBlockVals.getBlock().tree);
            this.linkedNavBlockVals.handleValueChanged(JSON.stringify(parsed.slice(0, parsed.length - 1)), 'tree');
            this.linkedNavBlockVals = null;
        }
        //
        if (newValue !== ID_NONE) {
            const info = this.state.menuInfos.find(({block}) => block.id === newValue);
            const containingGbtId = info.containingGlobalBlockTree.id;
            // Find selected nav's parent GlobalBlockReference block from current blockTree
            const curPageBlocks = this.props.blockTreesRef.current.getPageBlocks();
            const base = blockTreeUtils.findRecursively(curPageBlocks, b => {
                return b.type === 'GlobalBlockReference' && b.globalBlockTreeId === containingGbtId;
            });
            if (base) { // Current block tree does contain the selected nav
            const block = blockTreeUtils.findBlock(newValue, base.__globalBlockTree.blocks)[0];
            const linkCreator = new CountingLinkItemFactory();
            const parsed = linkCreator.setGetCounterUsingTree(block);
            parsed.push(linkCreator.makeLinkItem({slug: this.pageMetaData.slug, text: this.pageMetaData.title}));
            this.linkedNavBlockVals = new BlockValMutator({block, base, blockTreeCmp: this.props.blockTreesRef.current.blockTree.current});
            this.linkedNavBlockVals.handleValueChanged(JSON.stringify(parsed), 'tree', false, 0, 'debounce-none');
            }
        }
        this.setState({addToMenuId: newValue});
    }
    /**
     * @param {Event|undefined} e
     * @returns {Promise<Boolean>}
     * @access private
     */
    handleFormSubmitted(e) {
        if (e) e.preventDefault();
        // {title, slug, customField1, customField2 ...}
        const data = Object.assign({}, this.pageMetaData);
        data.path = `${data.slug.substr(1)}/`;
        data.level = 1;
        data.layoutId = BlockTrees.currentWebPage.data.page.layoutId;
        data.blocks = this.props.blockTreesRef.current.getPageBlocks();
        data.status = 0;
        //
        return http.post(`/api/pages/${this.props.pageType.name}`, data).then(resp => {
                if (resp.ok !== 'ok') throw new Error('-');
                if (this.props.pageType.name === 'Pages')
                    urlUtils.redirect(`/_edit${data.slug}`);
                else
                    window.console.log('todo');
                return true;
            })
            .catch(err => {
                window.console.error(err);
                toasters.editAppMain(__('Something unexpected happened.'), 'error');
                this.form.setIsSubmitting(false);
                return false;
            });
    }
}

export default PageCreateMainPanelView;
