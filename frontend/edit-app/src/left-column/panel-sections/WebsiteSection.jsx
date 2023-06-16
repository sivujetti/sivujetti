import {__, MenuSection, Icon} from '@sivujetti-commons-for-edit-app';

class WebsiteSection extends preact.Component {
    /**
     * @access protected
     */
    render() {
        return <MenuSection
            title={ __('Website') }
            subtitle={ __('Website\'s settings') }
            iconId="settings"
            outerClass="website"
            colorClass="color-blue">
            <nav>
                <a href="#/website/edit-basic-info" class="with-icon">
                    <Icon iconId="info-circle" className="size-sm color-blue color-saturated"/>
                    <span class="color-dimmed">{ __('Edit info') }</span>
                </a>
                <a href="#/website/updates" class="with-icon">
                    <Icon iconId="refresh" className="size-sm color-blue color-saturated"/>
                    <span class="color-dimmed">{ __('Updates') }</span>
                </a>
            </nav>
        </MenuSection>;
    }
}

export default WebsiteSection;
