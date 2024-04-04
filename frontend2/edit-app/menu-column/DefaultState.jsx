import {api, events} from '@sivujetti-commons-for-edit-app';
import {createTrier} from '../includes/utils.js';
import DnDBlockSpawner from './block/DnDBlockSpawner.jsx';
import BaseStylesSection from './default-state-sections/BaseStylesSection.jsx';
import ContentManagementSection from './default-state-sections/ContentManagementSection.jsx';
import OnThisPageSection from './default-state-sections/OnThisPageSection.jsx';
import WebsiteSection from './default-state-sections/WebsiteSection.jsx';

/**
 * The default state ("#/", "#/some-page") for main column.
 */
class DefaultState extends preact.Component {
    // blockSpawner;
    // unregisterSignalListener;
    /**
     * @access protected
     */
    componentWillMount() {
        this.blockSpawner = preact.createRef();
        this.setState({
            userDefinedSections: getRegisteredMainPanelSectionNames(),
        });
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unregisterSignalListener();
    }
    /**
     * @access protected
     */
    render(_, {userDefinedSections}) {
        return <main>
            <DnDBlockSpawner ref={ this.blockSpawner }/>
            <div id="edit-app-sections-wrapper">
                <OnThisPageSection
                    currentPageSlug={ this.props.url }
                    ref={ cmp => {
                        if (cmp && !this.isMainDndInited) {
                            this.isMainDndInited = 1;
                            createTrier(() => {
                                const allSet = !!this.blockSpawner.current && !!cmp.blockTreeRef.current?.dragDrop;
                                if (allSet)
                                    this.blockSpawner.current.setMainTreeDnd(cmp.blockTreeRef.current.dragDrop);
                                return allSet;
                            }, 20, 20)();
                        }
                    } }/>
                { [
                    api.user.can('editGlobalStylesVisually')
                        ? <BaseStylesSection/>
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
    return Array.from(api.menuPanel.getSections().keys());
}

export default DefaultState;
