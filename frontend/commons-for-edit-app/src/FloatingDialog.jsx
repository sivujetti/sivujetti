import {iconAsString} from './Icon.jsx';

let currentInstance = {
    open: null,
    close: null
};

class FloatingDialog extends preact.Component {
    // currentEl;
    // currenTitle;
    // currentJsPanel;
    /**
     * @param {any} props
     */
    constructor(props) {
        super(props);
        this.rendererProps = null;
        this.state = {Renderer: null, title: null};
        currentInstance.open = this.open.bind(this);
        currentInstance.close = this.close.bind(this);
    }
    /**
     * @param {preact.ComponentType|string} Renderer
     * @param {FloatingDialogSettingsInput & {[key: String]: any;}} settings
     * @param {Object} rendererProps
     * @access public
     */
    open(Renderer, settings, rendererProps) {
        this.rendererProps = rendererProps;
        this.setState(createState(settings, {Renderer}));
    }
    /**
     * @access public
     */
    close() {
        if (!this.state.Renderer)
            return;
        if (this.currentEl) {
            this.currentEl = null;
            this.currenTitle = null;
            this.currentJsPanel.close();
        }
        this.currentJsPanel = null;
        this.setState({Renderer: null, title: null, className: ''});
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
            if (this.state.title !== this.currenTitle) {
                this.currenTitle = this.state.title;
                this.currentJsPanel.setHeaderTitle(this.state.title);
            }
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
                panel.querySelector('.jsPanel-btn-close').innerHTML = iconAsString('circle-x');
            },
            onbeforeclose: () => {
                this.currentEl = null;
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

export {FloatingDialog, currentInstance as floatingDialog};
