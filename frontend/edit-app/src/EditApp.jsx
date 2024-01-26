import {__, api, signals, http, env, urlUtils, FloatingDialog, Icon} from '@sivujetti-commons-for-edit-app';
import toasters, {Toaster} from './commons/Toaster.jsx';
import store2 from './store2.js';
import SaveButton, { SaveButton2 } from './left-column/SaveButton.jsx';
import DefaultPanel from './left-column/DefaultPanel.jsx';
import PageCreatePanel from './left-column/page/PageCreatePanel.jsx';
import PageDuplicatePanel from './left-column/page/PageDuplicatePanel.jsx';
import PageTypeCreatePanel from './left-column/page-type/PageTypeCreatePanel.jsx';
import {getArePanelsHidden} from './right-column/IframePageManager.js';
import {MyRouter, historyInstance} from './right-column/RightColumnViews.jsx';
import {getFromLocalStorage, putToLocalStorage} from './commons/local-storage-utils.js';

const PANELS_HIDDEN_CLS = 'panels-hidden';
let showFirstTimeDragInstructions = !(!env.window.isFirstRun || getFromLocalStorage('sivujettiDragInstructionsShown') === 'yes');

class EditApp extends preact.Component {
    // changeViewOptions;
    // resizeHandleEl;
    // leftPanelWidth;
    /**
     * @param {{dataFromAdminBackend: TheWebsiteBundle; outerEl: HTMLElement; inspectorPanelRef: preact.Ref; rootEl: HTMLElement;}} props
     */
    constructor(props) {
        super(props);
        this.changeViewOptions = [
            {name: 'edit-mode', label: __('Edit mode')},
            {name: 'hide-edit-menu', label: __('Hide edit menu')},
        ].concat(props.dataFromAdminBackend.showGoToDashboardMode
            ? {name: 'go-to-dashboard', label: __('Go to dashboard')}
            : []
        ).concat({name: 'log-out', label: __('Log out')});
        this.saveButtonRef = preact.createRef();
        this.saveButtonRef2 = preact.createRef();
        this.state = {hidePanels: getArePanelsHidden()};
        if (this.state.hidePanels) props.rootEl.classList.add(PANELS_HIDDEN_CLS);
        this.resizeHandleEl = preact.createRef();
        store2.dispatch('theWebsite/set', [props.dataFromAdminBackend.website]);
        props.dataFromAdminBackend.__websiteDebugOnly = props.dataFromAdminBackend.website;
        delete props.dataFromAdminBackend.website;
    }
    /**
     * @returns {Number}
     * @access public
     */
    getCurrentLeftPanelWidth() {
        return this.leftPanelWidth;
    }
    /**
     * @access protected
     */
    render(_, {hidePanels}) {
        const logoUrl = urlUtils.makeAssetUrl('/public/sivujetti/assets/sivujetti-logo-shape-only.png');
        return [
            !hidePanels ? null : <a onClick={ e => (e.preventDefault(), this.handlePanelsAreHiddenChanged(false)) } id="back-to-edit-corner" href="">
                <img src={ logoUrl }/>
                <Icon iconId="arrow-back-up"/>
            </a>,
// ##             <header class={ !hidePanels ? 'd-flex' : 'd-none' }>
// ##                 <div class="mode-chooser ml-2 d-flex p-1" style="margin-bottom: -.2rem; margin-top: .1rem;">
// ##                     <a href={ urlUtils.makeUrl('_edit', true) } class="d-inline-block mr-1">
// ##                         <img src={ logoUrl }/>
// ##                     </a>
// ##                     <span class="d-inline-block ml-1">
// ##                         <span class="d-block">Sivujetti</span>
// ##                         <select value={ this.changeViewOptions[!hidePanels ? 0 : 1].name } onChange={ e => {
// ##                             if (e.target.value === this.changeViewOptions[1].name) {
// ##                                 this.handlePanelsAreHiddenChanged(true);
// ##                             } else if (e.target.value === this.changeViewOptions.at(-1).name)
// ##                                 this.logUserOut();
// ##                              else if (e.target.value === (this.changeViewOptions[2] || {}).name)
// ##                                 env.window.location.href = this.props.dataFromAdminBackend.dashboardUrl;
// ##                             else
// ##                                 throw new Error(`Unkown option ${e.target.value}`);
// ##                         } } class="form-select">
// ##                         { this.changeViewOptions.map(({name, label}) =>
// ##                             <option value={ name }>{ label }</option>
// ##                         ) }</select>
// ##                     </span>
// ##                 </div>
// ##                 <SaveButton2
// ##                     ref={ this.saveButtonRef2 }/>
// ##                 <SaveButton
// ##                     mainPanelOuterEl={ this.props.outerEl }
// ##                     initialLeftPanelWidth={ this.props.leftPanelWidth }
// ##                     ref={ this.saveButtonRef }/>
// ##             </header>,
            !showFirstTimeDragInstructions ? null : <div class="drag-instructions-overlay"><div>
                <p class="flex-centered">
                    <Icon iconId="info-circle" className="size-lg mr-2"/>
                    { __('You can add content by dragging') }
                </p>
                <img src={ urlUtils.makeAssetUrl('/public/sivujetti/assets/drag-right-illustration.png') } alt=""/>
                <button onClick={ e => {
                    putToLocalStorage('yes', 'sivujettiDragInstructionsShown');
                    showFirstTimeDragInstructions = false;
                    const el = e.target.closest('.drag-instructions-overlay');
                    el.classList.add('fade-away');
                    setTimeout(() => { el.parentElement.removeChild(el); }, 650);
                } } class="btn btn-primary btn-sm p-absolute" type="button">{ __('Cool!') }</button>
            </div></div>,
// ##             <MyRouter history={ historyInstance }>
// ##                 <DefaultPanel path="/:slug*"/>
// ##                 <PageCreatePanel path="/pages/create/:pageTypeName?/:layoutId?"/>
// ##                 <PageDuplicatePanel path="/pages/:pageSlug/duplicate"/>
// ##                 <PageTypeCreatePanel path="/page-types/create"/>
// ##             </MyRouter>,
            <Toaster id="editAppMain"/>,
// ##             <FloatingDialog signals={ signals }/>,
            <div class="resize-panel-handle" ref={ this.resizeHandleEl }></div>
        ];
    }
    /**
     * @access protected
     */
    componentDidMount() {
        const el = this.resizeHandleEl.current;
        const mainPanelEl = this.props.outerEl;
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
            inspectorPanel.props.rootEl.classList.add('adjusting-panel-widths');
        });
        const setAndEmitPanelWidths = (w) => {
            mainPanelEl.style.width = `${w}px`;
            inspectorPanel.resizeX(w);
            const iframeEl = api.webPageIframe.getEl();
            iframeEl.style.width = `calc(100% - ${w}px)`;
            iframeEl.style.transform = `translateX(${w}px)`;
            //
            el.style.transform = `translateX(${w}px)`;
            //
            signals.emit('left-column-width-changed', w);
        };
        this.leftPanelWidth = this.props.LEFT_PANEL_WIDTH;
        const commitPanelWidths = () => {
            this.leftPanelWidth = parseFloat(mainPanelEl.style.width);
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
            setAndEmitPanelWidths(w);
        });
        document.addEventListener('mouseup', () => {
            if (currentHandle) commitPanelWidths();
            currentHandle = null;
            el.classList.remove('dragging');
            if (!inspectorPanel) return;
            inspectorPanel.props.rootEl.classList.remove('adjusting-panel-widths');
        });
        signals.on('block-dnd-opened', () => {
            inspectorPanel = this.props.inspectorPanelRef.current;
            this.leftPanelWidth += 148;
            setAndEmitPanelWidths(this.leftPanelWidth);
            commitPanelWidths();
            this.props.rootEl.classList.add('new-block-spawner-opened');
            if (showFirstTimeDragInstructions) env.document.querySelector('.drag-instructions-overlay').style.width =
                `${this.leftPanelWidth}px`;
        });
        signals.on('block-dnd-closed', () => {
            this.leftPanelWidth -= 148;
            setAndEmitPanelWidths(this.leftPanelWidth);
            commitPanelWidths();
            this.props.rootEl.classList.remove('new-block-spawner-opened');
        });
        if (getFromLocalStorage('sivujettiFollowLinksInstructionDismissed') !== 'yes') {
            const startShowInstructionTimeout = () => setTimeout(() => {
                toasters.editAppMain(<div>
                    <h4>{ __('Did you know?') }</h4>
                    <span>{ __('When you\'re in the edit mode, you still can navigate any website hyperlink by clicking on it holding Ctrl (Windows) or ⌘ (Mac) key.') }</span>
                </div>, 'info', 0, () => {
                    putToLocalStorage('ys', 'sivujettiFollowLinksInstructionDismissed');
                });
            }, 8000);
            if (!env.window.isFirstRun)
                startShowInstructionTimeout();
            else
                signals.on('quick-intro-dismissed', startShowInstructionTimeout);
        }
    }
    /**
     * @param {Boolean} to
     * @access private
     */
    handlePanelsAreHiddenChanged(to) {
        api.webPageIframe.pageManager.currentWebPage.setIsMouseListenersDisabled(to);
        this.props.rootEl.classList.toggle(PANELS_HIDDEN_CLS);
        putToLocalStorage(to ? 'yes' : 'no', 'sivujettiDoHidePanels');
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
