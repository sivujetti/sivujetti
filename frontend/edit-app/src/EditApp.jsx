import {__} from '../../commons/main.js';
import {urlUtils} from '../../commons/utils.js';
import {Toaster} from '../../commons/Toaster.jsx';
import DefaultMainPanelView from './DefaultMainPanelView.jsx';
import AddPageMainPanelView from './AddPageMainPanelView.jsx';
import store, {setCurrentPage} from './store.js';

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
        store.dispatch(setCurrentPage({dataFromWebPage, comments, webPage}));
    }
    /**
     * @access protected
     */
    render({webPageIframe}, {isCreatePageModeOn}) {
        return <>
            <header class="container">
                <a href={ urlUtils.makeUrl('_edit') }>
                    <img src={ urlUtils.makeAssetUrl('/public/kuura/assets/logo-darkmode.png') }/>
                </a>
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
