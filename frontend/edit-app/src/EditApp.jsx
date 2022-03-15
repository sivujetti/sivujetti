import {__, api, signals, http, env, urlUtils, FloatingDialog, Icon} from '@sivujetti-commons-for-edit-app';
import toasters, {Toaster} from './commons/Toaster.jsx';
import DefaultMainPanelView from './DefaultView/DefaultMainPanelView.jsx';
import PageCreateMainPanelView from './Page/PageCreateMainPanelView.jsx';
import PageTypeCreateMainPanelView, {createPlaceholderPageType} from './PageType/PageTypeCreateMainPanelView.jsx';
import store, {setCurrentPage, setOpQueue} from './store.js';
import SaveButton from './SaveButton.jsx';
import {findBlockTemp} from './BlockTree.jsx';

let LEFT_PANEL_WIDTH = 300;
const PANELS_HIDDEN_CLS = 'panels-hidden';

class EditApp extends preact.Component {
    // changeViewOptions;
    // blockTrees;
    // currentWebPage;
    // currentPageData;
    // resizeHandleEl;
    // highlightRectEl;
    /**
     * @param {{dataFromAdminBackend: TheWebsite; outerEl: HTMLElement; inspectorPanelRef: preact.Ref; rootEl: HTMLElement;}} props
     */
    constructor(props) {
        super(props);
        this.changeViewOptions = [
            {name: 'edit-mode', label: __('Edit mode')},
            {name: 'go-to-web-page', label: __('Exit edit mode')},
        ].concat(props.dataFromAdminBackend.showGoToDashboardMode
            ? {name: 'go-to-dashboard', label: __('Go to dashboard')}
            : []
        ).concat({name: 'log-out', label: __('Log out')});
        this.state = {currentMainPanel: 'default', hidePanels: getArePanelsHidden()};
        if (this.state.hidePanels) props.rootEl.classList.add(PANELS_HIDDEN_CLS);
        this.blockTrees = preact.createRef();
        this.currentWebPage = null;
        this.currentPageData = null;
        this.resizeHandleEl = preact.createRef();
        this.highlightRectEl = preact.createRef();
        this.websiteEventHandlers = createWebsiteEventHandlers(this.highlightRectEl,
                                                               this.blockTrees);
    }
    /**
     * @param {EditAppAwareWebPage} webPage
     * @param {Array<RawBlock} combinedBlockTree
     * @param {Array<BlockRefComment>} blockRefs
     * @access public
     */
    handleWebPageLoaded(webPage, combinedBlockTree, blockRefs) {
        webPage.setIsMouseListenersDisabled(getArePanelsHidden());
        const webPagePage = webPage.data.page;
        this.currentWebPage = webPage;
        if (webPagePage.isPlaceholderPage && this.state.currentMainPanel !== 'create-page') {
            this.currentPageData = webPagePage;
        }
        this.setState({currentMainPanel: !webPagePage.isPlaceholderPage ? 'default' : 'create-page'});
        signals.emit('on-web-page-loaded');
        store.dispatch(setCurrentPage({webPage, combinedBlockTree, blockRefs}));
        store.dispatch(setOpQueue([]));
    }
    /**
     * @access protected
     */
    render(_, {currentMainPanel, hidePanels}) {
        const showMainPanel = currentMainPanel === 'default';
        const pageType = showMainPanel ? null : this.props.dataFromAdminBackend.pageTypes.find(({name}) => name === this.currentPageData.type);
        const logoUrl = urlUtils.makeAssetUrl('/public/sivujetti/assets/sivujetti-logo.png');
        return <div>
            { !hidePanels ? null : <a onClick={ e => (e.preventDefault(), this.handlePanelsAreHiddenChanged(false)) } id="back-to-edit-corner" href="">
                <img src={ logoUrl }/>
                <Icon iconId="arrow-back-up"/>
            </a> }
            <header class={ !hidePanels ? 'd-flex' : 'd-none' }>
                <div class="mode-chooser ml-2 d-flex p-1" style="margin-bottom: -.2rem; margin-top: .1rem;">
                    <a href={ urlUtils.makeUrl('_edit') } class="d-inline-block mr-1">
                        <img src={ logoUrl }/>
                    </a>
                    <span class="d-inline-block ml-1">
                        <span class="d-block">Sivujetti</span>
                        <select value={ this.changeViewOptions[!hidePanels ? 0 : 1].name } onChange={ e => {
                            if (e.target.value === this.changeViewOptions[1].name) {
                                this.handlePanelsAreHiddenChanged(true);
                            } else if (e.target.value === (this.changeViewOptions[this.changeViewOptions.length - 1]).name)
                                this.logUserOut();
                             else if (e.target.value === (this.changeViewOptions[2] || {}).name)
                                env.window.location.href = this.props.dataFromAdminBackend.dashboardUrl;
                            else
                                throw new Error(`Unkown option ${e.target.value}`);
                        } } class="form-select">
                        { this.changeViewOptions.map(({name, label}) =>
                            <option value={ name }>{ label }</option>
                        ) }</select>
                    </span>
                </div>
                <SaveButton mainPanelOuterEl={ this.props.outerEl }/>
            </header>
            { showMainPanel
                ? <DefaultMainPanelView
                    sections={ ['content', 'globalStyles'] }
                    blockTreesRef={ this.blockTrees }
                    startAddPageMode={ () => {
                        // Open to iframe to '/_edit/api/_placeholder-page...',
                        // which then triggers this.handleWebPageLoaded() and sets
                        // this.state.currentMainPanel to 'create-page'
                        api.webPageIframe.openPlaceholderPage('Pages');
                    } }
                    startAddPageTypeMode={ () => {
                        // todo prevent double
                        createPlaceholderPageType()
                        .then(pageType => {
                            if (!pageType) { toasters.editAppMain(__('Something unexpected happened.'), 'error'); return; }
                            this.props.dataFromAdminBackend.pageTypes.push(pageType);
                            // Does same as startAddPageMode above
                            api.webPageIframe.openPlaceholderPage('Draft');
                        });
                    } }
                    currentWebPage={ this.currentWebPage }/>
                : !isPlaceholderPageType(pageType)
                    ? <PageCreateMainPanelView
                        blockTreesRef={ this.blockTrees }
                        cancelAddPage={ () => api.webPageIframe.goBack() }
                        reRenderWithAnotherLayout={ layoutId => {
                            this.setState({currentMainPanel: 'default'});
                            api.webPageIframe.openPlaceholderPage(this.currentPageData.type, layoutId);
                        } }
                        pageType={ pageType }/>
                    : <PageTypeCreateMainPanelView
                        blockTreesRef={ this.blockTrees }
                        cancelAddPageType={ () => {
                            api.webPageIframe.goBack(); // This will trigger PageTypeCreateMainPanelView's componentWillUnmount
                        } }
                        onPageTypeCreated={ this.handlePageTypeCreated.bind(this) }
                        pageType={ pageType }/>
            }
            <Toaster id="editAppMain"/>
            <FloatingDialog/>
            <span class="highlight-rect" data-adjust-title-from-top="no" ref={ this.highlightRectEl }></span>
            <div class="resize-panel-handle" ref={ this.resizeHandleEl }></div>
        </div>;
    }
    /**
     * @param {PageType} submittedData
     * @access private
     */
    handlePageTypeCreated(submittedData) {
        const mutRef = this.props.dataFromAdminBackend.pageTypes.find(({name}) => name === this.currentPageData.type);
        Object.assign(mutRef, submittedData);
        //
        toasters.editAppMain(`${__('Created new %s', __('page type'))}.`, 'success');
        //
        urlUtils.redirect('/_edit');
    }
    /**
     * @access protected
     */
    componentDidMount() {
        const el = this.resizeHandleEl.current;
        const mainPanelEl = this.props.outerEl;
        const iframeEl = api.webPageIframe.getEl();
        el.style.transform = `translateX(${mainPanelEl.getBoundingClientRect().width}px`;
        //
        const startTreshold = 2;
        const minWidth = 206;
        let startWidth;
        let startScreenX = null;
        let currentHandle = null;
        let inspectorPanel = null;
        //
        el.addEventListener('mousedown', e => {
            if (e.button !== 0) return;
            //
            currentHandle = e.target;
            startWidth = mainPanelEl.getBoundingClientRect().width;
            startScreenX = e.screenX;
            el.classList.add('dragging');
            inspectorPanel = this.props.inspectorPanelRef.current;
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
            inspectorPanel.resizeX(w);
            iframeEl.style.width = `calc(100% - ${w}px)`;
            iframeEl.style.transform = `translateX(${w}px)`;
            //
            el.style.transform = `translateX(${w}px)`;
        });
        document.addEventListener('mouseup', () => {
            if (currentHandle) LEFT_PANEL_WIDTH = parseFloat(mainPanelEl.style.width);
            currentHandle = null;
            el.classList.remove('dragging');
        });
    }
    /**
     * @param {Boolean} to
     * @access private
     */
    handlePanelsAreHiddenChanged(to) {
        this.currentWebPage.setIsMouseListenersDisabled(to);
        this.props.rootEl.classList.toggle(PANELS_HIDDEN_CLS);
        env.window.localStorage.sivujettiDoHidePanels = to ? 'yes' : 'no';
        this.setState({hidePanels: to});
    }
    /**
     * @access private
     */
    logUserOut() {
        http.post('/api/auth/logout')
            .then(() => {
                urlUtils.redirect('/');
            })
            .catch(err => {
                window.console.error(err);
                toasters.editAppMain(__('Something unexpected happened.'), 'error');
            });
    }
}

