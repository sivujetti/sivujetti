import {__, api, http, env} from '@sivujetti-commons-for-edit-app';
import {treeToTransferable} from '../../block/utils.js';
import toasters from '../../commons/Toaster.jsx';
import store, {deleteItemsFromOpQueueAfter, selectCurrentPageDataBundle,
                setCurrentPageDataBundle, setOpQueue} from '../../store.js';
import store2 from '../../store2.js';
import OnThisPageSection from '../panel-sections/OnThisPageSection.jsx';
import {setUpdatableMenuBlockInfo, addLinkToMenu, toTransferable} from '../../block-types/pageInfo.js';
import {saveExistingBlocksToBackend} from '../block/createBlockTreeDndController.js';
import blockTreeUtils from '../block/blockTreeUtils.js';

const STATUS_PUBLISHED = 0;

/**
 * Left-panel for #/pages/create/:pageTypeName?/:layoutId?[?addToMenu='menuBlockId:menuBlockIsStoredToTreeId:pageSlug'].
 */
class PageCreatePanel extends preact.Component {
    // pageType;
    // addToMenuIdInfo;
    // savePageToBackendResult;
    // addToMenuIsInCurrentPage;
    /**
     * @access protected
     */
    componentWillMount() {
        const pageTypeName = this.props.pageTypeName || 'Pages';
        const layoutId = this.props.layoutId || '1';
        this.pageType = api.getPageTypes().find(({name}) => name === pageTypeName);
        const triplet = this.props.matches.addToMenu;
        this.addToMenuIdInfo = !triplet ? null: triplet.split(':').map(input => input.replace(/[^a-zA-Z0-9_/-]/g, ''));
        const slug = this.props.path.startsWith('/pages/create')
            // this.props.path = '/pages/create/:pageTypeName?/:layoutId?'
            ? ''
            // this.props.path = '/pages/:pageSlug/duplicate'
            : this.props.pageSlug;
        api.webPageIframe.renderPlaceholderPage(pageTypeName, layoutId, slug).then(_webPage => {
            this.setState({temp: ':pseudo/new-page'});
            if (this.addToMenuIdInfo) { setTimeout(() => {
                this.addToMenuIsInCurrentPage = setUpdatableMenuBlockInfo(this.addToMenuIdInfo, createMenuLinkFromNewestData());
            }, 200); }
            store.dispatch(setOpQueue([{opName: 'create-new-page', command: {
                doHandle: this.saveNewPageToBackend.bind(this),
                args: []
            }}]));
        });
    }
    /**
     * @access protected
     */
    componentDidMount() {
        api.saveButton.setOnBeforeProcessQueueFn(queue => {
            // Remove all 'update-block-tree##main''s, since they're included in 'create-new-page'
            const out = queue.filter(({opName}) => opName !== 'update-block-tree##main');

            // Add update-block-tree op for `addToMenu` menu (if it was defined)
            if (this.addToMenuIdInfo) {
                const [menuBlockId, menuBlockIsStoredToTreeId, pageSlug] = this.addToMenuIdInfo;
                const innerTree = !this.addToMenuIsInCurrentPage ? null : blockTreeUtils.findTree(menuBlockIsStoredToTreeId, store2.get().theBlockTree);
                out.push({opName: `update-block-tree##${menuBlockIsStoredToTreeId}`, command: {
                    doHandle: () => (innerTree
                        // menu was present in current page
                        ? Promise.resolve([innerTree, null])
                        // menu belongs to another page, fetch it, and merge new nav data into it
                        : http.get(menuBlockIsStoredToTreeId === 'main'
                                ? `/api/pages/Pages${pageSlug !== '/' ? pageSlug : '/-'}`
                                : `/api/global-block-trees/${menuBlockIsStoredToTreeId}`
                            ).then(pageOrGbt => {
                                const withNewMenu = addLinkToMenu(createMenuLinkFromNewestData(),
                                    menuBlockId, menuBlockIsStoredToTreeId, pageOrGbt.blocks);
                                return [withNewMenu, isPage(pageOrGbt) ? pageOrGbt : null];
                            })
                    )
                    .then(([tree, page]) =>
                        saveExistingBlocksToBackend(tree, menuBlockIsStoredToTreeId, page)
                    ),
                    doUndo: () => {
                        // Can't undo
                    },
                    args: [],
                }});
            }

            // Add this op, which will always run last
            if (out.at(-1).opName !== 'finish-page-create')
                out.push({opName: 'finish-page-create', command: {
                    doHandle: () => {
                        const pagePath = this.savePageToBackendResult;
                        env.window.myRoute(pagePath);
                        return Promise.resolve(true);
                    },
                    args: [],
                }});

            return out;
        });
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        api.saveButton.setOnBeforeProcessQueueFn(null);
        store.dispatch(deleteItemsFromOpQueueAfter('create-new-page'));
    }
    /**
     * @access protected
     */
    render(_, {temp}) {
        const nameTrans = __(this.pageType.friendlyName).toLowerCase();
        const BaseStylesSection = api.mainPanel.getSection('baseStyles', true);
        const SupportSection = temp ? api.mainPanel.getSection('plugin:sjorgSupportClient', false) : null;
        return [
            <div>
                <header class="panel-section pb-0">
                    <h1 class="mb-2">{ __('Create %s', nameTrans) }</h1>
                    <button
                        onClick={ () => preactRouter.route('/') }
                        class="btn btn-link btn-sm"
                        title={ __('Cancel create %s', nameTrans) }
                        type="button">&lt; { __('Back') }</button>
                </header>
                { temp ? <OnThisPageSection loadedPageSlug={ temp }/> : null }
            </div>,
            BaseStylesSection
                ? <BaseStylesSection loadingPageSlug={ null} loadedPageSlug={ temp }/>
                : null, // User has no permission to edit styles
            SupportSection
                ? <SupportSection loadingPageSlug={ null} loadedPageSlug={ temp }/>
                : null
        ];
    }
    /**
     * @returns {Promise<Boolean>}
     * @access private
     */
    saveNewPageToBackend() {
        const pageDataBundle = selectCurrentPageDataBundle(store.getState());
        const data = {
            ...toTransferable(pageDataBundle.page, ['id']),
            ...{
                blocks: treeToTransferable(store2.get().theBlockTree, false),
                status: STATUS_PUBLISHED,
                savePageToBackendResult: null,
            }
        };
        this.savePageToBackendResult = null;
        //
        return http.post(`/api/pages/${this.pageType.name}`, data).then(resp => {
                if (Array.isArray(resp) && resp[0] === 'Page with identical slug already exists') {
                    toasters.editAppMain(__('Page "%s" already exist.', data.slug), 'error');
                    return false;
                }
                if (resp.ok !== 'ok') throw new Error('-');
                this.savePageToBackendResult = pathToFullSlug(data.path, '');
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

/**
 * @returns {PartialMenuLink}
 */
function createMenuLinkFromNewestData() {
    const {page} = selectCurrentPageDataBundle(store.getState());
    return {slug: pathToFullSlug(page.path), text: page.title};
}

/**
 * @param {{[key: String]: any;}} obj
 * @returns {Boolean}
 */
function isPage(obj) {
    return typeof obj.slug === 'string' && typeof obj.path === 'string';
}

export default PageCreatePanel;
export {pathToFullSlug};
