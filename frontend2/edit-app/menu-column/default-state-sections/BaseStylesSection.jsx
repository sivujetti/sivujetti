import {
    __,
    api,
    getAndPutAndGetToLocalStorage,
    MenuSection,
    putToLocalStorage,
    Tabs,
} from '@sivujetti-commons-for-edit-app';
import BaseStylesVisualEditForm from '../block-styles/BaseStylesVisualEditForm.jsx';
import CodeBasedStylesList from '../block-styles/CodeBasedStylesTab.jsx';
import {createInitialTabKind, createTabsInfo} from '../block-styles/style-tabs-commons.js';
/** @typedef {import('../block-styles/style-tabs-commons.js').tabKind} tabKind */

class BaseStylesSection extends preact.Component {
    // tabsInfo;
    // unregistrables;
    /**
     * @access protected
     */
    componentWillMount() {
        const saveButton = api.saveButton.getInstance();
        this.tabsInfo = createTabsInfo([{kind: 'user-styles'}, {kind: 'dev-styles'}]);
        const currentTabKind = createInitialTabKind(
            getAndPutAndGetToLocalStorage('user-styles', 'sivujettiLastBaseStylesTabKind'),
            this.tabsInfo
        );
        this.setState({currentTabKind, stylesStateId: null, isCollapsed: true});
        this.unregistrables = [saveButton.subscribeToChannel('stylesBundle', (bundle, _userCtx, _ctx) => {
            this.setState({stylesStateId: bundle.id});
        })];
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unregistrables.forEach(unreg => unreg());
    }
    /**
     * @param {*} props
     * @access protected
     */
    render(_, {currentTabKind, stylesStateId, isCollapsed}) {
        const {tabsInfo} = this;
        const hasMoreThat1Tab = tabsInfo.length > 1;
        const clses = hasMoreThat1Tab && currentTabKind === 'user-styles' ? ['pt-1'] : [];
        return <MenuSection
            title={ __('Styles') }
            subtitle={ __('Colours and fonts') }
            iconId="palette"
            colorClass="color-pink"
            onIsCollapsedChanged={ this.onIsCollapsedChanged.bind(this) }
            outerClass="base-styles">
            { !isCollapsed ? <div>
            { hasMoreThat1Tab ? <Tabs
                links={ tabsInfo.map(itm => itm.title) }
                getTabName={ (_, i) => tabsInfo[i].kind }
                onTabChanged={ (toIdx) => this.changeTab(this.tabsInfo[toIdx].kind) }
                className={ `text-tinyish mt-0${currentTabKind !== 'content' ? '' : ' mb-2'}` }
                initialIndex={ tabsInfo.findIndex(({kind}) => kind === currentTabKind) }/> : null }
            { tabsInfo.map(itm =>
                <div class={ [...clses, ...(itm.kind === currentTabKind ? [] : ['d-none'])].join(' ') } key={ itm.kind }>
                    { itm.kind === 'user-styles'
                        ? <BaseStylesVisualEditForm
                            blockId="j-_body_"
                            stateId={ stylesStateId }/>
                        : <CodeBasedStylesList
                            stylesStateId={ stylesStateId }
                            blockId="j-_body_"/>
                    }
                </div>
            ) }
            </div> : null }
        </MenuSection>;
    }
    /**
     * @param {tabKind} toKind
     * @access private
     */
    changeTab(toKind) {
        putToLocalStorage(toKind, 'sivujettiLastBaseStylesTabKind');
        this.setState({currentTabKind: toKind});
    }
    /**
     * @param {Boolean} to
     * @access private
     */
    onIsCollapsedChanged(to) {
        this.setState({isCollapsed: to});
    }
}

export default BaseStylesSection;
