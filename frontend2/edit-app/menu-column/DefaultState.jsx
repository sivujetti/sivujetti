import {api, events} from '@sivujetti-commons-for-edit-app';
import {createTrier} from '../includes/utils.js';
import DnDBlockSpawner from './block/DnDBlockSpawner.jsx';
import BaseAndCustomClassStylesSection from './default-state-sections/BaseStylesSection.jsx';
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
            <DnDBlockSpawner ref={ this.blockSpawner }/>
            <div id="edit-app-sections-wrapper">
                <OnThisPageSection
                    currentPageSlug={ this.props.url }
                    ref={ cmp => initBlockSpawner(cmp, this) }/>
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
 * @param {OnThisPageSection} cmp
 * @param {DefaultState|PageCreateState|PateTypeCreateState|preact.Component} vm
 */
function initBlockSpawner(cmp, vm) {
    if (cmp && !vm.isMainDndInited) {
        vm.isMainDndInited = 1;
        createTrier(() => {
            const allSet = !!vm.blockSpawner.current && !!cmp.blockTreeRef.current?.dragDrop;
            if (allSet)
                vm.blockSpawner.current.setMainTreeDnd(cmp.blockTreeRef.current.dragDrop);
            return allSet;
        }, 20, 20)();
    }
}

/**
 * @returns {Array<String>}
 */
function getRegisteredMainPanelSectionNames() {
    return [...api.menuPanel.getSections().keys()];
}

export default DefaultState;
export {initBlockSpawner};
