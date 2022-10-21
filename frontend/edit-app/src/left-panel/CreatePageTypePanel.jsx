import {__, api, http, env, floatingDialog} from '@sivujetti-commons-for-edit-app';
import toasters from '../commons/Toaster.jsx';
import store, {deleteItemsFromOpQueueAfter} from '../store.js';
import OnThisPageSection from './default-panel-sections/OnThisPageSection.jsx';

class CreatePageTypePanel extends preact.Component {
    constructor(props) {
        super(props);
        
        this.state = {layouts: []};//, webpageIsLoaded: false, sectionBIsCollapsed: false, sectionCIsCollapsed: false}; ?? 
        http.get('/api/layouts')
            .then(layouts => { this.setState({layouts}); })
            .catch(env.window.console.error);
    }
    componentWillMount() {

// tood
        floatingDialog.close();
        // todo prevent double
        createPlaceholderPageType()
            .then(pageType => {
                if (!pageType) { toasters.editAppMain(__('Something unexpected happened.'), 'error'); return; }
                this.props.dataFromAdminBackend.pageTypes.push(pageType);
                //
                const pageTypeName = 'Draft';
                const layoutId = '1';
                const ia = '';
                api.webPageIframe.foo(pageTypeName, layoutId, ia, _webPage => {
                    this.setState({temp: ':pseudo/new-page-type'});
                });
            });
    }
    /**
     * @access protected
     */
    componentDidMount() {
        this.formWasSubmitted = false;
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        if (this.formWasSubmitted) return;
        store.dispatch(deleteItemsFromOpQueueAfter('create-new-page-type'));
        http.delete(`/api/page-types/${this.lastCommittedName}/as-placeholder`)
            .then(resp => { if (resp.ok !== 'ok') throw new Error('-'); })
            .catch(env.window.console.error);
    }
    render(_, {temp}) {
        if (!temp) return;
        //console.log('ren',loadedPageSlug);
        return <div>
        <p>Sivuyn luonti</p>
        <OnThisPageSection loadedPageSlug={ temp }/>
        </div>;
    }
}


/**
 * @returns {Promise<PageType|null>}
 */
function createPlaceholderPageType() {
    return http.post(`/api/page-types/as-placeholder`, {dum: 'my'})
        .then(resp => {
            if (resp.ok !== 'ok') throw new Error('-');
            return resp.newEntity;
        })
        .catch(err => {
            window.console.error(err);
            return null;
        });
}

export default CreatePageTypePanel;
