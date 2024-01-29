import {api} from '../../sivujetti-commons-unified.js';
import BlockDnDSpawner from './DnDBlockSpawner.jsx';
import BaseStylesSection from './default-state-sections/BaseStylesSection.jsx';
import ContentManagementSection from './default-state-sections/ContentManagementSection.jsx';
import OnThisPageSection from './default-state-sections/OnThisPageSection.jsx';
import WebsiteSection from './default-state-sections/WebsiteSection.jsx';

/**
 * The default state ("#/", "#/some-page") for main column.
 */
class DefaultState extends preact.Component {
    /**
     * @access protected
     */
    render() {
        return [
            <BlockDnDSpawner/>,
            <div id="edit-app-sections-wrapper">
                <OnThisPageSection
                    currentPageSlug={ this.props.url }/>
                { [
                    api.user.can('editGlobalStylesVisually')
                        ? <BaseStylesSection
                            currentPageSlug={ this.props.url }/>
                        : null,
                    api.user.can('createPages')
                        ? <ContentManagementSection/>
                        : null,
                    api.user.can('editTheWebsitesBasicInfo')
                        ? <WebsiteSection/>
                        : null,
                ] }
            </div>
        ];
    }
}

export default DefaultState;
