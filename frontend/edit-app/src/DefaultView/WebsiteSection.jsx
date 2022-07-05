import {__, Icon, MenuSection, api} from '@sivujetti-commons-for-edit-app';

class WebsiteSection extends MenuSection {
    // userCanCreatePageTypes;
    /**
     * @param {{startAddPageMode: () => void; startAddPageTypeMode: () => void; blockTreesRef: preact.Ref;} && {[key: String]: any;}} props
     */
    constructor(props) {
        super(props);
        this.userCanCreatePageTypes = api.user.can('createPageTypes');
    }
    /**
     * @access protected
     */
    render({startAddPageMode, startAddPageTypeMode}, {isCollapsed}) {
        return <section class={ `panel-section${isCollapsed ? '' : ' open'}` }>
            <button class="flex-centered pr-2 section-title col-12" onClick={ () => { this.setState({isCollapsed: !isCollapsed}); } }>
                <Icon iconId="database" className="p-absolute size-sm mr-2 color-orange"/>
                <span class="pl-1 d-block col-12 color-default">
                    { __('Website') }
                    <span class="text-ellipsis text-tiny col-12">{ __('Content management') }</span>
                </span>
                <Icon iconId="chevron-right" className="p-absolute size-xs"/>
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
                { this.userCanCreatePageTypes ? <a onClick={ e => (e.preventDefault(), startAddPageTypeMode()) } class="with-icon">
                    <Icon iconId="circle-plus" className="size-sm color-dimmed"/>
                    <span class="color-dimmed">{ __('Create %s', __('page type')) }</span>
                </a> : null }
            </nav>
        </section>;
    }
}

export default WebsiteSection;
