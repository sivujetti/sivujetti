import {__, signals, urlUtils} from '@sivujetti-commons';
import {Toaster} from '../../commons/Toaster.jsx';
import DefaultMainPanelView from './DefaultMainPanelView.jsx';
import AddPageMainPanelView from './AddPageMainPanelView.jsx';
import {FloatingDialog} from './FloatingDialog.jsx';
import store, {setCurrentPage, setOpQueue} from './store.js';
import SaveButton from './SaveButton.jsx';
import blockTreeUtils from './blockTreeUtils.js';

let LEFT_PANEL_WIDTH = 274;

class EditApp extends preact.Component {
    // blockTrees;
    // currentWebPage;
    // resizeHandleEl;
    // highlightRectEl;
    /**
     * @param {{webPageIframe: WebPageIframe; dataFromAdminBackend: TheWebsite; outerEl: HTMLElement; inspectorPanelRef: preact.Ref;}} props
     */
    constructor(props) {
        super(props);
        this.state = {mode: 'default'};
        this.blockTrees = preact.createRef();
        this.currentWebPage = null;
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
        const dataFromWebPage = webPage.data;
        if (dataFromWebPage.page.isPlaceholderPage && this.state.mode !== 'create-page') {
            this.currentWebPage = dataFromWebPage.page;
            this.setState({mode: !dataFromWebPage.page.isPlaceholderPage ? 'default' : 'create-page'});
        }
        signals.emit('on-web-page-loaded');
        store.dispatch(setCurrentPage({webPage, combinedBlockTree, blockRefs}));
        store.dispatch(setOpQueue([]));
    }
    /**
     * @access protected
     */
    render({webPageIframe}, {mode}) {
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
                    startAddPageMode={ () =>
                        // Open to iframe to '/_edit/api/_placeholder-page...',
                        // which then triggers this.handleWebPageLoaded() and sets
                        // this.state.mode to 'create-page'
                        webPageIframe.openPlaceholderPage('Pages')
                }/>
                : <AddPageMainPanelView
                    blockTreesRef={ this.blockTrees }
                    cancelAddPage={ () => webPageIframe.goBack() }
                    reRenderWithAnotherLayout={ layoutId => {
                        this.setState({mode: 'default'});
                        webPageIframe.openPlaceholderPage(this.currentWebPage.type, layoutId);
                    }}
                    pageType={ this.props.dataFromAdminBackend.pageTypes.find(({name}) => name === this.currentWebPage.type) }/>
            }
            <Toaster id="editAppMain"/>
            <FloatingDialog/>
            <span class="highlight-rect" ref={ this.highlightRectEl }></span>
            <div class="resize-panel-handle" ref={ this.resizeHandleEl }></div>
        </div>;
    }
    /**
     * @access protected
     */
    componentDidMount() {
        const el = this.resizeHandleEl.current;
        const mainPanelEl = this.props.outerEl;
        const iframeEl = this.props.webPageIframe.getEl();
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
 * @param {preact.Ref} highlightRectEl
 * @param {preact.Ref} blockTrees
 * @returns {EditAwareWebPageEventHandlers}
 */
function createWebsiteEventHandlers(highlightRectEl, blockTrees) {
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
        onHoverStarted: (blockRef, r) => {
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
        onClicked: blockRef => {
            const treeCmp = blockTrees.current.blockTree.current;
            const b = findBlockTemp(blockRef, treeCmp);
            signals.emit('on-web-page-block-clicked');
            treeCmp.handleItemClicked(b);
        },
        /**
         * @param {BlockRefComment} blockRef
         */
        onHoverEnded: (blockRef, _r) => {
            setTimeout(() => {
                if (blockRef === prevHoverStartBlockRef) {
                    hideRect();
                }
            }, 80);
        }
    };
}

export default EditApp;
