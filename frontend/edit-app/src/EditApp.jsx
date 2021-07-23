import {__, signals} from '../../commons/main.js';
import {urlUtils} from '../../commons/utils.js';
import {Toaster} from '../../commons/Toaster.jsx';
import DefaultMainPanelView from './DefaultMainPanelView.jsx';
import AddPageMainPanelView from './AddPageMainPanelView.jsx';
import store, {setCurrentPage, setOpQueue} from './store.js';
import SaveButton from './SaveButton.jsx';

class EditApp extends preact.Component {
    // blockTrees;
    // currentWebPageType;
    /**
     * @param {{webPageIframe: WebPageIframe;}} props
     */
    constructor(props) {
        super(props);
        this.state = {isCreatePageModeOn: false};
        this.blockTrees = null;
        this.currentWebPageType = null;
    }
    /**
     * @param {CurrentPageData} dataFromWebPage
     * @param {Array<BlockRefComment>} comments
     * @param {EditAppAwareWebPage} webPage
     * @access public
     */
    handleWebPageLoaded(dataFromWebPage, comments, webPage) {
        if (dataFromWebPage.page.isPlaceholderPage !== this.state.isCreatePageModeOn) {
            this.currentWebPageType = dataFromWebPage.page.type;
            this.setState({isCreatePageModeOn: dataFromWebPage.page.isPlaceholderPage});
        }
        signals.emit('new-page-loaded');
        store.dispatch(setCurrentPage({dataFromWebPage, comments, webPage}));
        store.dispatch(setOpQueue([]));
    }
    /**
     * @access protected
     */
    render({webPageIframe}, {isCreatePageModeOn}) {
        return <>
            <header class="container d-flex flex-centered">
                <a href={ urlUtils.makeUrl('_edit') } class="column">
                    <img src={ urlUtils.makeAssetUrl('/public/kuura/assets/sivujetti-logo.png') }/>
                    <span class="d-inline-block ml-1">
                        <span class="d-inline-block col-12">Sivujetti</span>
                        <span>{ __('Admin') }</span>
                    </span>
                </a>
                <SaveButton/>
            </header>
            { !isCreatePageModeOn
                ? <DefaultMainPanelView
                    startAddPageMode={ () => webPageIframe.openPlaceholderPage('Pages') }/>
                : <AddPageMainPanelView
                    cancelAddPage={ () => webPageIframe.goBack() }
                    webPageIframe={ webPageIframe }
                    pageType={ this.currentWebPageType }/>
            }
            <Toaster id="editAppMain"/>
        </>;
    }
}

export default EditApp;
