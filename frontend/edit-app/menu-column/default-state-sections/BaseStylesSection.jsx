import {
    __,
    api,
    getAndPutAndGetToLocalStorage,
    MenuSection,
    putToLocalStorage,
    Tabs,
} from '@sivujetti-commons-for-edit-app';
import BaseStyleChunkScssEditor from '../block-styles/BaseStyleChunkScssEditor.jsx';
import BaseStylesVisualEditForm from '../block-styles/BaseStylesVisualEditForm.jsx';
import {createInitialTabKind, filterTabsForLoggedInUser} from '../block-styles/style-tabs-commons.js';
/** @typedef {import('../block-styles/style-tabs-commons.js').tabKind} tabKind */

class BaseAndCustomClassStylesSection extends preact.Component {
    // tabsInfo;
    // unregistrables;
    // menuSection;
    /**
     * @param {number} lineIdx
     * @param {string} className
     * @access public
     */
    async scrollToCustomClassesTabClass(lineIdx, className) {
        const sectionEl = this.getEl();
        const scrollerEl = sectionEl.parentElement;
        const baseCfg = {left: 0, behavior: 'smooth'};

        if (this.state.isCollapsed) {
            scrollerEl.scrollTo({top: sectionEl.offsetTop, ...baseCfg});
            await new Promise(resolve => { setTimeout(() => { resolve(); }, 200); });
            await this.unCollapse();
        }

        if (lineIdx < 0)
            return;

        const editorEl = await this.openTab('dev-class-styles');
        editorEl.closest('.vert-tabs').scrollLeft = 0;

        const classNodes = [...editorEl.querySelectorAll('.cm-line > .ͼj')];
        const node = classNodes.find(({textContent}) => textContent === className);
        if (!node) return;

        const lineEl = node.parentElement;
        const lineIdx2 = [...lineEl.parentElement.children].indexOf(lineEl);
        const delta = editorEl.getBoundingClientRect().top - sectionEl.getBoundingClientRect().top;
        const linePos = lineIdx2 * lineEl.getBoundingClientRect().height;
        scrollerEl.scrollTo({top: sectionEl.offsetTop + delta + linePos, ...baseCfg});
        await new Promise(resolve => { setTimeout(() => { resolve(); }, 320); });

        lineEl.querySelector('.cm-foldPlaceholder')?.click();
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.menuSection = preact.createRef();
        const saveButton = api.saveButton.getInstance();
        this.tabsInfo = filterTabsForLoggedInUser([
            {kind: 'user-styles', title: __('Visual')},
            {kind: 'dev-styles', title: __('Code')},
        ]);
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
            outerClass="base-styles"
            ref={ this.menuSection }>
            { !isCollapsed ? <div>
            { hasMoreThat1Tab ? <Tabs
                links={ tabsInfo.map(itm => itm.title) }
                getTabName={ (_, i) => tabsInfo[i].kind }
                onTabChanged={ (toIdx) => this.changeTab(this.tabsInfo[toIdx].kind) }
                className={ `text-tinyish mt-0${currentTabKind !== 'content' ? '' : ' mb-2'}` }
                initialTabIdx={ tabsInfo.findIndex(({kind}) => kind === currentTabKind) }/> : null }
            { tabsInfo.map(({kind}) => {
                const isCurrent = kind === currentTabKind;
                return <div class={ [...clses, ...(isCurrent ? [] : ['d-none'])].join(' ') } key={ kind }>
                    { isCurrent
                        ? kind === 'user-styles'
                            ? <BaseStylesVisualEditForm
                                blockId="j-_body_"
                                stateId={ stylesStateId }/>
                            : <BaseStyleChunkScssEditor
                                stylesStateId={ stylesStateId }/>
                        : null
                    }
                </div>;
            }) }
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
    /**
     * @returns {Promise<HTMLElement>}
     * @access private
     */
    openTab(kind) {
        if (this.state.currentTabKind === kind)
            return this.getEl().querySelector('.scss-editor-outer');

        const el = this.getEl();
        const linkEl = el.querySelector(`.tab-item-${kind} a`);
        if (!linkEl) return;
        linkEl.click();

        return new Promise(resolve => {
            setTimeout(() => {
                resolve(el.querySelector('.scss-editor-outer'));
            }, 10);
        });
    }
    /**
     * @returns {Promise<void>}
     * @access private
     */
    unCollapse() {
        return new Promise(resolve => {
            this.getEl().querySelector('button.section-title').click();
            setTimeout(() => {
                resolve();
            }, 10);
        });
    }
    /**
     * @returns {HTMLElement}
     * @access private
     */
    getEl() {
        return this.menuSection.current.getEl();
    }
}

export default BaseAndCustomClassStylesSection;
