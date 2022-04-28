import {__, Icon} from '@sivujetti-commons-for-edit-app';
import {Section} from './OnThisPageSection.jsx';

class WebsiteSection extends Section {
    /**
     * @param {{startAddPageMode: () => void; startAddPageTypeMode: () => void; blockTreesRef: preact.Ref;} && {[key: String]: any;}} props
     */
    render({startAddPageMode, startAddPageTypeMode}, {isCollapsed}) {
        return <section class={ `panel-section${isCollapsed ? '' : ' open'}` }>
            <button class="d-flex col-12 flex-centered pr-2" onClick={ () => { this.setState({isCollapsed: !isCollapsed}); } }>
                <Icon iconId="database" className="size-sm mr-2 color-orange"/>
                <span class="pl-1 color-default">{ __('Website') }</span>
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
        </section>;
    }
}

export default WebsiteSection;
