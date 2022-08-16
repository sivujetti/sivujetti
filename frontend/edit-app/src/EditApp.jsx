import {__, api, signals, http, env, urlUtils, FloatingDialog, floatingDialog, Icon} from '@sivujetti-commons-for-edit-app';
import toasters, {Toaster} from './commons/Toaster.jsx';
import DefaultMainPanelView from './DefaultView/DefaultMainPanelView.jsx';
import PageCreateMainPanelView from './Page/PageCreateMainPanelView.jsx';
import PageTypeCreateMainPanelView, {createPlaceholderPageType} from './PageType/PageTypeCreateMainPanelView.jsx';
import store, {observeStore, setCurrentPageDataBundle, setOpQueue, createSetBlockTree,
               createBlockTreeReducerPair, createSelectBlockTree} from './store.js';
import {observeStore as observeStore2} from './store2.js';
import SaveButton from './SaveButton.jsx';
import {makePath, makeSlug} from './block-types/pageInfo.js';
import blockTreeUtils from './blockTreeUtils.js';
import {toTransferable} from './Block/utils.js';

let LEFT_PANEL_WIDTH = 318;
const PANELS_HIDDEN_CLS = 'panels-hidden';
const webPageUnregistrables = new Map;
let showFirstTimeDragInstructions = !(!env.window.isFirstRun || localStorage.sivujettiDragInstructionsShown === 'yes');

