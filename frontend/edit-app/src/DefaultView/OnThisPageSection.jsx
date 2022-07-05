import {__, Icon, MenuSection} from '@sivujetti-commons-for-edit-app';
import BlockTrees from '../BlockTrees.jsx';
import store, {observeStore, selectCurrentPageDataBundle} from '../store.js';

let currentInstance;
observeStore(selectCurrentPageDataBundle, ({page}) => {
    if (currentInstance) currentInstance.setState({currentPageSlug: page.slug});
});

class OnThisPageSection extends MenuSection {
    /**
     * @inheritdoc
     */
    constructor(props) {
        super(Object.assign(props, {initiallyIsCollapsed: false}));
        currentInstance = this;
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const {page} = selectCurrentPageDataBundle(store.getState());
        this.setState({currentPageSlug: page ? page.slug : '/'});
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        currentInstance = null;
    }
    /**
     * @param {{blockTreesRef: preact.Ref;} && {[key: String]: any;}} props
     */
    render({blockTreesRef}, {isCollapsed, currentPageSlug}) {
        return <section class={ `panel-section${isCollapsed ? '' : ' open'}` }>
            <button class="flex-centered pr-2 section-title col-12" onClick={ () => { this.setState({isCollapsed: !isCollapsed}); } }>
                <Icon iconId="map-pin" className="p-absolute size-sm mr-2 color-purple"/>
                <span class="pl-1 d-block col-12 color-default">
                    { __('On this page') }
                    <span class="text-ellipsis text-tiny col-12">{ __('Content of page %s', currentPageSlug) }</span>
                </span>
                <Icon iconId="chevron-right" className="p-absolute size-xs"/>
            </button>
            <BlockTrees containingView="Default" ref={ blockTreesRef }/>
        </section>;
    }
}

export default OnThisPageSection;
