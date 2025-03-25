import {events} from './edit-app-singletons.js';
import {iconAsString} from './Icon.jsx';

let currentInstance = {
    open: null,
    getCurrentRendererCls: null,
    isOpen: null,
    updateRendererProps: null,
    close: null,
    setTitle: null,
    setOnBeforeClose: null,
    setHeight: null,
};

class FloatingDialog extends preact.Component {
    // currentEl;
    // currenTitle;
    // currentJsPanel;
    // currentHeight;
    // timeout;
    // closing;
    /**
     * @param {any} props
     */
    constructor(props) {
        super(props);
        this.state = {Renderer: null, rendererProps: null, title: null};
        currentInstance.open = this.open.bind(this);
        currentInstance.getCurrentRendererCls = () => this.state.Renderer;
        currentInstance.isOpen = () => !!currentInstance.getCurrentRendererCls();
        currentInstance.updateRendererProps = newProps => this.setState({rendererProps: {...this.state.rendererProps, ...newProps}});
        currentInstance.close = this.close.bind(this);
        currentInstance.setTitle = title => { this.currenTitle = title; this.currentJsPanel.setHeaderTitle(title); };
        currentInstance.setOnBeforeClose = fn => { this.onBeforeClose = fn; };
        currentInstance.setHeight = (height, instructions = '') => {
            if (this.currentHeight === height)
                return;
            this.currentHeight = height;
            if (instructions === 'animate') {
                if (this.timeout) clearTimeout(this.timeout);
                this.currentJsPanel.classList.add('animating');
            }
            this.currentJsPanel.resize({height});
            if (instructions === 'animate') {
                this.timeout = setTimeout(() => { this.currentJsPanel.classList.remove('animating'); }, 400);
            }
        };
        events.on('route-changed', () => {
            this.close();
        });
    }
    /**
     * @param {preact.ComponentType|string} Renderer
     * @param {FloatingDialogSettingsInput & {[key: string]: any;}} settings
     * @param {Object} rendererProps
     * @access public
     */
    open(Renderer, settings, rendererProps) {
        this.settings = settings;
        const state = createState({Renderer, rendererProps}, settings);
        this.currentHeight = state.height;
        this.setState(state);
    }
    /**
     * @access public
     */
    close() {
        if (!this.state.Renderer || !this.currentJsPanel)
            return;
        if (!this.closing) {
            // Call currentJsPanel.close(), which then calls this method again (see onbeforeclose)
            this.currentJsPanel.close();
        } else {
            this.currenTitle = null;
            this.currentJsPanel = null;
            if (this.onBeforeClose) this.onBeforeClose();
            this.setState({Renderer: null, title: null, className: ''});
            this.closing = false;
        }
    }
    /**
     * @access protected
     */
    render(_, {Renderer, rendererProps, className}) {
        return Renderer
            ? <div
                class={ 'floating-dialog' + (!className ? '' : ` ${className}`) }
                ref={ this.handleDialogElChanged.bind(this) }>
                <Renderer { ...rendererProps }/>
            </div>
            : null;
    }
    /**
     * @param {HTMLElement?} el
     */
    handleDialogElChanged(el) {
        if (!el)
            return;
        if (el === this.currentEl) {
            if (this.state.title !== this.currenTitle)
                currentInstance.setTitle(this.state.title);
            return;
        }
        this.currentEl = el;
        this.currenTitle = this.state.title || 'title';
        this.currentJsPanel = window.jsPanel.create({
            content: el,
            headerTitle: this.currenTitle,
            theme: 'none',
            headerControls: {
                minimize: 'remove',
                normalize: 'remove',
                maximize: 'remove',
                smallify: 'remove',
            },
            callback: panel => {
                const closeBtn = panel.querySelector('.jsPanel-btn-close');
                closeBtn.innerHTML = this.settings.noClose ? '' : iconAsString('x');
                if (this.settings.backdrop)
                    document.body.classList.add('with-backdrop');
            },
            onbeforeclose: () => {
                if (this.settings.backdrop)
                    document.body.classList.remove('with-backdrop');
                this.closing = true;
                this.close();
                return true;
            },
            resizeit: {
                handles: 'e, s, w, se, sw',
                minWidth: 480,
                minHeight: 162
            },
            panelSize: {
                width: this.state.width,
                height: this.state.height,
            },
            position: 'left-top 350 35',
        });
    }
}

/**
 * @param {{Renderer: preact.ComponentType|string; rendererProps: Object;}} from
 * @param {FloatingDialogSettingsInput} settings
 * @returns {FloatingDialogState}
 */
function createState(from, settings) {
    return {
        ...from,
        title: settings.title || '-',
        width: settings.width ? +settings.width : 680,
        height: settings.height ? +settings.height : 480,
    }
}

/** @typedef {{
 *   setHeaderTitle: Function;
 *   resize: Function;
 *   close: Function;
 *   [key: string]: any;
 * } & HTMLDivElement} JsPanel */

/** @typedef {{
 *  Renderer: preact.ComponentType|string;
 *  rendererProps: Object;
 *  title: string;
 *  width: number;
 *  height: number;
 *  className?: string;
 * }} FloatingDialogState */

export {FloatingDialogImpl as FloatingDialog, currentInstance};
