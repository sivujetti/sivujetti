import {
    __,
    api,
    blockTreeUtils,
    env,
    events,
    Icon,
    MenuSectionAbstract,
    urlUtils,
} from '@sivujetti-commons-for-edit-app';
import {openPageDeleteDialog} from '../../main-column/popups/PageDeleteDialog.jsx';
import {isMainColumnViewUrl} from '../../main-column/MainColumnViews.jsx';
import BlockTree from '../block/BlockTree.jsx';

class OnThisPageSection extends MenuSectionAbstract {
    // blockTreeRef; // public
    // unregistrables;
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
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.unregistrables = [
            api.saveButton.getInstance().subscribeToChannel('theBlockTree',
            (theTree, _userCtx, _ctx) => {
                const latest = this.props.currentPageSlug;
                const loaded = this.state.loadedBlocksPageUrl;
                this.setState({
                    loadedPageBlocks: theTree,
                    loadedBlocksPageUrl: latest,
                    ...(loaded === null || (!isMainColumnViewUrl(latest) && loaded !== latest))
                        ? createTitlesState(latest)
                        : {}
                });
            }),
            events.on('web-page-click-received',
                (blockId) => {
                    if (!blockId) return;
                    if (!this.state.loadedPageBlocks?.length) return;
                    const [block] = blockTreeUtils.findBlockMultiTree(blockId, this.state.loadedPageBlocks);
                    this.focusToBlockAndEmitBlockTreeClick(block, 'web-page', () => { });
                }
            ),
            events.on('inspector-panel-closed', () => {
                if (this.blockTreeRef.current)
                    this.blockTreeRef.current.deSelectAllBlocks();
            })
        ];
        this.setState({
            loadedPageBlocks: null,
            loadedBlocksPageUrl: null,
            ...createTitlesState(this.props.currentPageSlug)
        });
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
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
        </section>;
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleMainButtonClicked(e)  {
        if (this.mouseFocusIsAt === 'moreMenuIcon' ||
            e.target.tagName === 'I' ||
            this.moreMenuIcon?.current?.contains(e.target))
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
        api.contextMenu.open(e, this.createContextMenuController(pageSlug));
    }
    /**
     * @param {String} pageSlug
     * @returns {ContextMenuController}
     * @access private
     */
    createContextMenuController(pageSlug) {
        return {
            getLinks: () => {
                const links = [
                    {text: __('Duplicate this page'), title: __('Duplicate page'), id: 'duplicate'},
                    {text: __('Delete this page'), title: __('Delete page'), id: 'delete'},
                    {text: __('Show without edit mode'), title: __('Show without edit mode'), id: 'show-without-edit-mode'},
                ];
                return pageSlug !== '/' ? links : links.filter(({id}) => id !== 'delete');
            },
            onItemClicked: this.handleContextMenuLinkClicked.bind(this),
            onMenuClosed: () => { this.slugOfPageWithNavOpened = null; },
        };
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
                urlUtils.redirect('/_edit&show-message=page-deleted', true);
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
 * @param {String|null} currentPageSlug
 * @access private
 */
function createTitlesState(currentPageSlug) {
    if (isMainColumnViewUrl(currentPageSlug)) {
        return {title: __('On this page'), subtitle: ['-', null], containingView: 'Default'};
    }
    const containingView = {
        '/pages/create': 'CreatePage',
        '/page-types/create': 'CreatePageType',
    }[currentPageSlug] || 'Default';
    return {
        title: __(containingView !== 'CreatePageType' ? 'On this page' : 'Default content'),
        subtitle: createSubtitle(currentPageSlug, containingView),
        containingView,
    };
}

/**
 * @param {String} slug
 * @param {'Default'|'CreatePage'|'CreatePageType'} containingView
 * @returns {[String, preact.VNode|null]}
 */
function createSubtitle(slug, containingView) {
    if (containingView === 'Default') {
        const [a, b] = __('Content of page %s', '|').split('|'); // ['Content of page ', ''] or ['', ' -sivun sisältö']
        return a === '' ? [<b>{ slug }</b>, b] : [a, <b>{ slug }</b>];
    }
    return [__(containingView === 'CreatePage' ? 'New page content' : 'Uuden sivutyypin oletussisältö'), null];
}

export default OnThisPageSection;