class EditApp extends preact.Component {
    // changeViewOptions;
    // blockTrees;
    // currentWebPage;
    // resizeHandleEl;
    // highlightRectEl;
    // websiteEventHandlers;
    // receivingData;
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
        this.state = {currentMainPanel: determineViewNameFrom(env.window.location.href),
                      hidePanels: getArePanelsHidden(),
                      currentPage: null};
        if (this.state.hidePanels) props.rootEl.classList.add(PANELS_HIDDEN_CLS);
        this.blockTrees = preact.createRef();
        this.currentWebPage = null;
        this.resizeHandleEl = preact.createRef();
        this.highlightRectEl = preact.createRef();
        this.websiteEventHandlers = createWebsiteEventHandlers2(this.highlightRectEl,
                                                                this.blockTrees);
        this.receivingData = true;
    }
    /**
     * @param {EditAppAwareWebPage} webPage
     * @param {Map<String, Array<RawBlock>>|null} trees
     * @access public
     */
    handleWebPageLoaded(webPage, trees) {
        this.receivingData = true;
        const {data} = webPage;
        delete webPage.data;
        //
        if (webPageUnregistrables.size) {
            for (const fn of webPageUnregistrables.values()) fn();
            webPageUnregistrables.clear();
        }
        this.currentWebPage = webPage;
        webPage.registerEventHandlers(this.websiteEventHandlers);
        data.page = maybePatchTitleAndSlug(data.page);
        const {page} = data;
        signals.emit('on-web-page-loading-started', page, this.state.currentPage);
        webPage.setIsMouseListenersDisabled(getArePanelsHidden());
        const newState = {currentPage: page, currentMainPanel: determineViewNameFrom(page)};
        this.setState(newState);
        const dispatchData = () => {
            //
            if (trees.keys().next().value !== 'main') throw new Error('Sanity');
            for (const [trid, _] of trees)
                this.registerWebPageDomUpdater(trid);
            //
            store.dispatch(setCurrentPageDataBundle(data));
            store.dispatch(setOpQueue([]));
            //
            for (const [trid, tree] of trees) {
                if (trid === 'main') continue;
                this.createStoreAndDispatchInnerTree(trid, tree);
            }
            store.dispatch(createSetBlockTree('main')(trees.get('main'), ['init', {}]));
            signals.emit('on-web-page-loaded');
            const fn = this.currentWebPage.createThemeStylesChangeListener();
            webPageUnregistrables.set('themeStyles', observeStore2('themeStyles', fn));
            this.receivingData = false;
        };
        const fromDefaultToCreateOrViceVersa = newState.currentMainPanel.charAt(0) !== this.state.currentMainPanel.charAt(0);
        if (fromDefaultToCreateOrViceVersa)
            setTimeout(() => dispatchData(), 1);
        else
            dispatchData();
    }
    /**
     * @param {String} trid
     * @param {Array<RawBlock>} blocks
     * @access public
     */
    addBlockTree(trid, blocks) {
        if (blocks[0].isStoredTo !== 'globalBlockTree' || blocks[0].isStoredToTreeId !== trid)
            throw new Error('blocks not initialized');
        this.createStoreAndDispatchInnerTree(trid, blocks);
    }
    /**
     * @param {String} trid
     * @access public
     */
    registerWebPageDomUpdaterForBlockTree(trid) {
        this.registerWebPageDomUpdater(trid);
    }
    /**
     * @param {String} trid
     * @access public
     */
    unRegisterWebPageDomUpdaterForBlockTree(trid) {
        const unreg = webPageUnregistrables.get(trid);
        if (!unreg) return;
        unreg();
        webPageUnregistrables.delete(trid);
    }
    /**
     * @param {String} trid
     * @access public
     */
    removeBlockTree(trid) {
        const [storeStateKey, _] = createBlockTreeReducerPair(trid);
        store.reducerManager.remove(storeStateKey);
    }
    /**
     * @access protected
     */
    render(_, {currentPage, currentMainPanel, hidePanels}) {
        const pageType = currentPage ? this.props.dataFromAdminBackend.pageTypes.find(({name}) => name === currentPage.type) : null;
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
            { !showFirstTimeDragInstructions ? null : <div class="drag-instructions-overlay"><div>
                <p class="flex-centered">
                    <Icon iconId="info-circle" className="size-lg mr-2"/>
                    { __('Aloita lisäämään sisältöä raahaamalla') }
                </p>
                <img src={ urlUtils.makeAssetUrl('/public/sivujetti/assets/drag-right-illustration.png') } alt=""/>
                <button onClick={ e => {
                    env.window.localStorage.sivujettiDragInstructionsShown = 'yes';
                    showFirstTimeDragInstructions = false;
                    const el = e.target.closest('.drag-instructions-overlay');
                    el.classList.add('fade-away');
                    setTimeout(() => { el.parentElement.removeChild(el); }, 650);
                } } class="btn btn-primary btn-sm p-absolute" type="button">{ __('Selvä!') }</button>
            </div></div>
            }
            { currentMainPanel === 'default'
                ? <DefaultMainPanelView
                    sections={ Array.from(api.mainPanel.getSections().keys()) }
                    blockTreesRef={ this.blockTrees }
                    startAddPageMode={ () => {
                        // Open to iframe to '/_edit/api/_placeholder-page...',
                        // which then triggers this.handleWebPageLoaded()
                        api.webPageIframe.openPlaceholderPage('Pages', pageType.defaultLayoutId);
                        this.setState({currentMainPanel: 'create-page'});
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
                            this.setState({currentMainPanel: 'create-page-type'});
                            floatingDialog.close();
                        });
                    } }
                    currentWebPage={ this.currentWebPage }/>
                : this.state.currentMainPanel !== 'create-page-type'
                    ? <PageCreateMainPanelView
                        blockTreesRef={ this.blockTrees }
                        cancelAddPage={ () => api.webPageIframe.goBack() }
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
            <span class="highlight-rect" data-position="top-outside" ref={ this.highlightRectEl }></span>
            <div class="resize-panel-handle" ref={ this.resizeHandleEl }></div>
        </div>;
    }
    /**
     * @param {String} trid
     * @access private
     */
    registerWebPageDomUpdater(trid) {
        if (webPageUnregistrables.has(trid)) return;
        const fn = this.currentWebPage.createBlockTreeChangeListener(trid, blockTreeUtils, toTransferable, api.blockTypes, getTree, this);
        webPageUnregistrables.set(trid, observeStore(createSelectBlockTree(trid), fn));
    }
    /**
     * @param {String} trid
     * @param {Array<RawBlock>} tree
     * @access private
     */
    createStoreAndDispatchInnerTree(trid, tree) {
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
        const mutRef = this.props.dataFromAdminBackend.pageTypes.find(({name}) => name === 'Draft');
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
            if (showFirstTimeDragInstructions) env.document.querySelector('.drag-instructions-overlay').style.width =
                `${LEFT_PANEL_WIDTH}px`;
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
}

/**
 * @param {preact.Ref} highlightRectEl
 * @returns {EditAwareWebPageEventHandlers}
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
         * @param {HTMLAnchorElement|null} link
         */
        onClicked(blockEl, link) {
            signals.emit('on-web-page-click-received', blockEl, link);
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
 * @param {String|Page} currentUrlOrPage
 * @returns {'default'|'create-page'|'create-page-type'}
 */
function determineViewNameFrom(currentUrlOrPage) {
    let url;
    if (typeof currentUrlOrPage === 'string') {
        url = currentUrlOrPage;
    } else{
        url = !currentUrlOrPage.isPlaceholderPage ? '' : `_placeholder-page/${currentUrlOrPage.type}`;
    }
    const i = url.indexOf('_placeholder-page/');
    if (i < 0) return 'default';
    return url.substring(i).indexOf('_placeholder-page/Draft') < 0 ? 'create-page' : 'create-page-type';
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
 * @returns {Array<RawBlock>}
 */
function getTree(trid) {
    return createSelectBlockTree(trid)(store.getState()).tree;
}

export default EditApp;
