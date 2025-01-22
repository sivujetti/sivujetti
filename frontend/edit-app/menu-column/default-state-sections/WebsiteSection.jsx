/* eslint-disable react/no-unknown-property */ // for <svg stroke-*="foo"/>
import {__, api, MenuSection, Icon, floatingDialog, PathIcon} from '@sivujetti-commons-for-edit-app';
import WebsiteDiagnoseIssuesDialog from '../../main-column/popups/WebsiteDiagnoseIssuesDialog.jsx';

class WebsiteSection extends preact.Component {
    /**
     * @access protected
     */
    constructor(props) {
        super(props);
        this.userCanEditGlobalScripts = api.user.can('editTheWebsitesGlobalScripts');
        this.userCanRunHealthCheck = api.user.can('checkTheWebsitesHealth');
    }
    /**
     * @access protected
     */
    render() {
        const updateAvailableIndicatorCls = !api.getAvailableUpdatePackages().length ? '' : ' with-notification-dot';
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
                { this.userCanRunHealthCheck ? <a onClick={ openDiagnoseIssuesDialog } href="#/website/run-health-check" class="with-icon">
                    <PathIcon className="mt-0 icon-tabler-stethoscope size-sm color-blue color-saturated">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M6 4h-1a2 2 0 0 0 -2 2v3.5h0a5.5 5.5 0 0 0 11 0v-3.5a2 2 0 0 0 -2 -2h-1"/>
                        <path d="M8 15a6 6 0 1 0 12 0v-3"/>
                        <path d="M11 3v2"/>
                        <path d="M6 3v2"/>
                        <circle cx="20" cy="10" r="2"/>
                    </PathIcon>
                    <span class="color-dimmed">{ __('Site status') }</span>
                </a> : null }
            </nav>
        </MenuSection>;
    }
}

/**
 * @param {Event} e
 */
function openDiagnoseIssuesDialog(e) {
    e.preventDefault();
    floatingDialog.open(WebsiteDiagnoseIssuesDialog, {
        title: __('Diagnose issues'),
        height: 439,
    }, {});
}

export default WebsiteSection;
