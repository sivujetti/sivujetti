import {__, signals, env, urlUtils} from '@sivujetti-commons-for-edit-app';
import Icon from './commons/Icon.jsx';
import toasters, {Toaster} from './commons/Toaster.jsx';
import DefaultMainPanelView from './DefaultMainPanelView.jsx';
import AddPageMainPanelView from './AddPageMainPanelView.jsx';
import CreatePageTypeMainPanelView, {createPlaceholderPageType} from './CreatePageTypeMainPanelView.jsx';
import {FloatingDialog} from './FloatingDialog.jsx';
import store, {setCurrentPage, setOpQueue} from './store.js';
import SaveButton from './SaveButton.jsx';
import blockTreeUtils from './blockTreeUtils.js';
import webPageIframe from './webPageIframe.js';

let LEFT_PANEL_WIDTH = 300;
const PANELS_HIDDEN_CLS = 'panels-hidden';

class EditApp extends preact.Component {
    // changeViewOptions;
    // blockTrees;
    // currentWebPage;
    // currentPageData;
    // resizeHandleEl;
    // highlightRectEl;
    // localLinkClickTimerEl;
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
        );
        this.state = {currentMainPanel: 'default', hidePanels: getArePanelsHidden()};
        if (this.state.hidePanels) props.rootEl.classList.add(PANELS_HIDDEN_CLS);
        this.blockTrees = preact.createRef();
        this.currentWebPage = null;
        this.currentPageData = null;
        this.resizeHandleEl = preact.createRef();
        this.highlightRectEl = preact.createRef();
        this.localLinkClickTimerEl = preact.createRef();
        this.websiteEventHandlers = createWebsiteEventHandlers(this.highlightRectEl,
                                                               this.localLinkClickTimerEl,
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
                            } else if (e.target.value === (this.changeViewOptions[2] || {}).name)
                                env.window.location.href = this.props.dataFromAdminBackend.dashboardUrl;
                            else
                                throw new Error(`Unkown option ${e.target.value}`);
                        } } class="form-select">
                        { this.changeViewOptions.map(({name, label}) =>
                            <option value={ name }>{ label }</option>
                        ) }</select>
                    </span>
                </div>
                <SaveButton/>
            </header>
            { showMainPanel
                ? <DefaultMainPanelView
                    blockTreesRef={ this.blockTrees }
                    startAddPageMode={ () => {
                        // Open to iframe to '/_edit/api/_placeholder-page...',
                        // which then triggers this.handleWebPageLoaded() and sets
                        // this.state.currentMainPanel to 'create-page'
                        webPageIframe.openPlaceholderPage('Pages');
                    } }
                    startAddPageTypeMode={ () => {
                        // todo prevent double
                        createPlaceholderPageType()
                        .then(pageType => {
                            if (!pageType) { toasters.editAppMain(__('Something unexpected happened.'), 'error'); return; }
                            this.props.dataFromAdminBackend.pageTypes.push(pageType);
                            // Does same as startAddPageMode above
                            webPageIframe.openPlaceholderPage('Draft');
                        });
                    } }/>
                : !isPlaceholderPageType(pageType)
                    ? <AddPageMainPanelView
                        blockTreesRef={ this.blockTrees }
                        cancelAddPage={ () => webPageIframe.goBack() }
                        reRenderWithAnotherLayout={ layoutId => {
                            this.setState({currentMainPanel: 'default'});
                            webPageIframe.openPlaceholderPage(this.currentPageData.type, layoutId);
                        } }
                        pageType={ pageType }/>
                    : <CreatePageTypeMainPanelView
                        blockTreesRef={ this.blockTrees }
                        cancelAddPageType={ () => {
                            webPageIframe.goBack(); // This will trigger CreatePageTypeMainPanelView's componentWillUnmount
                        } }
                        onPageTypeCreated={ this.handlePageTypeCreated.bind(this) }
                        pageType={ pageType }/>
            }
            <Toaster id="editAppMain"/>
            <FloatingDialog/>
            <span class="highlight-rect" ref={ this.highlightRectEl }></span>
            <span class="local-link-click-timer" ref={ this.localLinkClickTimerEl }></span>
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
        const iframeEl = webPageIframe.getEl();
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
 * @param {preact.Ref} localLinkClickTimerEl
 * @param {preact.Ref} blockTrees
 * @returns {EditAwareWebPageEventHandlers}
 */
function createWebsiteEventHandlers(highlightRectEl, localLinkClickTimerEl, blockTrees) {
    let prevHoverStartBlockRef = null;
    const hideRect = () => {
        highlightRectEl.current.setAttribute('data-title', '');
        highlightRectEl.current.style.cssText = '';
        prevHoverStartBlockRef = null;
    };
    function findBlockTemp(blockRef, blockTreeCmp = blockTrees.current.blockTree.current) {
        // todo optimize this out by adding isStoredTo to BlockRefComment and then globalBlockTreeBlocks.get(blockRef.treeId)
        let block = blockTreeUtils.findRecursively(blockTreeCmp.getTree(), ({id}) => id === blockRef.blockId);
        if (!block) {
            for (const [_, tree] of blockTreeCmp.getGlobalTrees()) {
                block = blockTreeUtils.findRecursively(tree, ({id}) => id === blockRef.blockId);
                if (block) break;
            }
        }
        return block;
    }
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
            const block = findBlockTemp(blockRef);
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
            signals.emit('on-web-page-block-clicked');
            const base = block.isStoredTo !== 'globalBlockTree'
                ? null
                : blockTreeUtils.findRecursively(blockTrees.current.blockTree.current.getTree(),
                    ({globalBlockTreeId}) => globalBlockTreeId === block.globalBlockTreeId);
            treeCmp.handleItemClicked(block, base);
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
        /**
         * @param {Event} e
         */
        onLocalLinkClickStarted(e) {
            const el = localLinkClickTimerEl.current;
            el.style.left = `${LEFT_PANEL_WIDTH + e.clientX}px`;
            el.style.top = `${e.clientY}px`;
            el.innerHTML = ['<span class="wrapper" data-anim="base wrapper">',
                '<span class="circle" data-anim="base left"></span>',
                '<span class="circle" data-anim="base right"></span>',
            '</span>'].join('');
        },
        /**
         */
        onLocalLinkClickEnded() {
            localLinkClickTimerEl.current.innerHTML = '';
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
