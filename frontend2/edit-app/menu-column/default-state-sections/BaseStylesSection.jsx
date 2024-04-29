import {
    __,
    api,
    getAndPutAndGetToLocalStorage,
    MenuSection,
    putToLocalStorage,
    Tabs,
} from '@sivujetti-commons-for-edit-app';
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
        this.tabsInfo = createTabsInfo([{kind: 'user-styles'}, {kind: 'dev-styles'},]);
        const currentTabKind = createInitialTabKind(
            getAndPutAndGetToLocalStorage('user-styles', 'sivujettiLastBaseStylesTabKind'),
            this.tabsInfo
        );
        this.setState({currentTabKind, stylesStateId: null, isCollapsed: true});
        this.unregistrables = [saveButton.subscribeToChannel('stylesBundle', (bundle, userCtx, ctx) => {
            console.log('on grab',bundle.id);
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
                <div class={ itm.kind === currentTabKind ? '' : 'd-none' } key={ itm.kind }>
                    { itm.kind === 'user-styles'
                        ? `<StylesEditFormCls 
                            blockId={ null }
                            stateId={ this.state.stylesStateId }/>` // todo
                        : <CodeBasedStylesList
                            stylesStateId={ stylesStateId }
                            blockId="j-_body_"/> }
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
