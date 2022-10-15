import {__, env, http, urlUtils, LoadingSpinner} from '@sivujetti-commons-for-edit-app';
import OverlayView from '../commons/OverlayView.jsx';

class PagesListView extends preact.Component {
    /**
     */
    constructor(props) {
        super(props);
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
            { pages ? <ul class="list table-list">{ pages.length ? pages.map(({title, slug}, i) =>
                <li class="p-0"><a
                    class="btn btn-link my-0 col-12 text-left text-ellipsis"
                    href={ urlUtils.makeUrl(`_edit${slug !== '/' ? slug : ''}`) }
                    style="padding: .4rem .6rem .4rem .2rem; height: initial;">
                        <span class="h6 my-0 mr-1">{ title }</span>
                        <i class="color-dimmed">{ slug }</i>
                    </a>
                </li>
            ) : <li>{ __('No pages') }</li> }</ul> : <LoadingSpinner/> }
        </OverlayView>;
    }
}

export default PagesListView;
