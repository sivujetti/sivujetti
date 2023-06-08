import {__, api, env, signals, urlUtils, Icon, MenuSectionAbstract} from '@sivujetti-commons-for-edit-app';
import {createTrier} from '../../block/dom-commons.js';
import {findBlockFrom} from '../../block/utils-utils.js';
import ContextMenu from '../../commons/ContextMenu.jsx';
import {openPageDeleteDialog} from '../../right-column/page/PagesListView.jsx';
import store, {selectCurrentPageDataBundle} from '../../store.js';
import BlockTree from '../block/BlockTree.jsx';

class OnThisPageSection extends MenuSectionAbstract {
    // blockTreeRef;
    // unregistrables;
    // moreMenuIcon;
    // moreMenu;
    // mouseFocusIsAt;
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
        const focusToBlockAndEmitBlockTreeClick = (visibleBlock, clickOrigin, then) => {
            if (this.state.isCollapsed) this.setState({isCollapsed: false});
            this.blockTreeRef.current.handleItemClickedOrFocused(visibleBlock, clickOrigin);
            setTimeout(() => {
                api.mainPanel.scrollTo(visibleBlock.id);
                then();
            }, 100);
        };
        this.unregistrables = [signals.on('web-page-click-received',
        /**
         * @param {HTMLElement?} blockEl
         * @param {_} _
         * @param {(blockEl: HTMLElement) => RawBlock|null} findBlock
         */
        (blockEl, _) => {
            if (!blockEl) return;
            focusToBlockAndEmitBlockTreeClick(findBlockFrom(blockEl.getAttribute('data-block'), 'mainTree')[0], 'web-page', () => { });
        }),
        signals.on('block-styles-show-parent-styles-button-clicked',
        /**
         * @param {RawBlock} visibleBlock
         * @param {String} unitCls
         * @param {'combined-styles-tab'} origin = null
         */
        (visibleBlock, unitCls, origin = null) => {
            focusToBlockAndEmitBlockTreeClick(visibleBlock, 'styles-tab', () => {
                const inspectorPanelOuter = api.inspectorPanel.getEl();
                const fromStyleUnits = origin !== 'combined-styles-tab';
                const tabLinkSelector = fromStyleUnits ? '.tab-item:nth-of-type(2)' : '.tab-item-combined-styles' ;
                // Open styles tab
                inspectorPanelOuter.querySelector(`.tab ${tabLinkSelector} a`).click();
                if (!fromStyleUnits) return;
                // Open first unit accordion
                createTrier(() => {
                    const row = inspectorPanelOuter.querySelector(`.styles-list > li[data-cls="${unitCls}"] > header`);
                    if (!row) return false;
                    const accordBtn = row.querySelector(`:scope > button`);
                    accordBtn.click();
                    setTimeout(() => {
                        inspectorPanelOuter.scrollTo({top: row.getBoundingClientRect().top - inspectorPanelOuter.getBoundingClientRect().top,
                            behavior: 'smooth'});
                    }, 100);
                    return true;
                }, 50, 10)();
            });
        }), signals.on('inspector-panel-closed', () => {
            if (this.blockTreeRef.current)
                this.blockTreeRef.current.deSelectAllBlocks();
        }), signals.on('page-saved-to-backend', () => {
            const {page} = selectCurrentPageDataBundle(store.getState());
            if (this.state.loadedSlug !== page.slug)
                this.updateTitlesToState(page.slug);
        })];
        //
        this.updateTitlesToState(this.props.loadedPageSlug);
    }
    /**
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.loadedPageSlug !== this.props.loadedPageSlug)
            this.updateTitlesToState(props.loadedPageSlug);
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unregistrables.forEach(unreg => unreg());
    }
    /**
     * @param {{loadedPageSlug?: String; loadingPageSlug?: String;} && {[key: String]: any;}} props
     */
    render({loadedPageSlug}, {isCollapsed, containingView, title, subtitle}) {
        return <section class={ `on-this-page panel-section pl-0${isCollapsed ? '' : ' open'}` }>
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
            { loadedPageSlug ? <BlockTree
                loadedPageSlug={ loadedPageSlug }
                containingView={ containingView }
                ref={ this.blockTreeRef }/> : null }
            { containingView === 'Default' ? <ContextMenu
                links={ [
                    {text: __('Duplicate this page'), title: __('Duplicate page'), id: 'duplicate'},
                    {text: __('Delete this page'), title: __('Delete page'), id: 'delete'},
                    {text: __('Show without edit menu'), title: __('Show without edit menu'), id: 'show-without-edit-mode'},
                ] }
                onItemClicked={ this.handleContextMenuLinkClicked.bind(this) }
                onMenuClosed={ () => { this.slugOfPageWithNavOpened = null; } }
                ref={ this.moreMenu }/> : null }
        </section>;
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleMainButtonClicked(e)  {
        if (this.mouseFocusIsAt === 'moreMenuIcon' ||
            e.target.tagName === 'I' ||
            (this.moreMenu.current && this.moreMenuIcon.current.contains(e.target)))
            this.openMoreMenu(this.state.loadedSlug, e);
        else
            this.setState({isCollapsed: !this.state.isCollapsed});
    }
    /**
     * @param {String|null} loadedSlug
     * @access private
     */
    updateTitlesToState(loadedSlug) {
        const slug = loadedSlug || '/';
        const containingView = determineViewNameFrom(slug);
        this.setState({
            title: __(containingView !== 'CreatePageType' ? 'On this page' : 'Default content'),
            loadedSlug,
            subtitle: getSubtitle(slug, containingView),
            containingView
        });
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
            const {page} = selectCurrentPageDataBundle(store.getState());
            openPageDeleteDialog(page.slug, page.title, () => {
                urlUtils.redirect('/_edit');
            });
        } else if (link.id === 'show-without-edit-mode')
            env.window.open(urlUtils.makeUrl(this.slugOfPageWithNavOpened, true), '_blank');
    }
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
