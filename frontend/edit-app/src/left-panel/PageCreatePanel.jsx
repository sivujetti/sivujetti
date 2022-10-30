import {__, api, http, urlUtils} from '@sivujetti-commons-for-edit-app';
import {treeToTransferable} from '../Block/utils.js';
import toasters from '../commons/Toaster.jsx';
import store, {createSelectBlockTree, deleteItemsFromOpQueueAfter, observeStore,
                selectCurrentPageDataBundle, selectOpQueue, setCurrentPageDataBundle,
                setOpQueue} from '../store.js';
import OnThisPageSection from './default-panel-sections/OnThisPageSection.jsx';

/**
 * Left-panel for #/pages/create/:pageTypeName?/:layoutId?.
 */
class PageCreatePanel extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        const pageTypeName = this.props.pageTypeName || 'Pages';
        const layoutId = this.props.layoutId || '1';
        this.pageType = api.getPageTypes().find(({name}) => name === pageTypeName);
        api.webPageIframe.renderPlaceholderPage(pageTypeName, layoutId).then(_webPage => {
            this.setState({temp: ':pseudo/new-page'});
            this.overwriteOpQueue();
        });
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
    render(_, {temp}) {
        const name = this.pageType.friendlyName.toLowerCase();
        return <div>
            <header class="panel-section pb-0">
                <h1 class="mb-2">{ __('Create %s', name) }</h1>
                <button
                    onClick={ () => preactRouter.route('/') }
                    class="btn btn-link btn-sm"
                    title={ __('Cancel create %s', name) }
                    type="button">&lt; { __('Back') }</button>
            </header>
            { temp ? <OnThisPageSection loadedPageSlug={ temp }/> : null }
        </div>;
    }
    /**
     * @access private
     */
    overwriteOpQueue() {
        store.dispatch(setOpQueue([{opName: 'create-new-page', command: {
            doHandle: () => {
                const unreg = observeStore(selectOpQueue, queue => {
                    if (queue.length !== 0) return;
                    unreg();
                    // this.saveNewPageToBackend was succesful, proceed normally
                    if (this.submitOpResult)
                        urlUtils.redirect(this.submitOpResult.redirectTo);
                    // Something happened during this.saveNewPageToBackend, ovewrite the opQueue to [<createNewPageCms>] again
                    else
                        this.overwriteOpQueue();
                });
                //
                return this.saveNewPageToBackend();
            },
            args: []
        }}]));
    }
    /**
     * @returns {Promise<Boolean>}
     * @access private
     */
    saveNewPageToBackend() {
        const pageDataBundle = selectCurrentPageDataBundle(store.getState());
        const data = JSON.parse(JSON.stringify(pageDataBundle.page));
        delete data.id;
        data.blocks = treeToTransferable(createSelectBlockTree('main')(store.getState()).tree);
        this.submitOpResult = null;
        data.status = 0;
        //
        return http.post(`/api/pages/${this.pageType.name}`, data).then(resp => {
                if (Array.isArray(resp) && resp[0] === 'Page with identical slug already exists') {
                    toasters.editAppMain(__('Page "%s" already exist.', data.slug), 'error');
                    return true;
                }
                if (resp.ok !== 'ok') throw new Error('-');
                this.submitOpResult = {ok: 'ok', redirectTo: `/_edit#${pathToFullSlug(data.path, '')}`};
                pageDataBundle.page.id = resp.insertId;
                setCurrentPageDataBundle(pageDataBundle);
                return true;
            })
            .catch(err => {
                window.console.error(err);
                toasters.editAppMain(__('Something unexpected happened.'), 'error');
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

export default PageCreatePanel;
export {pathToFullSlug};
