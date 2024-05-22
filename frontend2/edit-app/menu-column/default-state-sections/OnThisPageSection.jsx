import {
    __,
    api,
    blockTreeUtils,
    ContextMenu,
    env,
    events,
    Icon,
    MenuSectionAbstract,
    urlUtils,
} from '@sivujetti-commons-for-edit-app';
import {openPageDeleteDialog} from '../../main-column/popups/PageDeleteDialog.jsx';
import BlockTree from '../block/BlockTree.jsx';

class OnThisPageSection extends MenuSectionAbstract {
    // blockTreeRef; // public
    // unregistrables;
    // unregisterPageDataGrabber;
    // moreMenuIcon;
    // moreMenu;
    // mouseFocusIsAt;
    // slugOfPageWithNavOpened;
    /**
     * @inheritdoc
     */
    constructor(props) {
        super(Object.assign(props, {initiallyIsCollapsed: props.initiallyIsCollapsed === true}));
        this.blockTreeRef = preact.createRef();
        this.moreMenuIcon = preact.createRef();
        this.moreMenu = preact.createRef();
    }
    /**
     * @access protected
     */
    componentWillMount() {
        // Start waiting for the initial data from the iframe
        this.startInitialPageDataGrabListener();

        // Start listening subsequent theBlockTree's changes
        const subsequentChangesListener = api.saveButton.getInstance().subscribeToChannel('theBlockTree',
            (theTree, _userCtx, ctx) => {
                if (ctx === 'initial') return;
                this.setState({loadedPageBlocks: theTree});
            });

        this.unregistrables = [
            subsequentChangesListener,
            events.on('web-page-click-received',
                (blockId) => {
                    if (!blockId) return;
                    const [block] = blockTreeUtils.findBlockMultiTree(blockId, this.state.loadedPageBlocks);
                    // rodo tämä palauttaa null, jos BlockTree on sisäisesti lisännyt uusia lohkoja -> emittoi uudet lohkot this.loadedPagesLbocks (ja sitten gräbbää ne BlockTeee:n receivepropsissa), jolloin myös blockTreen state.blocks -> props.blocks
                    this.focusToBlockAndEmitBlockTreeClick(block, 'web-page', () => { });
                }
            ),
            events.on('inspector-panel-closed', () => {
                if (this.blockTreeRef.current)
                    this.blockTreeRef.current.deSelectAllBlocks();
            })
        ];
        this.setState({loadedPageBlocks: null, ...createPartialState(this.props.currentPageSlug)});
    }
    /**
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.currentPageSlug !== this.props.currentPageSlug) {
            // Start waiting for new data from the iframe
            this.doUnregisterPageDataGrabber();
            this.startInitialPageDataGrabListener();
            // Update titles
            this.setState(createPartialState(props.currentPageSlug));
        }
    }
    /**
     * @access protected
     */
    componentDidMount() {
        const delta = 20;
        const thisSectionEl = api.menuPanel.getSectionEl('onThisPage');
        const blockTreeBottom = {px: null, invalidateTimeout: null, hasScolledPast: false};
        const updateHasScrolledPastBlockTreeBottomCls = e => {
            if (blockTreeBottom.px === null) {
                blockTreeBottom.px = thisSectionEl.offsetTop + thisSectionEl.getBoundingClientRect().height - delta;
            } else {
                clearTimeout(blockTreeBottom.invalidateTimeout);
                blockTreeBottom.invalidateTimeout = setTimeout(() => { blockTreeBottom.px = null; }, 2000);
            }
            //
            const newHasScollerPast = e.target.scrollTop > blockTreeBottom.px;
            if (newHasScollerPast && !blockTreeBottom.hasScolledPast) {
                e.target.closest('main').classList.add('scrolled-past-main-block-tree');
                blockTreeBottom.hasScolledPast = true;
            } else if (!newHasScollerPast && blockTreeBottom.hasScolledPast) {
                blockTreeBottom.hasScolledPast = false;
                e.target.closest('main').classList.remove('scrolled-past-main-block-tree');
            }
        };
        const scrollEl = thisSectionEl.parentElement; // #edit-app-sections-wrapper
        scrollEl.addEventListener('scroll', updateHasScrolledPastBlockTreeBottomCls);
        this.unregistrables.push(() => {
            scrollEl.removeEventListener('scroll', updateHasScrolledPastBlockTreeBottomCls);
        });
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.doUnregisterPageDataGrabber();
        this.unregistrables.forEach(unreg => unreg());
    }
    /**
     * @param {{[key: String]: any;}} props
     */
    render(_, {isCollapsed, containingView, loadedPageBlocks, title, subtitle}) {
        return <section class={ `on-this-page panel-section mt-0 pl-0 ${isCollapsed ? 'collapsed' : 'open'}` }>
            <button
                class="flex-centered pr-2 pl-1 section-title col-12"
                onClick={ this.handleMainButtonClicked.bind(this) }
                onFocusCapture={ () => { this.mouseFocusIsAt = 'outerButton'; } }
                title={ subtitle.map(p => p !== null ? typeof p === 'string' ? p : p.props.children : '').join('') }
                type="button">
                <Icon iconId="map-pin" className="p-absolute size-sm mr-2 color-purple"/>
                <span class="pl-1 d-block col-12 color-default">
                    <span>
                        { title }
                        { containingView === 'Default'
                            ? <i
                                tabIndex="0"
                                onFocusCapture={ () => { this.mouseFocusIsAt = 'moreMenuIcon'; } }
                                class="btn btn-link btn-sm p-absolute"
                                style="height: 1.12rem; margin-top: -.1rem;"
                                ref={ this.moreMenuIcon }>
                                    <Icon iconId="dots" className="size-xs"/>
                            </i>
                            : null }
                    </span>
                    <span class="text-ellipsis text-tiny col-12">{ subtitle }</span>
                </span>
                <Icon iconId="chevron-right" className="p-absolute size-xs"/>
            </button>
            <BlockTree
                blocks={ loadedPageBlocks }
                containingView={ containingView }
                ref={ this.blockTreeRef }/>
            { containingView === 'Default' ? <ContextMenu
                links={ [
                    {text: __('Duplicate this page'), title: __('Duplicate page'), id: 'duplicate'},
                    {text: __('Delete this page'), title: __('Delete page'), id: 'delete'},
                    {text: __('Show without edit mode'), title: __('Show without edit mode'), id: 'show-without-edit-mode'},
                ] }
                onItemClicked={ this.handleContextMenuLinkClicked.bind(this) }
                onMenuClosed={ () => { this.slugOfPageWithNavOpened = null; } }
                ref={ this.moreMenu }/> : null }
        </section>;
    }
    /**
     * @access private
     */
    startInitialPageDataGrabListener() {
        this.unregisterPageDataGrabber = events.on('webpage-preview-iframe-loaded', () => {
            const theTree = api.saveButton.getInstance().getChannelState('theBlockTree');
            this.doUnregisterPageDataGrabber(); // unregister
            this.setState({loadedPageBlocks: theTree});
        });
    }
    /**
     * @access private
     */
    doUnregisterPageDataGrabber() {
        if (this.unregisterPageDataGrabber) {
            this.unregisterPageDataGrabber();
            this.unregisterPageDataGrabber = null;
        }
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleMainButtonClicked(e)  {
        if (this.mouseFocusIsAt === 'moreMenuIcon' ||
            e.target.tagName === 'I' ||
            (this.moreMenu.current && this.moreMenuIcon.current.contains(e.target)))
            this.openMoreMenu(this.props.currentPageSlug, e);
        else
            this.setState({isCollapsed: !this.state.isCollapsed});
    }
    /**
     * @param {String} pageSlug
     * @param {Event} e
     * @access private
     */
    openMoreMenu(pageSlug, e) {
        this.slugOfPageWithNavOpened = pageSlug;
        this.moreMenu.current.open(e, links =>
            pageSlug !== '/' ? links : links.filter(({id}) => id !== 'delete')
        );
    }
    /**
     * @param {ContextMenuLink} link
     * @access private
     */
    handleContextMenuLinkClicked(link) {
        if (link.id === 'duplicate')
            env.window.myRoute(`/pages/${encodeURIComponent(this.slugOfPageWithNavOpened)}/duplicate`);
        else if (link.id === 'delete') {
            const page = api.saveButton.getInstance().getChannelState('currentPageData');
            openPageDeleteDialog(page.slug, page.title, () => {
                urlUtils.redirect('/_edit');
            });
        } else if (link.id === 'show-without-edit-mode')
            env.window.open(urlUtils.makeUrl(this.slugOfPageWithNavOpened, true), '_blank');
    }
    /**
     * @param {Block} visibleBlock
     * @param {'web-page'|'styles-tab'} clickOrigin
     * @param {() => void} then
     * @access private
     */
    focusToBlockAndEmitBlockTreeClick(visibleBlock, clickOrigin, then) {
        if (this.state.isCollapsed) this.setState({isCollapsed: false});
        if (visibleBlock.type !== 'Text') {
            this.blockTreeRef.current.handleItemClickedOrFocused(visibleBlock, clickOrigin);
            setTimeout(() => {
                api.menuPanel.scrollTo(visibleBlock.id);
                then();
            }, 100);
        } else {
            this.blockTreeRef.current.handleItemClickedOrFocused(visibleBlock, clickOrigin);
            setTimeout(() => {
                api.menuPanel.scrollTo(visibleBlock.id);
                then();
            }, 100);
        }
    }
}

/**
 * @param {String|null} loadedSlug
 * @access private
 */
function createPartialState(loadedSlug) {
    const slug = loadedSlug || '/';
    const containingView = determineViewNameFrom(slug);
    return {
        title: __(containingView !== 'CreatePageType' ? 'On this page' : 'Default content'),
        subtitle: getSubtitle(slug, containingView),
        containingView,
    };
}

/**
 * @param {String} slug
 * @returns {leftPanelName}
 */
function determineViewNameFrom(slug) {
    if (slug.startsWith(':pseudo/'))
        return !slug.endsWith('/new-page-type') ? 'CreatePage' : 'CreatePageType';
    return 'Default';
}

/**
 * @param {String} slug
 * @returns {[String, preact.VNode|null]}
 */
function getSubtitle(slug, containingView) {
    if (containingView === 'Default') {
        const [a, b] = __('Content of page %s', '|').split('|'); // ['Content of page ', ''] or ['', ' -sivun sisältö']
        return a === '' ? [<b>{ slug }</b>, b] : [a, <b>{ slug }</b>];
    }
    //
    return [__(containingView === 'CreatePage' ? 'New page content' : 'Uuden sivutyypin oletussisältö'), null];
}

export default OnThisPageSection;
