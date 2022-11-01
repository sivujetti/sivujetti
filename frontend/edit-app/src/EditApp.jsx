import {__, api, signals, http, env, urlUtils, FloatingDialog, Icon} from '@sivujetti-commons-for-edit-app';
import toasters, {Toaster} from './commons/Toaster.jsx';
import store, {createBlockTreeReducerPair} from './store.js';
import store2 from './store2.js';
import SaveButton from './SaveButton.jsx';
import DefaultPanel from './left-panel/DefaultPanel.jsx';
import PageCreatePanel from './left-panel/PageCreatePanel.jsx';
import PageDuplicatePanel from './left-panel/PageDuplicatePanel.jsx';
import PageTypeCreatePanel from './left-panel/PageTypeCreatePanel.jsx';
import {createStoreAndDispatchInnerTree, getArePanelsHidden} from './IframePageManager.js';

const PreactRouter = preactRouter;

let LEFT_PANEL_WIDTH = 318;
const PANELS_HIDDEN_CLS = 'panels-hidden';
let showFirstTimeDragInstructions = !(!env.window.isFirstRun || localStorage.sivujettiDragInstructionsShown === 'yes');

class EditApp extends preact.Component {
    // changeViewOptions;
    // currentWebPage;
    /**
     * @param {{dataFromAdminBackend: TheWebsiteBundle; outerEl: HTMLElement; inspectorPanelRef: preact.Ref; rootEl: HTMLElement;}} props
     */
    constructor(props) {
        super(props);
        this.changeViewOptions = [
            {name: 'edit-mode', label: __('Edit mode')},
            {name: 'go-to-web-page', label: __('Exit edit mode')},
        ].concat(props.dataFromAdminBackend.showGoToDashboardMode
            ? {name: 'go-to-dashboard', label: __('Go to dashboard')}
            : []
        ).concat({name: 'log-out', label: __('Log out')});
        this.state = {hidePanels: getArePanelsHidden()};
        if (this.state.hidePanels) props.rootEl.classList.add(PANELS_HIDDEN_CLS);
        this.currentWebPage = null;
        this.resizeHandleEl = preact.createRef();
        store2.dispatch('theWebsiteBasicInfo/set', [props.dataFromAdminBackend.website]);
        props.dataFromAdminBackend.__websiteDebugOnly = props.dataFromAdminBackend.website;
        delete props.dataFromAdminBackend.website;
    }
    /**
     * @param {String} trid
     * @param {Array<RawBlock>} blocks
     * @access public
     */
    addBlockTree(trid, blocks) {
        if (blocks[0].isStoredTo !== 'globalBlockTree' || blocks[0].isStoredToTreeId !== trid)
            throw new Error('blocks not initialized');
        createStoreAndDispatchInnerTree(trid, blocks);
    }
    /**
     * @param {String} trid
     * @access public
     */
    removeBlockTree(trid) {
        const [storeStateKey, _] = createBlockTreeReducerPair(trid);
        store.reducerManager.remove(storeStateKey);
    }
    /**
     * @access protected
     */
    render(_, {hidePanels}) {
        const logoUrl = urlUtils.makeAssetUrl('/public/sivujetti/assets/sivujetti-logo.png');
        return <div>
            { !hidePanels ? null : <a onClick={ e => (e.preventDefault(), this.handlePanelsAreHiddenChanged(false)) } id="back-to-edit-corner" href="">
                <img src={ logoUrl }/>
                <Icon iconId="arrow-back-up"/>
            </a> }
            <header class={ !hidePanels ? 'd-flex' : 'd-none' }>
                <div class="mode-chooser ml-2 d-flex p-1" style="margin-bottom: -.2rem; margin-top: .1rem;">
                    <a href={ urlUtils.makeUrl('_edit', true) } class="d-inline-block mr-1">
                        <img src={ logoUrl }/>
                    </a>
                    <span class="d-inline-block ml-1">
                        <span class="d-block">Sivujetti</span>
                        <select value={ this.changeViewOptions[!hidePanels ? 0 : 1].name } onChange={ e => {
                            if (e.target.value === this.changeViewOptions[1].name) {
                                this.handlePanelsAreHiddenChanged(true);
                            } else if (e.target.value === (this.changeViewOptions[this.changeViewOptions.length - 1]).name)
                                this.logUserOut();
                             else if (e.target.value === (this.changeViewOptions[2] || {}).name)
                                env.window.location.href = this.props.dataFromAdminBackend.dashboardUrl;
                            else
                                throw new Error(`Unkown option ${e.target.value}`);
                        } } class="form-select">
                        { this.changeViewOptions.map(({name, label}) =>
                            <option value={ name }>{ label }</option>
                        ) }</select>
                    </span>
                </div>
                <SaveButton mainPanelOuterEl={ this.props.outerEl }/>
            </header>
            { !showFirstTimeDragInstructions ? null : <div class="drag-instructions-overlay"><div>
                <p class="flex-centered">
                    <Icon iconId="info-circle" className="size-lg mr-2"/>
                    { __('Aloita lisäämään sisältöä raahaamalla') }
                </p>
                <img src={ urlUtils.makeAssetUrl('/public/sivujetti/assets/drag-right-illustration.png') } alt=""/>
                <button onClick={ e => {
                    env.window.localStorage.sivujettiDragInstructionsShown = 'yes';
                    showFirstTimeDragInstructions = false;
                    const el = e.target.closest('.drag-instructions-overlay');
                    el.classList.add('fade-away');
                    setTimeout(() => { el.parentElement.removeChild(el); }, 650);
                } } class="btn btn-primary btn-sm p-absolute" type="button">{ __('Selvä!') }</button>
            </div></div>
            }
            <PreactRouter history={ History.createHashHistory() }>
                <DefaultPanel path="/:slug?"/>
                <PageCreatePanel path="/pages/create/:pageTypeName?/:layoutId?"/>
                <PageDuplicatePanel path="/pages/:pageSlug/duplicate"/>
                <PageTypeCreatePanel path="/page-types/create"/>
            </PreactRouter>
            <Toaster id="editAppMain"/>
            <FloatingDialog/>
            <div class="resize-panel-handle" ref={ this.resizeHandleEl }></div>
        </div>;
    }
    /**
     * @access protected
     */
    componentDidMount() {
        const el = this.resizeHandleEl.current;
        const mainPanelEl = this.props.outerEl;
        const iframeEl = api.webPageIframe.getEl();
        el.style.transform = `translateX(${mainPanelEl.getBoundingClientRect().width}px`;
        //
        const startTreshold = 2;
        const minWidth = 206;
        let startWidth;
        let startScreenX = null;
        let currentHandle = null;
        let inspectorPanel = null;
        //
        el.addEventListener('mousedown', e => {
            if (e.button !== 0) return;
            //
            currentHandle = e.target;
            startWidth = mainPanelEl.getBoundingClientRect().width;
            startScreenX = e.screenX;
            el.classList.add('dragging');
            inspectorPanel = this.props.inspectorPanelRef.current;
        });
        const setPanelWidths = (w) => {
            mainPanelEl.style.width = `${w}px`;
            inspectorPanel.resizeX(w);
            iframeEl.style.width = `calc(100% - ${w}px)`;
            iframeEl.style.transform = `translateX(${w}px)`;
            //
            el.style.transform = `translateX(${w}px)`;
        };
        const commitPanelWidths = () => {
            LEFT_PANEL_WIDTH = parseFloat(mainPanelEl.style.width);
        };
        document.addEventListener('mousemove', e => {
            if (!currentHandle) return;
            //
            let delta = e.screenX - startScreenX;
            if (Math.abs(delta) < startTreshold) return;
            //
            let w = startWidth + delta;
            if (w < minWidth) w = minWidth;
            //
            setPanelWidths(w);
        });
        document.addEventListener('mouseup', () => {
            if (currentHandle) commitPanelWidths();
            currentHandle = null;
            el.classList.remove('dragging');
        });
        signals.on('on-block-dnd-opened', () => {
            inspectorPanel = this.props.inspectorPanelRef.current;
            setPanelWidths(LEFT_PANEL_WIDTH + 124);
            commitPanelWidths();
            this.props.rootEl.classList.add('new-block-spawner-opened');
            if (showFirstTimeDragInstructions) env.document.querySelector('.drag-instructions-overlay').style.width =
                `${LEFT_PANEL_WIDTH}px`;
        });
        signals.on('on-block-dnd-closed', () => {
            setPanelWidths(LEFT_PANEL_WIDTH - 124);
            commitPanelWidths();
            this.props.rootEl.classList.remove('new-block-spawner-opened');
        });
    }
    /**
     * @param {Boolean} to
     * @access private
     */
    handlePanelsAreHiddenChanged(to) {
        api.webPageIframe.pageManager.currentWebPage.setIsMouseListenersDisabled(to);
        this.props.rootEl.classList.toggle(PANELS_HIDDEN_CLS);
        env.window.localStorage.sivujettiDoHidePanels = to ? 'yes' : 'no';
        this.setState({hidePanels: to});
    }
    /**
     * @access private
     */
    logUserOut() {
        http.post('/api/auth/logout')
            .then(() => {
                urlUtils.redirect('/');
            })
            .catch(err => {
                window.console.error(err);
                toasters.editAppMain(__('Something unexpected happened.'), 'error');
            });
    }
}

export default EditApp;
