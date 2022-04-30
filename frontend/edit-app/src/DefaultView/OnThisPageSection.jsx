import {__, Icon, MenuSection} from '@sivujetti-commons-for-edit-app';
import BlockTrees from '../BlockTrees.jsx';

class OnThisPageSection extends MenuSection {
    /**
     * @inheritdoc
     */
    constructor(props) {
        super(Object.assign(props, {initiallyIsCollapsed: false}));
    }
    /**
     * @param {{blockTreesRef: preact.Ref;} && {[key: String]: any;}} props
     */
    render({blockTreesRef}, {isCollapsed}) {
        return <section class={ `panel-section${isCollapsed ? '' : ' open'}` }>
            <button class="d-flex col-12 flex-centered pr-2" onClick={ () => { this.setState({isCollapsed: !isCollapsed}); } }>
                <Icon iconId="map-pin" className="size-sm mr-2 color-purple"/>
                <span class="pl-1 color-default">{ __('On this page') }</span>
                <Icon iconId="chevron-right" className="col-ml-auto size-xs"/>
            </button>
            <BlockTrees containingView="Default" ref={ blockTreesRef }/>
        </section>;
    }
}

export default OnThisPageSection;
