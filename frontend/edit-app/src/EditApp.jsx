import {__, signals, urlUtils} from '@sivujetti-commons-for-edit-app';
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

class EditApp extends preact.Component {
    // blockTrees;
    // currentWebPage;
    // resizeHandleEl;
    // highlightRectEl;
    // localLinkClickTimerEl;
    /**
     * @param {{dataFromAdminBackend: TheWebsite; outerEl: HTMLElement; inspectorPanelRef: preact.Ref;}} props
     */
    constructor(props) {
        super(props);
        this.state = {mode: 'default'};
        this.blockTrees = preact.createRef();
        this.currentWebPage = null;
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
        const dataFromWebPage = webPage.data;
        if (dataFromWebPage.page.isPlaceholderPage && this.state.mode !== 'create-page') {
            this.currentWebPage = dataFromWebPage.page;
        }
        this.setState({mode: !dataFromWebPage.page.isPlaceholderPage ? 'default' : 'create-page'});
        signals.emit('on-web-page-loaded');
        store.dispatch(setCurrentPage({webPage, combinedBlockTree, blockRefs}));
        store.dispatch(setOpQueue([]));
    }
    /**
     * @access protected
     */
    render(_, {mode}) {
        const showMainPanel = mode === 'default';
        const pageType = showMainPanel ? null : this.props.dataFromAdminBackend.pageTypes.find(({name}) => name === this.currentWebPage.type);
        return <div>
            <header class="container d-flex flex-centered">
                <a href={ urlUtils.makeUrl('_edit') } class="column">
                    <img src={ urlUtils.makeAssetUrl('/public/sivujetti/assets/sivujetti-logo.png') }/>
                    <span class="d-inline-block ml-1">
                        <span class="d-inline-block col-12">Sivujetti</span>
                        <span>{ __('Edit mode') }</span>
                    </span>
                </a>
                <SaveButton/>
            </header>
            { mode === 'default'
                ? <DefaultMainPanelView
                    blockTreesRef={ this.blockTrees }
                    startAddPageMode={ () => {
                        // Open to iframe to '/_edit/api/_placeholder-page...',
                        // which then triggers this.handleWebPageLoaded() and sets
                        // this.state.mode to 'create-page'
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
                            this.setState({mode: 'default'});
                            webPageIframe.openPlaceholderPage(this.currentWebPage.type, layoutId);
                        } }
                        pageType={ pageType }/>
                    : <CreatePageTypeMainPanelView
                        blockTreesRef={ this.blockTrees }
                        cancelAddPageType={ () => { 'todo http.delete(api/page-types/Draft)'; webPageIframe.goBack(); } }
                        onPageTypeCreated={ _submittedData => {
                            // todo mutate this.props.dataFromAdminBackend.pageTypes
                            // todo urlUtils.redirect(`/_edit`);
                        } }
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

export default EditApp;
