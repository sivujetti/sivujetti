import {events} from './edit-app-singletons.js';
import {iconAsString} from './Icon.jsx';

/** @type {FloatingDialog} */
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

/** @extends {preact.Component<{onCallback(panel: JsPanel): void;}, FloatingDialogState>} */
class FloatingDialogImpl extends preact.Component {
    /**
     * @param {any} props
     */
    constructor(props) {
        super(props);
        /** @type {HTMLElement} */
        this.currentEl = null;
        /** @type {NormalizedSettings} */
        this.settings = null;
        /** @type {NormalizedSettings} */
        this.prevSettings = null;
        /** @type {JsPanel} */
        this.currentJsPanel = null;
        /** @type {number} */
        this.timeout = null;
        /** @type {boolean} */
        this.closing = null;
        this.state = {Renderer: null, rendererProps: null, title: null};
        currentInstance.open = this.open.bind(this);
        currentInstance.getCurrentRendererCls = () => this.state.Renderer;
        currentInstance.isOpen = () => !!currentInstance.getCurrentRendererCls();
        currentInstance.updateRendererProps = newProps => this.setState({rendererProps: {...this.state.rendererProps, ...newProps}});
        currentInstance.close = this.close.bind(this);
        currentInstance.setTitle = title => { this.settings.title = title; this.currentJsPanel.setHeaderTitle(title); };
        currentInstance.setOnBeforeClose = fn => { this.onBeforeClose = fn; };
        currentInstance.setHeight = (height, instructions = '') => {
            const heightNorm = height !== 'auto' ? height : this.getContentHeight();
            const adjusted = !this.settings.adjustCalculatedHeight
                ? heightNorm
                : this.settings.adjustCalculatedHeight(heightNorm);
            const final = Math.min(adjusted, window.innerHeight - 48);
            if (instructions === 'animate') {
                if (this.timeout) clearTimeout(this.timeout);
                this.currentJsPanel.classList.add('animating');
            }
            this.currentJsPanel.resize({height: final});
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
        this.prevSettings = this.settings;
        this.settings = createNormalizedSettings(settings);
        this.setState({Renderer, rendererProps});
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
            this.settings = null;
            this.prevSettings = null;
            this.currentJsPanel = null;
            if (this.onBeforeClose) this.onBeforeClose();
            this.setState({Renderer: null, rendererProps: null, className: ''});
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

        if (el === this.currentEl && this.prevSettings) {
            currentInstance.setTitle(this.settings.title);
            this.adjustHeight(this.settings);
            return;
        }

        const useAutoHeight = this.settings.height === 'auto';
        this.currentEl = el;
        this.currentJsPanel = window.jsPanel.create({
            content: el,
            headerTitle: this.settings.title,
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
                width: this.settings.width,
                ...(!useAutoHeight
                    ? {height: this.settings.height}
                    : {height: 0}
                ),
            },
            position: 'left-top 350 35',
        });
        if (useAutoHeight)
            this.adjustHeight(this.settings);
    }
    /**
     * @param {NormalizedSettings} settings
     * @access private
     */
    adjustHeight({height}) {
        currentInstance.setHeight(height !== 'auto'
            ? height
            : this.getContentHeight() +
                parseInt(getComputedStyle(this.currentJsPanel.content).paddingBottom, 10)
        );
    }
    /**
     * @param {JsPanel} panel
     * @returns {number}
     * @access private
     */
    getContentHeight(panel = this.currentJsPanel) {
        return [
            panel.header,
            // @ts-ignore
            ...panel.content.children,
        ].reduce((tot, {clientHeight}) =>
            tot + clientHeight
        , 0);
    }
}

/**
 * @param {FloatingDialogSettingsInput} settings
 * @returns {NormalizedSettings}
 */
function createNormalizedSettings(settings) {
    return {
        ...settings,
        title: settings.title || '-',
        width: settings.width ? +settings.width : 680,
        height: settings.height ? settings.height !== 'auto' ? +settings.height : 'auto' : 480,
    };
}

/** @typedef {{
 *   header: HTMLDivElement;
 *   content: HTMLDivElement;
 *   setHeaderTitle: Function;
 *   resize: Function;
 *   close: Function;
 *   [key: string]: any;
 * } & HTMLDivElement} JsPanel */

/** @typedef {{
 *  Renderer: preact.ComponentType|string;
 *  rendererProps: Object;
 *  className?: string;
 * }} FloatingDialogState */

/** @typedef {FloatingDialogSettingsInput & {
 *  width: number;
 *  height: number|'auto';
 * }} NormalizedSettings */

export {FloatingDialogImpl as FloatingDialog, currentInstance};
