import {events, iconAsString} from '@sivujetti-commons-for-edit-app';
import {createTrier} from './utils.js';

/** @extends {preact.Component<any, {Renderer: preact.AnyComponent;}>} */
class FloatingDialog2 extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        /** @type {Object} */
        this.settings = null;
        /** @type {{[key: string]: any;}} */
        this.rendererProps = null;
        /** @type {boolean} */
        this.closing = false;
        /** @type {Object|'loading'} */
        this.jsPanel = null;
        events.on('webpage-preview-iframe-before-loaded', () => {
            if (currentRendererIsBlockEditForm())
                this.close();
        });
    }
    /**
     * @param {preact.AnyComponent} Renderer
     * @param {FloatingDialog2SettingsInput} settings = {}
     * @param {{[key: string]: any;}} rendererProps = {}
     * @access public
     */
    open(Renderer, settings = {}, rendererProps = {}) {
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
        const {pos} = this.settings;
        createTrier(() => {
            if (!el.firstElementChild) return false;
            this.jsPanel = window.jsPanel.create({
                content: el.firstElementChild,
                headerTitle: this.settings.title || '&nbsp;',
                headerControls: 'closeonly xs',
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
                theme: 'none',
                ...(this.settings.pos ? {position: `left-top ${pos.x} ${pos.y}`} : {})
            });
            return true;
        }, 10, 10, '')();
    }
}

function currentRendererIsBlockEditForm() {
    return true;
}

export default FloatingDialog2;
