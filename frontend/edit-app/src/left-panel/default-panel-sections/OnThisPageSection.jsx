import {__, Icon, MenuSectionAbstract} from '@sivujetti-commons-for-edit-app';
import BlockTree from '../../Block/BlockTree.jsx';

class OnThisPageSection extends MenuSectionAbstract {
    /**
     * @inheritdoc
     */
    constructor(props) {
        super(Object.assign(props, {initiallyIsCollapsed: props.initiallyIsCollapsed === true}));
        console.log('consrtr (onthis)', props.loadedPageSlug);
    }
    componentWillMount() {
        console.log('cdm (onthis)', this.props.loadedPageSlug);
        this.t(this.props.loadedPageSlug);
    }
    componentWillReceiveProps(props) {
        console.log('wrp (onthis)', props.loadedPageSlug);
        if (props.loadedPageSlug !== this.props.loadedPageSlug)
            this.t(props.loadedPageSlug);
    }
    t(s) {
        const containingView = determineViewNameFrom(s);
        this.setState({title: __(!containingView || containingView === 'CreatePage' ? 'On this page' : 'Default content'),
            subtitle: this.getSubtitle(s, containingView)});
    }
    /**
     * @param {{blockTreesRef: preact.Ref;} && {[key: String]: any;}} props
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
            <BlockTree curps={ loadedPageSlug } containingView={ containingView }/>
        </section>;
    }
    /**
     * @param {Page?} page
     * @returns {String}
     */
    getSubtitle(slug, containingView) {
        if (!slug) return __('Content of page %s', '/');
        if (containingView === 'Default') return __('Content of page %s', slug);
        return __(containingView === 'CreatePage' ? 'New page content' : 'Uuden sivutyypin oletussisältö');
    }
}

/**
 * @param {String} slug
 * @returns {'Default'|'CreatePage'|'CreatePageType'}
 */
function determineViewNameFrom(slug) {
    if ((slug || '').startsWith(':pseudo/'))
        return !slug.endsWith('/new-page-type') ? 'CreatePage' : 'CreatePageType';
    return 'Default';
}

export default OnThisPageSection;
