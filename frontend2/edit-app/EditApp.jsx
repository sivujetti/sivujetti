import {
    __,
    env,
    events,
    getFromLocalStorage,
    http,
    Icon,
    putToLocalStorage,
    urlUtils,
} from '@sivujetti-commons-for-edit-app';
import toasters from './includes/toasters.jsx';
import {clamp} from './includes/utils.js';
import {historyInstance, MyRouter} from './main-column/MainColumnViews.jsx';
import PageCreateState from './menu-column/page/PageCreateState.jsx';
import PageDuplicateState from './menu-column/page/PageDuplicateState.jsx';
import DefaultState from './menu-column/DefaultState.jsx';
import SaveButton from './menu-column/SaveButton.jsx';

let showFirstTimeDragInstructions = env.window.isFirstRun && getFromLocalStorage('sivujettiDragInstructionsShown') !== 'yes';

class EditApp extends preact.Component {
    // changeViewOptions;
    // resizeHandleEl;
    /**
     * @access protected
     */
    componentWillMount() {
        this.changeViewOptions = [
            {name: 'edit-mode', label: __('Edit mode')},
            {name: 'hide-edit-menu', label: __('Hide edit menu')},
        ].concat(this.props.showGoToDashboardMode
            ? {name: 'go-to-dashboard', label: __('Go to dashboard')}
            : []
        ).concat({name: 'log-out', label: __('Log out')});
        this.resizeHandleEl = preact.createRef();
    }
    /**
     * @access protected
     */
    componentDidMount() {
        const rootEl = document.getElementById('root');
        const resizeEl = this.resizeHandleEl.current;
        const startTreshold = 1;
        const minWidth = 219;
        const {documentElement, addEventListener} = document;
        let startWidth = 0;
        let startScreenX = null;
        resizeEl.addEventListener('mousedown', async e => {
            if (e.button !== 0) return;
            startScreenX = e.screenX;
            startWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--menu-column-width'));
            resizeEl.classList.add('dragging');
            rootEl.classList.add('adjusting-panel-widths');
        });
        addEventListener('mousemove', e => {
            if (startScreenX === null) return;
            const screenXDelta = e.screenX - startScreenX;
            if (Math.abs(screenXDelta) < startTreshold) return;
            const newWidth = clamp(parseInt(startWidth + screenXDelta, 10), minWidth, Infinity);
            documentElement.style.setProperty('--menu-column-width', `${newWidth}px`);
            events.emit('left-column-width-changed', newWidth);
        });
        addEventListener('mouseup', () => {
            if (startScreenX === null) return;
            startScreenX = null;
            startWidth = null;
            resizeEl.classList.remove('dragging');
            rootEl.classList.remove('adjusting-panel-widths');
        });
        if (getFromLocalStorage('sivujettiFollowLinksInstructionDismissed') !== 'yes') {
            const startShowInstructionTimeout = () => setTimeout(() => {
                toasters.editAppMain(<div>
                    <h4>{ __('Did you know?') }</h4>
                    <span>{ __('When you\'re in the edit mode, you still can navigate any website hyperlink by clicking on it holding Ctrl (Windows) or ⌘ (Mac) key.') }</span>
                </div>, 'info', 0, () => {
                    putToLocalStorage('yes', 'sivujettiFollowLinksInstructionDismissed');
                });
            }, 8000);
            if (!env.window.isFirstRun)
                startShowInstructionTimeout();
            else
                events.on('quick-intro-dismissed', startShowInstructionTimeout);
        }
    }
    /**
     * @param {{outerEl: HTMLElement; onSaveButtonRefd: (cmp: SaveButton) => void; showGoToDashboardMode?: Boolean; dashboardUrl?: String;}} props
     * @access protected
     */
    render({outerEl}) {
        const hidePanels = false;
        const logoUrl = urlUtils.makeAssetUrl('/public/sivujetti/assets/sivujetti-logo-shape-only.png');
        return [
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
                            } else if (e.target.value === this.changeViewOptions.at(-1).name)
                                this.logUserOut();
                            else if (e.target.value === (this.changeViewOptions[2] || {}).name)
                                env.window.location.href = this.props.dashboardUrl;
                            else
                                throw new Error(`Unkown option ${e.target.value}`);
                        } } name="changeView" class="form-select">
                        { this.changeViewOptions.map(({name, label}) =>
                            <option value={ name }>{ label }</option>
                        ) }</select>
                    </span>
                </div>
            <SaveButton
                editAppOuterEl={ outerEl }
                ref={ this.props.onSaveButtonRefd }/>
            </header>,
            !showFirstTimeDragInstructions ? null : <div class="drag-instructions-overlay"><div>
                <p class="flex-centered">
                    <Icon iconId="info-circle" className="size-lg mr-2"/>
                    { __('You can add content by dragging') }
                </p>
                <img src={ urlUtils.makeAssetUrl('/public/sivujetti/assets/drag-right-illustration.png') } alt=""/>
                <button onClick={ dismissFirstTimeInstructions } class="btn btn-primary btn-sm p-absolute" type="button">{ __('Cool!') }</button>
            </div></div>,
            <MyRouter history={ historyInstance }>
                <DefaultState path="/:slug*"/>
                <PageCreateState path="/pages/create/:pageTypeName?/:layoutId?"/>
                <PageDuplicateState path="/pages/:pageSlug/duplicate"/>
                { /* <PageTypeCreatePanel path="/page-types/create"/> */ }
            </MyRouter>,
            <div class="resize-panel-handle" ref={ this.resizeHandleEl }></div>
        ];
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

/**
 * @param {Event} e
 */
function dismissFirstTimeInstructions(e) {
    putToLocalStorage('yes', 'sivujettiDragInstructionsShown');
    showFirstTimeDragInstructions = false;
    const el = e.target.closest('.drag-instructions-overlay');
    el.classList.add('fade-away');
    setTimeout(() => {
        el.parentElement.removeChild(el);
    }, 650);
}

export default EditApp;
