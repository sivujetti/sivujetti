import {
    __,
    api,
    env,
    http,
    Icon,
    LoadingSpinner
} from '@sivujetti-commons-for-edit-app';
import toasters from '../../includes/toasters.jsx';
import OverlayView from '../OverlayView.jsx';
import {openPageDeleteDialog} from '../popups/PageDeleteDialog.jsx';

const pageTypeNamePages = 'Pages';

/**
 * #/pages.
 */
class PagesListView extends preact.Component {
    // infoOfPageWithNavOpened;
    /**
     */
    constructor(props) {
        super(props);
        this.infoOfPageWithNavOpened = null;
        this.state = {pages: undefined};
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState({pages: null});
        http.get(`/api/pages/${pageTypeNamePages}`)
            .then(pages => { this.setState({pages}); })
            .catch(env.window.console.error);
    }
    /**
     * @access protected
     */
    render(_, {pages}) {
        return <OverlayView>
            <h2>{ __('Pages') }</h2>
            <a href="#/pages/create" class="with-icon-inline" style="margin: -.2rem 0 1.2rem;">
                <Icon iconId="circle-plus" className="color-dimmed3 size-sm mr-2"/>
                <span>{ __('Create new %s', __('page')) }</span>
            </a>
            { pages ? <ul class="list table-list">{ pages.length ? pages.map(({title, slug}) =>
                <li class="p-0 p-relative">
                    <button
                        onClick={ e => this.openMoreMenu(slug, title, e) }
                        class="btn btn-link flex-centered p-absolute"
                        style="right: 0; top: .2rem;"
                        type="button">
                        <Icon iconId="dots" className="size-sm"/>
                    </button>
                    <a
                        class="btn btn-link my-0 col-12 text-left text-ellipsis"
                        href={ `#${slug !== '/' ? slug : ''}` }
                        style="padding: .4rem 2.2rem .4rem .4rem; height: initial;">
                        <span class="h6 my-0 mr-1">{ title }</span>
                        <i class="color-dimmed">{ slug }</i>
                    </a>
                </li>
            ) : <li>{ __('No pages') }</li> }</ul> : <LoadingSpinner/> }
        </OverlayView>;
    }
    /**
     * @param {String} pageSlug
     * @param {String} pageTitle
     * @param {Event} e
     * @access private
     */
    openMoreMenu(pageSlug, pageTitle, e) {
        this.infoOfPageWithNavOpened = {pageSlug, pageTitle, pageTypeName: pageTypeNamePages};
        api.contextMenu.open(e, this.createContextMenuController(pageSlug));
    }
    /**
     * @param {String} pageSlug
     * @returns {ContextMenuController}
     * @access private
     */
    createContextMenuController(pageSlug) {
        return {
            getLinks: () => {
                const links = [
                    {text: __('Edit'), title: __('Edit page'), id: 'edit'},
                    {text: __('Duplicate'), title: __('Duplicate page'), id: 'duplicate'},
                    {text: __('Delete'), title: __('Delete page'), id: 'delete'},
                ];
                return pageSlug !== '/' ? links : links.filter(({id}) => id !== 'delete');
            },
            onItemClicked: this.handleContextMenuLinkClicked.bind(this),
            onMenuClosed: () => { this.infoOfPageWithNavOpened = null; },
            placement: 'right',
        };
    }
    /**
     * @param {ContextMenuLink} link
     * @access private
     */
    handleContextMenuLinkClicked(link) {
        const {pageSlug, pageTitle, pageTypeName} = this.infoOfPageWithNavOpened;
        if (link.id === 'edit')
            env.window.myRoute(pageSlug !== '/' ? pageSlug : '');
        if (link.id === 'duplicate')
            env.window.myRoute(`/pages/${encodeURIComponent(pageSlug)}/duplicate`);
        else if (link.id === 'delete') {
            openPageDeleteDialog(pageSlug, pageTitle, () => {
                this.setState({pages: this.state.pages.filter(({slug}) => slug !== pageSlug)});
                toasters.editAppMain(__('Deleted page "%s".', pageTitle), 'success');
            }, pageTypeName);
        }
    }
}

export default PagesListView;
