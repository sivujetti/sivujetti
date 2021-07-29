import {__, signals} from '../../commons/main.js';
import {urlUtils} from '../../commons/utils.js';
import {Toaster} from '../../commons/Toaster.jsx';
import Icon from '../../commons/Icon.jsx';
import DefaultMainPanelView from './DefaultMainPanelView.jsx';
import AddPageMainPanelView from './AddPageMainPanelView.jsx';
import store, {setCurrentPage, setOpQueue} from './store.js';
import SaveButton from './SaveButton.jsx';

const LEFT_PANEL_WIDTH = 242;

class EditApp extends preact.Component {
    // blockTrees;
    // currentWebPageType;
    /**
     * @param {{webPageIframe: WebPageIframe;}} props
     */
    constructor(props) {
        super(props);
        this.state = {isCreatePageModeOn: false, blockHoverIconCss: 'display:none'};
        this.blockTrees = null;
        this.currentWebPageType = null;
        this.websiteEventHandlers = {
            /**
             * @param {HTMLElement} el block._cref.startingCommentNode.nextElement
             */
            onBlockHoverStarted: el => {
                const r = el.getBoundingClientRect();
                const margin = 10;
                this.setState({blockHoverIconCss: `left:${r.left+LEFT_PANEL_WIDTH+margin}px;top:${r.top+margin}px;`});
            },
            /**
             */
            onBlockHoverEnded: () => {
                this.setState({blockHoverIconCss: 'display:none'});
            },
            /**
             * @param {BlockRefComment} blockRef
             */
            onBlockClicked: blockRef => {
                signals.emit('on-web-page-block-clicked', blockRef);
            }
        };
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
        signals.emit('on-web-page-loaded');
        store.dispatch(setCurrentPage({dataFromWebPage, comments, webPage}));
        store.dispatch(setOpQueue([]));
    }
    /**
     * @access protected
     */
    render({webPageIframe}, {isCreatePageModeOn, blockHoverIconCss}) {
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
            <span class="block-hover-icon" style={ blockHoverIconCss }>
                <Icon iconId="settings" className="size-xs"/>
            </span>
        </>;
    }
}

export default EditApp;
