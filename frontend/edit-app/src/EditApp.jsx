import {__, signals, urlUtils} from '@sivujetti-commons';
import {Toaster} from '../../commons/Toaster.jsx';
import Icon from '../../commons/Icon.jsx';
import DefaultMainPanelView from './DefaultMainPanelView.jsx';
import AddPageMainPanelView from './AddPageMainPanelView.jsx';
import store, {setCurrentPage, setOpQueue} from './store.js';
import SaveButton from './SaveButton.jsx';

const LEFT_PANEL_WIDTH = 274;

class EditApp extends preact.Component {
    // blockTrees;
    // currentWebPage;
    // resizeHandleEl;
    /**
     * @param {{webPageIframe: WebPageIframe; dataFromAdminBackend: TheWebsite; outerEl: HTMLElement; inspectorPanelEl: HTMLElement;}} props
     */
    constructor(props) {
        super(props);
        this.state = {isCreatePageModeOn: false, blockHoverIconCss: 'display:none'};
        this.blockTrees = null;
        this.currentWebPage = null;
        this.resizeHandleEl = preact.createRef();
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
            this.currentWebPage = dataFromWebPage.page;
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
                    <img src={ urlUtils.makeAssetUrl('/public/sivujetti/assets/sivujetti-logo.png') }/>
                    <span class="d-inline-block ml-1">
                        <span class="d-inline-block col-12">Sivujetti</span>
                        <span>{ __('Admin') }</span>
                    </span>
                </a>
                <SaveButton/>
            </header>
            { !isCreatePageModeOn
                ? <DefaultMainPanelView
                    startAddPageMode={ () =>
                        // Open to iframe to '/_edit/api/_placeholder-page...',
                        // which then triggers this.handleWebPageLoaded() and sets
                        // this.state.isCreatePageModeOn to true
                        webPageIframe.openPlaceholderPage('Pages')
                }/>
                : <AddPageMainPanelView
                    initialPageData={ this.currentWebPage }
                    cancelAddPage={ () => webPageIframe.goBack() }
                    webPageIframe={ webPageIframe }
                    pageType={ this.props.dataFromAdminBackend.pageTypes.find(({name}) => name === this.currentWebPage.type) }/>
            }
            <Toaster id="editAppMain"/>
            <span class="block-hover-icon" style={ blockHoverIconCss }>
                <Icon iconId="settings" className="size-xs"/>
            </span>
            <div class="resize-panel-handle" ref={ this.resizeHandleEl }></div>
        </>;
    }
    /**
     * @access protected
     */
    componentDidMount() {
        const el = this.resizeHandleEl.current;
        const mainPanelEl = this.props.outerEl;
        const iframeEl = this.props.webPageIframe.getEl();
        const inspectorPanelEl = this.props.inspectorPanelEl;
        el.style.transform = `translateX(${mainPanelEl.getBoundingClientRect().width}px`;
        //
        const startTreshold = 2;
        const minWidth = 206;
        let startWidth;
        let startScreenX = null;
        let currentHandle = null;
        //
        el.addEventListener('mousedown', e => {
            if (e.button !== 0) return;
            //
            currentHandle = e.target;
            startWidth = mainPanelEl.getBoundingClientRect().width;
            startScreenX = e.screenX;
            el.classList.add('dragging');
        });
        document.addEventListener('mousemove', e => {
            if (!currentHandle) return;
            //
            let delta = e.screenX - startScreenX;
            if (Math.abs(delta) < startTreshold) return;
            //
            let w = startWidth + delta;
            if (w < minWidth) w = minWidth;
            //
            mainPanelEl.style.width = `${w}px`;
            inspectorPanelEl.style.width = `${w}px`;
            iframeEl.style.width = `calc(100% - ${w}px)`;
            iframeEl.style.transform = `translateX(${w}px)`;
            //
            el.style.transform = `translateX(${w}px)`;
        });
        document.addEventListener('mouseup', () => {
            currentHandle = null;
            el.classList.remove('dragging');
        });
    }
}

export default EditApp;
