import {__, api, env, signals, Icon, MenuSectionAbstract} from '@sivujetti-commons-for-edit-app';
import BlockTree from '../Block/BlockTree.jsx';

class OnThisPageSection extends MenuSectionAbstract {
    // blockTreeRef;
    // unregistrables;
    /**
     * @inheritdoc
     */
    constructor(props) {
        super(Object.assign(props, {initiallyIsCollapsed: props.initiallyIsCollapsed === true}));
        this.blockTreeRef = preact.createRef();
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const focusToBlockAndEmitBlockTreeClick = (visibleBlock, clickOrigin, then) => {
            if (this.state.isCollapsed) this.setState({isCollapsed: false});
            this.blockTreeRef.current.handleItemClickedOrFocused(visibleBlock, clickOrigin);
            setTimeout(() => {
                api.mainPanel.scrollTo(visibleBlock, false);
                then();
            }, 100);
        };
        this.unregistrables = [signals.on('on-web-page-click-received',
        /**
         * @param {HTMLElement?} blockEl
         * @param {_} _
         * @param {(blockEl: HTMLElement) => RawBlock|null} findBlock
         */
        (blockEl, _, findBlock) => {
            if (!blockEl) return;
            focusToBlockAndEmitBlockTreeClick(findBlock(blockEl), 'web-page', () => { });
        }),
        signals.on('on-block-styles-show-parent-styles-button-clicked',
        /**
         * @param {RawBlock} visibleBlock
         * @param {String} unitCls
         */
        (visibleBlock, unitCls) => {
            focusToBlockAndEmitBlockTreeClick(visibleBlock, 'styles-tab', () => {
                // Open styles tab
                env.document.querySelector('#inspector-panel .tab .tab-item:nth-of-type(2) a').click();
                // Open first unit accordion
                setTimeout(() => {
                    document.querySelector(`#inspector-panel .styles-list > li[data-cls="${unitCls}"] button`).click();
                }, 80);
            });
        }), signals.on('on-inspector-panel-closed', () => {
            this.blockTreeRef.current.deSelectAllBlocks();
        })];
        //
        this.t(this.props.loadedPageSlug);
    }
    /**
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.loadedPageSlug !== this.props.loadedPageSlug)
            this.t(props.loadedPageSlug);
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unregistrables.forEach(unreg => unreg());
    }
    /**
     * @param {{loadedPageSlug?: String;} && {[key: String]: any;}} props
     */
    render({loadedPageSlug}, {isCollapsed, containingView, title, subtitle}) {
        return <section class={ `on-this-page panel-section pl-0${isCollapsed ? '' : ' open'}` }>
            <button
                class="flex-centered pr-2 pl-1 section-title col-12"
                onClick={ () => { this.setState({isCollapsed: !isCollapsed}); } }
                title={ subtitle }
                type="button">
                <Icon iconId="map-pin" className="p-absolute size-sm mr-2 color-purple"/>
                <span class="pl-1 d-block col-12 color-default">
                    { title }
                    <span class="text-ellipsis text-tiny col-12">{ subtitle }</span>
                </span>
                <Icon iconId="chevron-right" className="p-absolute size-xs"/>
            </button>
            <BlockTree
                loadedPageSlug={ loadedPageSlug }
                containingView={ containingView }
                ref={ this.blockTreeRef }/>
        </section>;
    }
    /**
     * @param {String} s
     * @access private
     */
    t(s) {
        const containingView = determineViewNameFrom(s);
        this.setState({title: __(!containingView || containingView === 'CreatePage' ? 'On this page' : 'Default content'),
            subtitle: getSubtitle(s, containingView), containingView});
    }
}

/**
 * @param {String} slug
 * @returns {leftPanelName}
 */
function determineViewNameFrom(slug) {
    if ((slug || '').startsWith(':pseudo/'))
        return !slug.endsWith('/new-page-type') ? 'CreatePage' : 'CreatePageType';
    return 'Default';
}

/**
 * @param {Page?} page
 * @returns {String}
 */
function getSubtitle(slug, containingView) {
    if (!slug) return __('Content of page %s', '/');
    if (containingView === 'Default') return __('Content of page %s', slug);
    return __(containingView === 'CreatePage' ? 'New page content' : 'Uuden sivutyypin oletussisältö');
}

export default OnThisPageSection;
