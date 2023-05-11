import {__, MenuSection} from '@sivujetti-commons-for-edit-app';

class SettingsSection extends preact.Component {
    /**
     * @access protected
     */
    render() {
        return <MenuSection
            title={ __('Website') }
            subtitle={ __('Website\'s settings') }
            iconId="settings"
            colorClass="color-blue">
            <nav>
                <a href="#/website/edit-basic-info" class="mb-1 with-icon">
                    <span class="color-dimmed">{ __('Edit info') }</span>
                </a>
            </nav>
        </MenuSection>;
    }
}

export default SettingsSection;
