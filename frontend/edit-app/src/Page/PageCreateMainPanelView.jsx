import {__, http, urlUtils} from '@sivujetti-commons-for-edit-app';
import toasters from '../commons/Toaster.jsx';
import store, {deleteItemsFromOpQueueAfter, observeStore, selectCurrentPageDataBundle,
               setOpQueue, createSelectBlockTree, selectOpQueue, setCurrentPageDataBundle} from '../store.js';
import {treeToTransferable} from '../Block/utils.js';
import OnThisPageSection from '../DefaultView/OnThisPageSection.jsx';

class PageCreateMainPanelView extends preact.Component {
    // submitOpResult;
    /**
     * Note to self: getLayouts, initialLayoutId and getMenus are for tests.
     *
     * @param {{cancelAddPage: () => void; pageType: PageType; blockTreesRef: preact.Ref; getLayouts?: () => Promise<Array<Layout>>; initialLayoutId?: String; getMenus?: () => Promise<Array<{block: Block; containingGlobalBlockTree: RawGlobalBlockTree;}>>}} props
     */
    constructor(props) {
        super(props);
        this.state = {currentPage: null};
    }
    /**
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.pageType && !this.state.currentPage) this.onLoad(props.pageType);
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        store.dispatch(deleteItemsFromOpQueueAfter('create-new-page'));
    }
    /**
     * @access protected
     */
    render({pageType, cancelAddPage, blockTreesRef}) {
        const name = __(pageType ? pageType.friendlyName : 'page');
        return <form class="page-create">
            <header class="panel-section pb-0">
                <h1 class="mb-2">{ __('Create %s', name) }</h1>
                <button
                    onClick={ cancelAddPage }
                    class="btn btn-link btn-sm"
                    title={ __('Cancel add %s', name) }
                    type="button">&lt; { __('Back') }</button>
            </header>
            <OnThisPageSection containingView="CreatePage" blockTreesRef={ blockTreesRef }/>
        </form>;
    }
    /**
     * @access private
     */
    onLoad() {
        this.setState({currentPage: selectCurrentPageDataBundle(store.getState()).page});
        store.dispatch(setOpQueue([{opName: 'create-new-page', command: {
            doHandle: () => {
                //
                this.unreg = observeStore(selectOpQueue, queue => {
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
     * @param {Event|undefined} e
     * @returns {Promise<Boolean>}
     * @access private
     */
    handleFormSubmitted(e) {
        if (e) e.preventDefault();
        let data;
        let pageDataBundle;
        pageDataBundle = selectCurrentPageDataBundle(store.getState());
        data = JSON.parse(JSON.stringify(pageDataBundle.page));
        delete data.id;
        data.blocks = treeToTransferable(createSelectBlockTree('main')(store.getState()).tree);
        this.submitOpResult = null;
        data.status = 0;
        //
        return http.post(`/api/pages/${this.props.pageType.name}`, data).then(resp => {
                if (Array.isArray(resp) && resp[0] === 'Page with identical slug already exists') {
                    toasters.editAppMain(__('Page "%s" already exist.', data.slug), 'error');
                    return true;
                }
                if (resp.ok !== 'ok') throw new Error('-');
                this.submitOpResult = {ok: 'ok', redirectTo: `/_edit${pathToFullSlug(data.path, '')}`};
                pageDataBundle.page.id = resp.insertId;
                setCurrentPageDataBundle(pageDataBundle);
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
