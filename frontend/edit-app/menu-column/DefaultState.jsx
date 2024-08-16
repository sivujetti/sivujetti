import {api, events} from '@sivujetti-commons-for-edit-app';
import BaseAndCustomClassStylesSection from './default-state-sections/BaseStylesSection.jsx';
import ContentManagementSection from './default-state-sections/ContentManagementSection.jsx';
import OnThisPageSection from './default-state-sections/OnThisPageSection.jsx';
import WebsiteSection from './default-state-sections/WebsiteSection.jsx';

/**
 * The default state ("#/", "#/some-page") for main column.
 */
class DefaultState extends preact.Component {
    // unregisterSignalListener;
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState({
            userDefinedSections: getRegisteredMainPanelSectionNames(),
        });
        this.unregisterSignalListener = events.on('edit-app-plugins-loaded', () => {
            this.setState({userDefinedSections: getRegisteredMainPanelSectionNames()});
        });
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unregisterSignalListener();
    }
    /**
     * @param {{url: String; path: '/:slug*'; [other: String]: any;}} _
     * @access protected
     */
    render(_, {userDefinedSections}) {
        return <main>
            <div id="edit-app-sections-wrapper">
                <OnThisPageSection
                    currentPageSlug={ this.props.url }/>
                { [
                    api.user.can('editGlobalStylesVisually')
                        ? <BaseAndCustomClassStylesSection ref={ cmp => {
                            if (cmp) api.menuPanel.setSectionCmp('baseStyles', cmp);
                        } }/>
                        : null,
                    api.user.can('createPages')
                        ? <ContentManagementSection/>
                        : null,
                    api.user.can('editTheWebsitesBasicInfo')
                        ? <WebsiteSection/>
                        : null,
                    ...userDefinedSections.map(sectionName => {
                        const doThrowIfNotFound = true;
                        const Renderer = api.menuPanel.getSection(sectionName, doThrowIfNotFound);
                        return <Renderer/>;
                    })
                ] }
            </div>
        </main>;
    }
}

/**
 * @returns {Array<String>}
 */
function getRegisteredMainPanelSectionNames() {
    return [...api.menuPanel.getSections().keys()];
}

export default DefaultState;
