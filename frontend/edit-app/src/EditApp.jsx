import {__, api, signals, http, env, urlUtils, FloatingDialog, floatingDialog, Icon} from '@sivujetti-commons-for-edit-app';
import toasters, {Toaster} from './commons/Toaster.jsx';
import DefaultMainPanelView from './DefaultView/DefaultMainPanelView.jsx';
import PageCreateMainPanelView from './Page/PageCreateMainPanelView.jsx';
import PageTypeCreateMainPanelView, {createPlaceholderPageType} from './PageType/PageTypeCreateMainPanelView.jsx';
import store, {observeStore, setCurrentPage, setCurrentPageDataBundle, setGlobalBlockTreeBlocksStyles, setPageBlocksStyles,
               setOpQueue, selectGlobalBlockTreeBlocksStyles, selectPageBlocksStyles, selectBlockTypesBaseStyles,
               createSetBlockTree, createBlockTreeReducerPair, createSelectBlockTree} from './store.js';
import SaveButton from './SaveButton.jsx';
import {findBlockTemp} from './BlockTreeOld.jsx';
import {makePath, makeSlug} from './block-types/pageInfo.js';
import blockTreeUtils from './blockTreeUtils.js';

/** @type {EditApp} */
let instance;

let LEFT_PANEL_WIDTH = 318;
const PANELS_HIDDEN_CLS = 'panels-hidden';
const webPageDomUpdaters = new Map;

signals.on('on-block-dnd-global-block-reference-block-drag-started', gbt => {
    if (gbt.blocks[0].isStoredTo !== 'globalBlockTree' || gbt.blocks[0].isStoredToTreeId !== gbt.id)
        throw new Error('globalBlockTree.blocks not initialized');
    instance.createStoreForInnerTree(gbt.id, gbt.blocks);
});

signals.on('on-block-dnd-global-block-reference-block-dropped', trid => {
    instance.registerWebPageDomUpdater(trid);
});

