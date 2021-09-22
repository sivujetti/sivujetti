import {__} from '@sivujetti-commons';
import Icon from '../../commons/Icon.jsx';
import BlockTrees from './BlockTrees.jsx';

class DefaultMainPanelView extends preact.Component {
    /**
     * @param {{startAddPageMode: () => void;}} props
     */
    constructor(props) {
        super(props);
        this.state = {sectionAIsCollapsed: false,
                      sectionBIsCollapsed: false};
    }
    /**
     * @access protected
     */
    render({startAddPageMode}, {sectionAIsCollapsed, sectionBIsCollapsed}) {
        return <>
            <section class={ `panel-section${sectionAIsCollapsed ? '' : ' open'}` }>
                <button class="d-flex col-12 flex-centered pr-2" onClick={ () => { this.setState({sectionAIsCollapsed: !sectionAIsCollapsed}); } }>
                    <Icon iconId="pen-tool" className="size-sm mr-2 color-purple"/>
                    <span class="pl-1 color-default">{ __('On this page') }</span>
                    <Icon iconId="chevron-right" className="col-ml-auto size-xs"/>
                </button>
                <BlockTrees containingView="DefaultMainPanelView"/>
            </section>
            <section class={ `panel-section${sectionBIsCollapsed ? '' : ' open'}` }>
                <button class="d-flex col-12 flex-centered pr-2" onClick={ () => { this.setState({sectionBIsCollapsed: !sectionBIsCollapsed}); } }>
                    <Icon iconId="settings" className="size-sm mr-2 color-orange"/>
                    <span class="pl-1 color-default">{ __('My website') }</span>
                    <Icon iconId="chevron-right" className="col-ml-auto size-xs"/>
                </button>
                <nav>
                    <a class="with-icon">
                        <Icon iconId="file" className="size-sm color-dimmed"/>
                        <span class="color-dimmed">{ __('Pages') }</span>
                    </a>
                    <a onClick={ e => (e.preventDefault(), startAddPageMode()) } class="with-icon">
                        <Icon iconId="plus-circle" className="size-sm color-dimmed"/>
                        <span class="color-dimmed">{ __('Create page') }</span>
                    </a>
                </nav>
            </section>
        </>;
    }
}

export default DefaultMainPanelView;
