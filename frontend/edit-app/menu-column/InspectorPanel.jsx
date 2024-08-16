import {__, env, events, Icon} from '@sivujetti-commons-for-edit-app';
import {clamp} from '../includes/utils.js';
import BlockEditForm from './block/BlockEditForm.jsx';

class InspectorPanel extends preact.Component {
    // rendererProps;
    // rendererKey;
    // resizeHandleEl;
    // lastHeight;
    /**
     * @param {{rootEl: HTMLElement;}} props
     */
    constructor(props) {
        super(props);
        this.state = {Renderer: null};
        this.rendererProps = {};
        this.rendererKey = null;
        this.resizeHandleEl = preact.createRef();
        this.lastHeight = null;
        events.on('block-tree-item-clicked-or-focused', this.open.bind(this));
        events.on('webpage-preview-iframe-before-loaded', this.close.bind(this));
    }
    /**
     * @access public
     */
    close() {
        if (!this.state.Renderer) return;
        this.setState({Renderer: null});
        this.props.rootEl.classList.remove('inspector-panel-open');
        document.documentElement.style.setProperty('--inspector-panel-height', '0');
        this.rendererKey = null;
        events.emit('inspector-panel-closed', this);
    }
    /**
     * @access proctected
     */
    componentDidMount() {
        const MAIN_PANEL_HEADER_HEIGHT = 52;
        const startTreshold = 2;
        const minHeight = 32;
        let maxHeight;
        let startHeight;
        let startScreenY = null;
        let currentHandle = null;
        //
        this.resizeHandleEl.current.addEventListener('mousedown', e => {
            if (e.button !== 0) return;
            currentHandle = e.target;
            startHeight = getCurrentPanelHeight();
            startScreenY = e.screenY;
            maxHeight = env.window.innerHeight - MAIN_PANEL_HEADER_HEIGHT;
        });
        document.addEventListener('mousemove', e => {
            if (!currentHandle) return;
            const delta = e.screenY - startScreenY;
            if (Math.abs(delta) < startTreshold) return;
            const height = clamp(startHeight - delta, minHeight, maxHeight);
            document.documentElement.style.setProperty('--inspector-panel-height', `${height}px`);
            events.emit('inspector-panel-height-changed', height);
        });
        document.addEventListener('mouseup', () => {
            if (currentHandle) {
                this.lastHeight = getCurrentPanelHeight();
            }
            currentHandle = null;
        });
        events.on('route-changed', () => {
            this.close();
        });
    }
    /**
     * @access protected
     */
    render(_, {Renderer}) {
        return <div>
            <div class="resize-panel-handle" ref={ this.resizeHandleEl }></div>
            <button onClick={ this.close.bind(this) } class="btn btn-link with-icon p-absolute p-1" title={ __('Close') } style="right:0;top:0" type="button">
                <Icon iconId="x" className="size-sm"/>
            </button>
            { Renderer ? preact.createElement(Renderer, Object.assign({key: this.rendererKey, inspectorPanel: this}, this.rendererProps)) : null }
        </div>;
    }
    /**
     * Note to self: this currently supports BlockEditForm only.
     *
     * @param {Block} block
     * @access private
     */
    open(block) {
        const newRendererKey = `edit-block-tree-${block.id}`;
        if (this.rendererKey === newRendererKey) return;
        //
        this.rendererProps = {block};
        this.rendererKey = newRendererKey;
        this.setState({Renderer: BlockEditForm});
        this.props.rootEl.classList.add('inspector-panel-open');
        events.emit('inspector-panel-opened', this);
        //
        const height = this.lastHeight || clamp(env.window.innerHeight / 100 * 30, 375, 467);
        document.documentElement.style.setProperty('--inspector-panel-height', `${height}px`);
    }
}

/**
 * @returns {Number}
 */
function getCurrentPanelHeight() {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--inspector-panel-height'));
}

export default InspectorPanel;
