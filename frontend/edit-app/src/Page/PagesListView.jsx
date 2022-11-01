import {__, env, http, urlUtils, Icon, LoadingSpinner} from '@sivujetti-commons-for-edit-app';
import ContextMenu from '../commons/ContextMenu.jsx';
import OverlayView from '../commons/OverlayView.jsx';

/**
 * #/pages.
 */
class PagesListView extends preact.Component {
    // contextMenu;
    // slugOfPageWithNavOpened;
    /**
     */
    constructor(props) {
        super(props);
        this.contextMenu = preact.createRef();
        this.slugOfPageWithNavOpened = null;
        this.state = {pages: undefined};
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState({pages: null});
        http.get('/api/pages/Pages')
            .then(pages => { this.setState({pages}); })
            .catch(env.window.console.error);
    }
    /**
     * @access protected
     */
    render(_, {pages}) {
        return <OverlayView>
            <h2>{ __('Pages') }</h2>
            { pages ? <ul class="list table-list">{ pages.length ? pages.map(({title, slug}) =>
                <li class="p-0 p-relative">
                    <button
                        onClick={ e => this.openMoreMenu(slug, e) }
                        class="btn btn-link flex-centered p-absolute"
                        style="right: 0; top: .2rem;"
                        type="button">
                        <Icon iconId="dots" className="size-sm"/>
                    </button>
                    <a
                        class="btn btn-link my-0 col-12 text-left text-ellipsis"
                        href={ urlUtils.makeUrl(`_edit${slug !== '/' ? slug : ''}`) }
                        style="padding: .4rem 2.2rem .4rem .4rem; height: initial;">
                        <span class="h6 my-0 mr-1">{ title }</span>
                        <i class="color-dimmed">{ slug }</i>
                    </a>
                </li>
            ) : <li>{ __('No pages') }</li> }</ul> : <LoadingSpinner/> }
            <ContextMenu
                links={ [
                    {text: __('Duplicate'), title: __('Duplicate page'), id: 'duplicate'},
                    {text: __('Delete'), title: __('Delete page'), id: 'delete'},
                ] }
                onItemClicked={ this.handleContextMenuLinkClicked.bind(this) }
                onMenuClosed={ () => { this.slugOfPageWithNavOpened = null; } }
                position="right"
                ref={ this.contextMenu }/>
        </OverlayView>;
    }
    /**
     * @param {String} pageSlug
     * @param {Event} e
     * @access private
     */
    openMoreMenu(pageSlug, e) {
        this.slugOfPageWithNavOpened = pageSlug;
        this.contextMenu.current.open(e);
    }
    /**
     * @param {ContextMenuLink} link
     * @access private
     */
    handleContextMenuLinkClicked(link) {
        if (link.id === 'duplicate')
            env.window.myRoute(`/pages/${encodeURIComponent(this.slugOfPageWithNavOpened)}/duplicate`);
        else if (link.id === 'delete')
            alert('Not implemented yet');
    }
}

export default PagesListView;