/**
 * @param {PageType} pageType
 * @returns {Boolean}
 */
function isPlaceholderPageType(pageType) {
    const pageTypeStatus = Object.freeze({
        STATUS_COMPLETE: 0,
        STATUS_DRAFT: 1,
    });
    return (pageType.status) === pageTypeStatus.STATUS_DRAFT;
}

/**
 * @param {preact.Ref} highlightRectEl
 * @param {preact.Ref} blockTrees
 * @returns {EditAwareWebPageEventHandlers}
 */
function createWebsiteEventHandlers(highlightRectEl, blockTrees) {
    let prevHoverStartBlockRef = null;
    const TITLE_LABEL_HEIGHT = 18; // at least
    const hideRect = () => {
        highlightRectEl.current.setAttribute('data-title', '');
        highlightRectEl.current.style.cssText = '';
        prevHoverStartBlockRef = null;
    };
    return {
        /**
         * @param {BlockRefComment} blockRef
         * @param {ClientRect} r
         */
        onHoverStarted(blockRef, r) {
            if (prevHoverStartBlockRef === blockRef)
                return;
            highlightRectEl.current.style.cssText = [
                'width:', r.width, 'px;',
                'height:', r.height, 'px;',
                'top:', r.top, 'px;',
                'left:', r.left + LEFT_PANEL_WIDTH, 'px'
            ].join('');
            const block = findBlockTemp(blockRef, blockTrees.current.blockTree.current);
            highlightRectEl.current.setAttribute('data-adjust-title-from-top', r.top > TITLE_LABEL_HEIGHT ? 'no' : 'yes');
            highlightRectEl.current.setAttribute('data-title',
                (block.type !== 'PageInfo' ? '' : `${__('Page title')}: `) + block.title || __(block.type)
            );
            prevHoverStartBlockRef = blockRef;
        },
        /**
         * @param {BlockRefComment} blockRef
         */
        onClicked(blockRef) {
            const treeCmp = blockTrees.current.blockTree.current;
            const block = findBlockTemp(blockRef, treeCmp);
            signals.emit('on-web-page-block-clicked', block);
            treeCmp.handleItemClicked(block);
        },
        /**
         * @param {BlockRefComment} blockRef
         */
        onHoverEnded(blockRef, _r) {
            setTimeout(() => {
                if (blockRef === prevHoverStartBlockRef)
                    hideRect();
            }, 80);
        },
    };
}

/**
 * @returns {Boolean}
 */
function getArePanelsHidden() {
    return env.window.localStorage.sivujettiDoHidePanels === 'yes';
}

export default EditApp;
