import {__, api, Icon, MenuSection} from '@sivujetti-commons-for-edit-app';

class WebsiteSection extends preact.Component {
    // userCanCreatePageTypes;
    /**
     * @param {{[key: String]: any;}} props
     */
    constructor(props) {
        super(props);
        this.userCanCreatePageTypes = api.user.can('createPageTypes');
    }
    /**
     * @access protected
     */
    render() {
        return <MenuSection
            title={ __('Website') }
            subtitle={ __('Content management') }
            iconId="database"
            colorClass="color-orange">
            <nav>
                <a href="#/pages" class="with-icon">
                    <Icon iconId="file-info" className="size-sm color-dimmed"/>
                    <span class="color-dimmed">{ __('Pages') }</span>
                </a>
                <a href="#/pages/create" class="with-icon">
                    <Icon iconId="circle-plus" className="size-sm color-dimmed"/>
                    <span class="color-dimmed">{ __('Create %s', __('page')) }</span>
                </a>
                { this.userCanCreatePageTypes ? <a href="#/page-types/create" class="with-icon">
                    <Icon iconId="circle-plus" className="size-sm color-dimmed"/>
                    <span class="color-dimmed">{ __('Create %s', __('page type')) }</span>
                </a> : null }
            </nav>
        </MenuSection>;
    }
}

export default WebsiteSection;
