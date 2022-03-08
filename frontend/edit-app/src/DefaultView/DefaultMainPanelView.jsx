import {__, signals} from '@sivujetti-commons-for-edit-app';
import Icon from '../commons/Icon.jsx';
import BlockTrees from '../BlockTrees.jsx';
import GlobalStylesSection from './GlobalStylesSection.jsx';

class DefaultMainPanelView extends preact.Component {
    // unregisterSignalListener;
    /**
     * @param {{startAddPageMode: () => void; startAddPageTypeMode: () => void; blockTreesRef: preact.Ref; currentWebPage: EditAppAwareWebPage;}} props
     */
    constructor(props) {
        super(props);
        this.state = {sectionAIsCollapsed: false,
                      sectionBIsCollapsed: false,
                      sectionCIsCollapsed: false};
        this.unregisterSignalListener = null;
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.unregisterSignalListener = signals.on('on-web-page-block-clicked', _visibleBlock => {
            if (this.state.sectionAIsCollapsed) this.setState({sectionAIsCollapsed: false});
        });
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unregisterSignalListener();
    }
    /**
     * @access protected
     */
    render({startAddPageMode, startAddPageTypeMode, blockTreesRef},
           {sectionAIsCollapsed, sectionBIsCollapsed, sectionCIsCollapsed}) {
        return <>
            <section class={ `panel-section${sectionAIsCollapsed ? '' : ' open'}` }>
                <button class="d-flex col-12 flex-centered pr-2" onClick={ () => { this.setState({sectionAIsCollapsed: !sectionAIsCollapsed}); } }>
                    <Icon iconId="map-pin" className="size-sm mr-2 color-purple"/>
                    <span class="pl-1 color-default">{ __('On this page') }</span>
                    <Icon iconId="chevron-right" className="col-ml-auto size-xs"/>
                </button>
                <BlockTrees containingView="Default" ref={ blockTreesRef }/>
            </section>
            <section class={ `panel-section${sectionBIsCollapsed ? '' : ' open'}` }>
                <button class="d-flex col-12 flex-centered pr-2" onClick={ () => { this.setState({sectionBIsCollapsed: !sectionBIsCollapsed}); } }>
                    <Icon iconId="star" className="size-sm mr-2 color-orange"/>
                    <span class="pl-1 color-default">{ __('Content') }</span>
                    <Icon iconId="chevron-right" className="col-ml-auto size-xs"/>
                </button>
                <nav>
                    <a onClick={ e => (e.preventDefault(), alert('This feature is currently disabled.')) } class="with-icon">
                        <Icon iconId="file-info" className="size-sm color-dimmed"/>
                        <span class="color-dimmed">{ __('Pages') }</span>
                    </a>
                    <a onClick={ e => (e.preventDefault(), startAddPageMode()) } class="with-icon">
                        <Icon iconId="circle-plus" className="size-sm color-dimmed"/>
                        <span class="color-dimmed">{ __('Create %s', __('page')) }</span>
                    </a>
                    <a onClick={ e => (e.preventDefault(), startAddPageTypeMode()) } class="with-icon">
                        <Icon iconId="circle-plus" className="size-sm color-dimmed"/>
                        <span class="color-dimmed">{ __('Create %s', __('page type')) }</span>
                    </a>
                </nav>
            </section>
            <section class={ `panel-section${sectionCIsCollapsed ? '' : ' open'}` }>
                <button class="d-flex col-12 flex-centered pr-2" onClick={ () => { this.setState({sectionCIsCollapsed: !sectionCIsCollapsed}); } }>
                    <Icon iconId="palette" className="size-sm mr-2 color-pink"/>
                    <span class="pl-1 color-default">{ __('Global styles') }</span>
                    <Icon iconId="chevron-right" className="col-ml-auto size-xs"/>
                </button>
                <GlobalStylesSection
                    isVisible={ !sectionCIsCollapsed }
                    onVarChanged={ (...args) => this.props.currentWebPage.setCssVarValue(...args) }/>
            </section>
        </>;
    }
}

export default DefaultMainPanelView;
