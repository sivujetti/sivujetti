import {iconAsString} from './internal-wrapper.js';

let currentInstance = {
    open: null,
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
     * @param {{}} props
     */
    constructor(props) {
        super(props);
        this.rendererProps = null;
        this.state = {Renderer: null, title: null};
        currentInstance.open = this.open.bind(this);
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
    }
    /**
     * @param {preact.ComponentType|string} Renderer
     * @param {FloatingDialogSettingsInput & {[key: String]: any;}} settings
     * @param {Object} rendererProps
     * @access public
     */
    open(Renderer, settings, rendererProps) {
        this.rendererProps = rendererProps;
        const state = createState(settings, {Renderer});
        this.currentHeight = state.height;
        this.setState(state);
    }
    /**
     * @access public
     */
    close() {
        if (!this.state.Renderer)
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
    render(_, {Renderer, className}) {
        return Renderer
            ? <div
                class={ 'floating-dialog' + (!className ? '' : ` ${className}`) }
                ref={ this.handleDialogElChanged.bind(this) }>
                { preact.createElement(Renderer, this.rendererProps) }
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
                panel.querySelector('.jsPanel-btn-close').innerHTML = iconAsString('x');
            },
            onbeforeclose: () => {
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
 * @param {FloatingDialogSettingsInput & {[key: String]: any;}} input
 * @param {{Renderer: preact.AnyComponent;}} out
 * @returns {{title: String; width: Number; height: Number;}}
 */
function createState(input, out) {
    Object.assign(out, input);
    out.width = out.width ? parseInt(out.width, 10) : 680;
    out.height = out.height ? parseInt(out.height, 10) : 480;
    return out;
}

export {FloatingDialog, currentInstance};
