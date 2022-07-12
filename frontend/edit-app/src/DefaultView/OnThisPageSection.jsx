import {__, Icon, MenuSection} from '@sivujetti-commons-for-edit-app';
import BlockTrees from '../BlockTrees.jsx';
import store, {observeStore, selectCurrentPageDataBundle} from '../store.js';

let currentInstance;
observeStore(selectCurrentPageDataBundle, ({page}) => {
    if (currentInstance) currentInstance.setState({subtitle: translateSubtitle(page)});
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
        this.setState({subtitle: translateSubtitle(page)});
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        currentInstance = null;
    }
    /**
     * @param {{blockTreesRef: preact.Ref; containingView?: String;} && {[key: String]: any;}} props
     */
    render({blockTreesRef, containingView}, {isCollapsed, subtitle}) {
        return <section class={ `on-this-page panel-section pl-0${isCollapsed ? '' : ' open'}` }>
            <button
                class="flex-centered pr-2 pl-1 section-title col-12"
                onClick={ () => { this.setState({isCollapsed: !isCollapsed}); } }
                type="button">
                <Icon iconId="map-pin" className="p-absolute size-sm mr-2 color-purple"/>
                <span class="pl-1 d-block col-12 color-default">
                    { __('On this page') }
                    <span class="text-ellipsis text-tiny col-12">{ subtitle }</span>
                </span>
                <Icon iconId="chevron-right" className="p-absolute size-xs"/>
            </button>
            <BlockTrees containingView={ containingView || 'Default' } ref={ blockTreesRef }/>
        </section>;
    }
}

/**
 * @param {Page?} page
 * @returns {String}
 */
function translateSubtitle(page) {
    if (!page) return __('Content of page %s', '/');
    return !page.isPlaceholderPage ? __('Content of page %s', page.slug) : 'Uuden sivun sisältö';
}

export default OnThisPageSection;