class EditApp extends preact.Component {
    // changeViewOptions;
    // blockTrees;
    // currentWebPage;
    // currentPageData;
    // resizeHandleEl;
    // highlightRectEl;
    // websiteEventHandlers;
    // receivingData;
    /**
     * @param {{dataFromAdminBackend: TheWebsite; outerEl: HTMLElement; inspectorPanelRef: preact.Ref; rootEl: HTMLElement;}} props
     */
    constructor(props) {
        super(props);
        instance = this;
        this.changeViewOptions = [
            {name: 'edit-mode', label: __('Edit mode')},
            {name: 'go-to-web-page', label: __('Exit edit mode')},
        ].concat(props.dataFromAdminBackend.showGoToDashboardMode
            ? {name: 'go-to-dashboard', label: __('Go to dashboard')}
            : []
        ).concat({name: 'log-out', label: __('Log out')});
        if (!window.useReduxBlockTree) { // @featureFlagConditionUseReduxBlockTree
        this.state = {currentMainPanel: 'default', hidePanels: getArePanelsHidden()};
        } else {
        this.state = {currentMainPanel: determineViewNameFrom(env.window.location.href),
                      hidePanels: getArePanelsHidden(),
                      currentPage: null};
        }
        if (this.state.hidePanels) props.rootEl.classList.add(PANELS_HIDDEN_CLS);
        this.blockTrees = preact.createRef();
        this.currentWebPage = null;
        this.currentPageData = null;
        this.resizeHandleEl = preact.createRef();
        this.highlightRectEl = preact.createRef();
        if (!window.useReduxBlockTree) { // @featureFlagConditionUseReduxBlockTree
        this.websiteEventHandlers = createWebsiteEventHandlers(this.highlightRectEl,
                                                               this.blockTrees);
        } else {
        this.websiteEventHandlers = createWebsiteEventHandlers2(this.highlightRectEl,
                                                                this.blockTrees);
        }
        this.receivingData = true;
        this.registerWebPageIframeStylesUpdaters();
    }
    /**
     * @param {EditAppAwareWebPage} webPage
     * @param {Array<RawBlock} combinedBlockTree
     * @param {Array<BlockRefComment>} blockRefs
     * @access public
     */
    handleWebPageLoaded(webPage, combinedBlockTree, blockRefs) {
        this.receivingData = true;
        webPage.setIsMouseListenersDisabled(getArePanelsHidden());
        const webPagePage = webPage.data.page;
        this.currentWebPage = webPage;
        this.currentPageData = webPagePage;
        this.setState({currentMainPanel: !webPagePage.isPlaceholderPage ? 'default' : 'create-page'});
        signals.emit('on-web-page-loaded');
        store.dispatch(setCurrentPage({webPage, combinedBlockTree, blockRefs}));
        store.dispatch(setGlobalBlockTreeBlocksStyles(webPage.data.globalBlocksStyles));
        store.dispatch(setPageBlocksStyles(webPage.data.page.blockStyles));
        store.dispatch(setOpQueue([]));
        this.receivingData = false;
    }
    /**
     * @param {EditAppAwareWebPage2} webPage
     * @param {Map<String, Array<RawBlock2>>|null} trees
     * @access public
     */
    handleWebPageLoaded2(webPage, trees) {
        this.receivingData = true;
        const {data} = webPage;
        delete webPage.data;
        //
        if (webPageDomUpdaters.size) {
            for (const fn of webPageDomUpdaters.values()) fn();
            webPageDomUpdaters.clear();
        }
        this.currentWebPage = webPage;
        webPage.registerEventHandlers2(this.websiteEventHandlers);
        data.page = maybePatchTitleAndSlug(data.page);
        const {page} = data;
        const isDefaultToCreateTrans = this.state.currentMainPanel === 'default' && page.isPlaceholderPage;
        const isCreateToDefaultTrans = this.state.currentMainPanel === 'create-page' && !page.isPlaceholderPage;
        if (this.state.currentPage) signals.emit('on-web-page-changed', page, this.state.currentPage);
        webPage.setIsMouseListenersDisabled(getArePanelsHidden());
        //
        if (trees.keys().next().value !== 'main') throw new Error('Sanity');
        for (const [trid, _] of trees) {
            this.registerWebPageDomUpdater(trid);
        }
        //
        store.dispatch(setCurrentPageDataBundle(data));
        store.dispatch(setGlobalBlockTreeBlocksStyles(data.globalBlocksStyles));
        store.dispatch(setPageBlocksStyles(page.blockStyles));
        store.dispatch(setOpQueue([]));
        //
        for (const [trid, tree] of trees) {
            if (trid === 'main') continue;
            this.createStoreForInnerTree(trid, tree);
        }
        store.dispatch(createSetBlockTree('main')(trees.get('main'), ['init', {}]));
        const newState = {currentPage: page};
        if (isDefaultToCreateTrans) {
            newState.currentMainPanel = 'create-page';
        } else if (isCreateToDefaultTrans) {
            newState.currentMainPanel = 'default';
        }
        this.setState(newState);
        signals.emit('on-web-page-loaded');
        this.receivingData = false;
    }
    /**
     * @access protected
     */
    render(_, {currentPage, currentMainPanel, hidePanels}) {
        const showMainPanel = currentMainPanel === 'default';
        const featureFlagConditionUseReduxBlockTree = window.useReduxBlockTree;
        let pageType = !featureFlagConditionUseReduxBlockTree
            ? this.currentPageData ? this.props.dataFromAdminBackend.pageTypes.find(({name}) => name === this.currentPageData.type) : null
            : currentPage ? this.props.dataFromAdminBackend.pageTypes.find(({name}) => name === currentPage.type) : null;
        const logoUrl = urlUtils.makeAssetUrl('/public/sivujetti/assets/sivujetti-logo.png');
        const t = () => {
            if (!featureFlagConditionUseReduxBlockTree) return !isPlaceholderPageType(pageType);
            return currentMainPanel !== 'create-page-type';
        };
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
                    sections={ Array.from(api.mainPanel.getSections().keys()) }
                    blockTreesRef={ this.blockTrees }
                    startAddPageMode={ () => {
                        // Open to iframe to '/_edit/api/_placeholder-page...',
                        // which then triggers this.handleWebPageLoaded() and sets
                        // this.state.currentMainPanel to 'create-page'
                        api.webPageIframe.openPlaceholderPage('Pages', pageType.defaultLayoutId);
                        floatingDialog.close();
                    } }
                    startAddPageTypeMode={ () => {
                        // todo prevent double
                        createPlaceholderPageType()
                        .then(pageType => {
                            if (!pageType) { toasters.editAppMain(__('Something unexpected happened.'), 'error'); return; }
                            this.props.dataFromAdminBackend.pageTypes.push(pageType);
                            // Does same as startAddPageMode above
                            api.webPageIframe.openPlaceholderPage('Draft');
                            floatingDialog.close();
                        });
                    } }
                    currentWebPage={ this.currentWebPage }/>
                : t()
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
            { !featureFlagConditionUseReduxBlockTree
                ? <span class="highlight-rect" data-adjust-title-from-top="no" ref={ this.highlightRectEl }></span>
                : <span class="highlight-rect" data-position="top-outside" ref={ this.highlightRectEl }></span>
            }
            <div class="resize-panel-handle" ref={ this.resizeHandleEl }></div>
        </div>;
    }
    /**
     * @param {String} trid
     * @access private
     */
    registerWebPageDomUpdater(trid) {
        if (webPageDomUpdaters.has(trid)) return;
        const fn = this.currentWebPage.createBlockTreeChangeListener(trid, blockTreeUtils, api.blockTypes, getTree, this);
        webPageDomUpdaters.set(trid, observeStore(createSelectBlockTree(trid), fn));
    }
    /**
     * @param {String} trid
     * @param {Array<RawBlock2>} tree
     * @access private
     */
    createStoreForInnerTree(trid, tree) {
        const [storeStateKey, reducer] = createBlockTreeReducerPair(trid);
        if (store.reducerManager.has(storeStateKey)) return;
        store.reducerManager.add(storeStateKey, reducer);
        store.dispatch(createSetBlockTree(trid)(tree, ['init', {}]));
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
        const setPanelWidths = (w) => {
            mainPanelEl.style.width = `${w}px`;
            inspectorPanel.resizeX(w);
            iframeEl.style.width = `calc(100% - ${w}px)`;
            iframeEl.style.transform = `translateX(${w}px)`;
            //
            el.style.transform = `translateX(${w}px)`;
        };
        const commitPanelWidths = () => {
            LEFT_PANEL_WIDTH = parseFloat(mainPanelEl.style.width);
        };
        document.addEventListener('mousemove', e => {
            if (!currentHandle) return;
            //
            let delta = e.screenX - startScreenX;
            if (Math.abs(delta) < startTreshold) return;
            //
            let w = startWidth + delta;
            if (w < minWidth) w = minWidth;
            //
            setPanelWidths(w);
        });
        document.addEventListener('mouseup', () => {
            if (currentHandle) commitPanelWidths();
            currentHandle = null;
            el.classList.remove('dragging');
        });
        signals.on('on-block-dnd-opened', () => {
            inspectorPanel = this.props.inspectorPanelRef.current;
            setPanelWidths(LEFT_PANEL_WIDTH + 124);
            commitPanelWidths();
            this.props.rootEl.classList.add('new-block-spawner-opened');
        });
        signals.on('on-block-dnd-closed', () => {
            setPanelWidths(LEFT_PANEL_WIDTH - 124);
            commitPanelWidths();
            this.props.rootEl.classList.remove('new-block-spawner-opened');
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
    /**
     * @access private
     */
    registerWebPageIframeStylesUpdaters() {
        /** @param {Array<RawBlockStyle>} pageBlocksStyles */
        const updateBlockStyles = pageBlocksStyles => {
            if (this.receivingData)
                return;
            pageBlocksStyles.forEach(({blockId, styles}) => {
                this.currentWebPage.updateCssStylesIfChanged('singleBlock', blockId, styles);
            });
        };
        observeStore(s => selectPageBlocksStyles(s), updateBlockStyles.bind(this));

        /** @param {Array<RawGlobalBlockTreeBlocksStyles>} blockTreeBlocksStyles */
        const updateBlockStyles2 = blockTreeBlocksStyles => {
            if (this.receivingData)
                return;
            blockTreeBlocksStyles.forEach(tree => {
                tree.styles.forEach(({blockId, styles}) => {
                    this.currentWebPage.updateCssStylesIfChanged('singleBlock', blockId, styles);
                });
            });
        };
        observeStore(s => selectGlobalBlockTreeBlocksStyles(s), updateBlockStyles2.bind(this));

        /** @param {Array<RawBlockTypeBaseStyles>} blockTypeBaseStyles */
        const updateBlockStyles3 = blockTypeBaseStyles => {
            if (this.receivingData)
                return;
            blockTypeBaseStyles.forEach(({blockTypeName, styles}) => {
                this.currentWebPage.updateCssStylesIfChanged('blockType', blockTypeName, styles);
            });
        };
        observeStore(s => selectBlockTypesBaseStyles(s), updateBlockStyles3.bind(this));
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
            const blockTreeCmp = blockTrees.current.blockTree.current;
            const block = findBlockTemp(blockRef, blockTreeCmp);
            const isNewBlock = blockTreeCmp.isNewBlock(block)[0];
            highlightRectEl.current.setAttribute('data-adjust-title-from-top', r.top > TITLE_LABEL_HEIGHT ? 'no' : 'yes');
            highlightRectEl.current.setAttribute('data-title',
                (block.type !== 'PageInfo' ? '' : `${__('Page title')}: `) + block.title || __(block.type)
            );
            highlightRectEl.current.setAttribute('data-is-new', isNewBlock ? 'y' : 'n');
            prevHoverStartBlockRef = blockRef;
        },
        /**
         * @param {BlockRefComment|null} blockRef
         */
        onClicked(blockRef) {
            signals.emit('on-web-page-click-received');
            if (!blockRef) return;
            const treeCmp = blockTrees.current.blockTree.current;
            const block = findBlockTemp(blockRef, treeCmp);
            signals.emit('on-web-page-block-clicked', block);
            treeCmp.handleItemClicked(block, false);
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
 * @param {preact.Ref} highlightRectEl
 * @returns {EditAwareWebPageEventHandlers2}
 */
function createWebsiteEventHandlers2(highlightRectEl) {
    let prevHoverStartBlockEl = null;
    const TITLE_LABEL_HEIGHT = 18; // at least
    const hideRect = () => {
        highlightRectEl.current.setAttribute('data-title', '');
        highlightRectEl.current.style.cssText = '';
        prevHoverStartBlockEl = null;
    };
    const findBlock = blockEl => {
        const {tree} = createSelectBlockTree(blockEl.getAttribute('data-trid'))(store.getState());
        return blockTreeUtils.findBlock(blockEl.getAttribute('data-block'), tree)[0];
    };
    return {
        /**
         * @param {HTMLElement} blockEl
         * @param {ClientRect} r
         */
        onHoverStarted(blockEl, r) {
            if (prevHoverStartBlockEl === blockEl)
                return;
            highlightRectEl.current.style.cssText = [
                'width:', r.width, 'px;',
                'height:', r.height, 'px;',
                'top:', r.top, 'px;',
                'left:', r.left + LEFT_PANEL_WIDTH, 'px'
            ].join('');
            const block = findBlock(blockEl);
            if (r.top < -TITLE_LABEL_HEIGHT)
                highlightRectEl.current.setAttribute('data-position', 'bottom-inside');
            else if (r.top > TITLE_LABEL_HEIGHT)
                highlightRectEl.current.setAttribute('data-position', 'top-outside');
            else
                highlightRectEl.current.setAttribute('data-position', 'top-inside');
            highlightRectEl.current.setAttribute('data-title',
                (block.type !== 'PageInfo' ? '' : `${__('Page title')}: `) + block.title || __(block.type)
            );
            prevHoverStartBlockEl = blockEl;
        },
        /**
         * @param {HTMLElement|null} blockEl
         */
        onClicked(blockEl) {
            signals.emit('on-web-page-click-received');
            if (!blockEl) return;
            signals.emit('on-web-page-block-clicked', findBlock(blockEl));
        },
        /**
         * @param {HTMLElement} blockEl
         */
        onHoverEnded(blockEl, _r) {
            setTimeout(() => {
                if (blockEl === prevHoverStartBlockEl)
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

/**
 * @param {String} currentUrl
 * @returns {'default'|'create-page'|'create-page-type'}
 */
function determineViewNameFrom(currentUrl) {
    if (currentUrl.indexOf('_placeholder-page/') < 0)
        return 'default';
    return currentUrl.indexOf('_placeholder-page/Draft') < 0
        ? 'create-page'
        : 'create-page-type';
}

/**
 * @param {Page} page
 * @returns {Page}
 */
function maybePatchTitleAndSlug(page) {
    if (page.isPlaceholderPage) {
        page.title = __(page.title);
        page.slug = makeSlug(page.title);
        const pageType = api.getPageTypes().find(({name}) => name === page.type);
        page.path = makePath(page.slug, pageType);
    }
    return page;
}

/**
 * @param {String} trid
 * @returns {Array<RawBlock2>}
 */
function getTree(trid) {
    return createSelectBlockTree(trid)(store.getState()).tree;
}

export default EditApp;
