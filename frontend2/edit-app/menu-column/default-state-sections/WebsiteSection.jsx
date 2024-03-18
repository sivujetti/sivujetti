import {__, api, MenuSection, Icon} from '@sivujetti-commons-for-edit-app';

class WebsiteSection extends preact.Component {
    /**
     * @access protected
     */
    constructor(props) {
        super(props);
        this.userCanEditGlobalScripts = api.user.can('editTheWebsitesGlobalScripts');
    }
    /**
     * @access protected
     */
    render() {
        const updateAvailableIndicatorCls = '';// !api.getAvailableUpdatePackages().length ? '' : ' with-notification-dot';
        return <MenuSection
            title={ __('Website') }
            subtitle={ __('Website\'s settings') }
            iconId="settings"
            outerClass="website"
            buttonClass={ `${updateAvailableIndicatorCls} delta-2` }
            colorClass="color-blue">
            <nav>
                <a href="#/website/edit-basic-info" class="with-icon">
                    <Icon iconId="info-circle" className="size-sm color-blue color-saturated"/>
                    <span class="color-dimmed">{ __('Edit info') }</span>
                </a>
                { this.userCanEditGlobalScripts ? <a href="#/website/edit-global-scripts" class="with-icon">
                    <Icon iconId="code" className="size-sm color-blue color-saturated"/>
                    <span class="color-dimmed">{ __('Global scripts') }</span>
                </a> : null }
                <a href="#/website/updates" class={ `with-icon${updateAvailableIndicatorCls}` }>
                    <Icon iconId="refresh" className="size-sm color-blue color-saturated"/>
                    <span class="color-dimmed">{ __('Updates') }</span>
                </a>
            </nav>
        </MenuSection>;
    }
}

export default WebsiteSection;
