import {
    events,
    getFromLocalStorage,
    iconAsString,
    putToLocalStorage,
} from '@sivujetti-commons-for-edit-app';
import {createTrier} from './utils.js';
/** @typedef {import('../../commons-for-edit-app/FloatingDialog.jsx').JsPanel} JsPanel */

/** @type {Position} */
let lastPos = null;

/** @extends {preact.Component<any, {Renderer: preact.AnyComponent;}>} */
class FloatingDialog2 extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        /** @type {FloatingDialog2SettingsInput} */
        this.settings = null;
        /** @type {{[key: string]: any;}} */
        this.rendererProps = null;
        /** @type {boolean} */
        this.closing = false;
        /** @type {JsPanel|'loading'} */
        this.jsPanel = null;
        events.on('webpage-preview-iframe-before-loaded', () => {
            if (currentRendererIsBlockEditForm())
                this.close();
        });
        if (!lastPos) {
            const saved = getFromLocalStorage('sivujettiLastDialogPos');
            if (saved) lastPos = JSON.parse(saved);
        }
    }
    /**
     * @returns {{Renderer: preact.AnyComponent; rendererProps: {[key: string]: any;};}}
     * @access public
     */
    getCurrentDialogInfo() {
        return {
            Renderer: this.state.Renderer,
            rendererProps: this.rendererProps,
        };
    }
    /**
     * @param {preact.AnyComponent} Renderer
     * @param {FloatingDialog2SettingsInput} settings = {}
     * @param {{[key: string]: any;}} rendererProps = {}
     * @access public
     */
    open(Renderer, settings = {}, rendererProps = {}) {
        if (this.state.Renderer) {
            this.close();
            setTimeout(() => {
                this.open(Renderer, settings, rendererProps);
            }, 10);
            return;
        }
        this.settings = settings;
        this.rendererProps = rendererProps;
        this.setState({Renderer});
    }
    /**
     * @access public
     */
    close() {
        if (!this.state.Renderer)
            return;
        if (!this.closing) {
            // Call jsPanel.close(), which then calls this method again (see onbeforeclose)
            // @ts-ignore
            this.jsPanel.close();
        } else {
            this.setState({Renderer: null});
            this.closing = false;
            this.jsPanel = null;
        }
    }
    /**
     * @access protected
     */
    render(_, {Renderer}) {
        if (!Renderer) return null;
        return <div style="display: none" ref={ this.onRootDivRefd.bind(this) }>
            <Renderer { ...this.rendererProps }/>
        </div>;
    }
    /**
     * @param {HTMLDivElement} el
     * @access protected
     */
    onRootDivRefd(el) {
        if (!el || this.jsPanel) return;
        this.jsPanel = 'loading';
        const posIn = this.settings.pos;
        createTrier(() => {
            if (!el.firstElementChild) return false;
            if (posIn && !lastPos) {
                lastPos = posIn;
            }
            // @ts-ignore Property 'jsPanel' does not exist on type 'Window & typeof globalThis'
            this.jsPanel = window.jsPanel.create({
                content: el.firstElementChild,
                headerTitle: this.settings.title || '&nbsp;',
                headerControls: 'closeonly xs',
                /**
                 * @param {JsPanel} panel
                 */
                callback: panel => {
                    panel.classList.add('v2');
                    const closeBtn = panel.querySelector('.jsPanel-btn-close');
                    closeBtn.innerHTML = iconAsString('x');
                },
                onbeforeclose: () => {
                    this.closing = true;
                    this.close();
                    return true;
                },
                dragit: {
                    opacity: 0.95,
                    /**
                     * @param {JsPanel} _panel
                     * @param {{left: number; top: number; width: number; height: number;}} paneldata
                     * @param {MouseEvent} _e
                     */
                    stop: (_panel, paneldata, _e) => {
                        lastPos = {x: paneldata.left, y: paneldata.top};
                        putToLocalStorage(JSON.stringify(lastPos), 'sivujettiLastDialogPos');
                    },
                },
                theme: 'none',
                ...(lastPos ? {position: `left-top ${lastPos.x} ${lastPos.y}`} : {})
            });
            return true;
        }, 10, 10, '')();
    }
}

function currentRendererIsBlockEditForm() {
    return true;
}

export default FloatingDialog2;
