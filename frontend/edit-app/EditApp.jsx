import {
    __,
    api,
    env,
    events,
    getFromLocalStorage,
    http,
    putToLocalStorage,
    urlUtils,
} from '@sivujetti-commons-for-edit-app';
import toasters from './includes/toasters.jsx';
import {clamp} from './includes/utils.js';
import {historyInstance, MyRouter} from './main-column/MainColumnViews.jsx';
import PageCreateState from './menu-column/page/PageCreateState.jsx';
import PageDuplicateState from './menu-column/page/PageDuplicateState.jsx';
import PageTypeCreateState from './menu-column/page-type/PageTypeCreateState.jsx';
import DefaultState from './menu-column/DefaultState.jsx';
import SaveButtonRenderer from './menu-column/SaveButtonRenderer.jsx';

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
            ...(this.props.showGoToDashboardMode
                ? [{name: 'go-to-dashboard', label: __('Go to dashboard')}]
                : []),
            {name: 'log-out', label: __('Log out')},
        ];
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
     * @param {{outerEl: HTMLElement; showGoToDashboardMode?: boolean; dashboardUrl?: string;}} props
     * @access protected
     */
    render({outerEl}) {
        const logoUrl = urlUtils.makeAssetUrl('/public/sivujetti/assets/sivujetti-logo-shape-only.png');
        return [
            <header class="d-flex">
                <div class="mode-chooser ml-2 d-flex p-1" style="margin-bottom: -.2rem; margin-top: .1rem;">
                    <a href={ urlUtils.makeUrl('_edit', true) } class="d-inline-block mr-1">
                        <img src={ logoUrl }/>
                    </a>
                    <span class="d-inline-block ml-1">
                        <span class="d-block">Sivujetti</span>
                        <select value={ this.changeViewOptions[0].name } onChange={ e => {
                            if (e.target.value === this.changeViewOptions.at(-1).name)
                                this.logUserOut();
                            else if (e.target.value === 'go-to-dashboard')
                                env.window.location.href = this.props.dashboardUrl;
                            else
                                env.window.console.error(`Unkown option ${e.target.value}`);
                        } } name="changeView" class="form-select">
                        { this.changeViewOptions.map(({name, label}) =>
                            <option value={ name }>{ label }</option>
                        ) }</select>
                    </span>
                </div>
            <SaveButtonRenderer
                editAppOuterEl={ outerEl }
                saveButton={ api.saveButton.getInstance() }/>
            </header>,
            <MyRouter history={ historyInstance }>
                <DefaultState path="/:slug*"/>
                <PageCreateState path="/pages/create/:pageTypeName?/:layoutId?"/>
                <PageDuplicateState path="/pages/:pageSlug/duplicate"/>
                <PageTypeCreateState path="/page-types/create"/>
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
