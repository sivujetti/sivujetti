import {__, Icon, MenuSection} from '@sivujetti-commons-for-edit-app';
import BlockTrees from '../BlockTrees.jsx';
import store, {observeStore, selectCurrentPageDataBundle} from '../store.js';

let currentInstance;
observeStore(selectCurrentPageDataBundle, ({page}) => {
    if (currentInstance) currentInstance.setState({subtitle: currentInstance.getSubtitle(page)});
});

class OnThisPageSection extends MenuSection {
    /**
     * @inheritdoc
     */
    constructor(props) {
        super(Object.assign(props, {initiallyIsCollapsed: props.initiallyIsCollapsed === true}));
        currentInstance = this;
    }
    /**
     * @access protected
     */
    componentDidMount() {
        currentInstance = this;
        const {page} = selectCurrentPageDataBundle(store.getState());
        this.setState({title: __(this.props.containingView === 'CreatePage' ? 'On this page' : 'Default content'),
            subtitle: this.getSubtitle(page)});
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        currentInstance = null;
    }
    /**
     * @param {{blockTreesRef: preact.Ref; containingView?: 'CreatePage'|'CreatePageType';} && {[key: String]: any;}} props
     */
    render({blockTreesRef, containingView}, {isCollapsed, title, subtitle}) {
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
            <BlockTrees containingView={ containingView || 'Default' } ref={ blockTreesRef }/>
        </section>;
    }
    /**
     * @param {Page?} page
     * @returns {String}
     */
    getSubtitle(page) {
        if (!page) return __('Content of page %s', '/');
        if (!page.isPlaceholderPage) return __('Content of page %s', page.slug);
        return __(this.props.containingView === 'CreatePage' ? 'New page content' : 'Uuden sivutyypin oletussisältö');
    }
}

export default OnThisPageSection;
