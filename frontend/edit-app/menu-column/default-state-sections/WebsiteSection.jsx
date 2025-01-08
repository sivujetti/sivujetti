/* eslint-disable react/no-unknown-property */ // for <svg stroke-*="foo"/>
import {__, api, MenuSection, Icon, floatingDialog} from '@sivujetti-commons-for-edit-app';
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
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler mt-0 icon-tabler-stethoscope size-sm color-blue color-saturated" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M6 4h-1a2 2 0 0 0 -2 2v3.5h0a5.5 5.5 0 0 0 11 0v-3.5a2 2 0 0 0 -2 -2h-1"></path><path d="M8 15a6 6 0 1 0 12 0v-3"></path><path d="M11 3v2"></path><path d="M6 3v2"></path><circle cx="20" cy="10" r="2"></circle></svg>
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
