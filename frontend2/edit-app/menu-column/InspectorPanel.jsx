import {__, api, env, Icon, signals} from '@sivujetti-commons-for-edit-app';
import BlockEditForm from './block/BlockEditForm.jsx';

class InspectorPanel extends preact.Component {
    // rendererProps;
    // rendererKey;
    // resizeHandleEl;
    // lastHeight;
    /**
     * @param {{outerEl: HTMLElement; rootEl: HTMLElement; editAppOuterEl: HTMLElement;}} props
     */
    constructor(props) {
        super(props);
        this.state = {Renderer: null};
        this.rendererProps = {};
        this.rendererKey = null;
        this.resizeHandleEl = preact.createRef();
        this.lastHeight = null;
        signals.on('block-tree-item-clicked-or-focused', this.open.bind(this));
        signals.on('dnd-block-spawner-opened', this.close.bind(this));
    }
    /**
     * @param {Number} width
     * @access public
     */
    resizeX(width) {
        this.props.outerEl.style.width = `${width}px`;
        this.resizeHandleEl.current.style.width = `${width}px`;
    }
    /**
     * @access public
     */
    close() {
        if (!this.state.Renderer) return;
        this.setState({Renderer: null});
        this.props.rootEl.classList.remove('inspector-panel-open');
        this.props.editAppOuterEl.style.height = '';
        this.rendererKey = null;
        this.lastHeight = null;
        signals.emit('inspector-panel-closed', this);
    }
    /**
     * @access proctected
     */
    componentDidMount() {
        const dragEl = this.resizeHandleEl.current;
        const inspectorPanelEl = this.props.outerEl;
        const MAIN_PANEL_HEADER_HEIGHT = 52;
        //
        const startTreshold = 2;
        const minHeight = 32;
        let maxHeight;
        let startHeight;
        let startScreenY = null;
        let currentHandle = null;
        //
        dragEl.addEventListener('mousedown', e => {
            if (e.button !== 0) return;
            //
            currentHandle = e.target;
            startHeight = inspectorPanelEl.getBoundingClientRect().height;
            startScreenY = e.screenY;
            inspectorPanelEl.style.height = `${startHeight}px`;
            maxHeight = env.window.innerHeight - MAIN_PANEL_HEADER_HEIGHT;
        });
        document.addEventListener('mousemove', e => {
            if (!currentHandle) return;
            //
            let delta = e.screenY - startScreenY;
            if (Math.abs(delta) < startTreshold) return;
            //
            let h = startHeight - delta;
            if (h < minHeight) h = minHeight;
            else if (h > maxHeight) h = maxHeight;
            //
            inspectorPanelEl.style.height = `${h}px`;
            dragEl.style.transform = `translateY(-${h}px)`;
            signals.emit('inspector-panel-height-changed', h);
        });
        document.addEventListener('mouseup', () => {
            if (currentHandle) {
                this.lastHeight = Math.abs(parseFloat(dragEl.style.transform.split('translateY(')[1]));
                this.props.editAppOuterEl.style.height = `calc(100% - ${this.lastHeight}px)`;
            }
            currentHandle = null;
        });
        signals.on('route-changed', () => {
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
     * @param {RawBlock} block
     * @param {'direct'|'web-page'|'styles-tab'} origin = null
     * @access private
     */
    open(block, origin = null) {
        const newRendererKey = `edit-block-tree-${block.id}`;
        if (this.rendererKey === newRendererKey) return;
        //
        this.rendererProps = {block};
        this.rendererKey = newRendererKey;
        this.setState({Renderer: BlockEditForm});
        this.props.rootEl.classList.add('inspector-panel-open');
        //
        if (!this.lastHeight) {
            const height = this.lastHeight || clamp(env.window.innerHeight / 100 * 30, 375, 467);
            this.props.outerEl.style.height = `${height}px`;
            this.props.editAppOuterEl.style.height = `calc(100% - ${height}px)`;
            this.resizeHandleEl.current.style.transform = `translateY(-${height}px)`;
        }
        signals.emit('inspector-panel-revealed', this);
        if (origin !== null && origin !== 'web-page') api.webPagePreview.scrollToBlock(block);
    }
}

/**
 * https://stackoverflow.com/a/11409978
 *
 * @param {Number} number
 * @param {Number} min
 * @param {Number} max
 * @returns {Number}
 */
function clamp(number, min, max) {
    return Math.max(min, Math.min(number, max));
}

export default InspectorPanel;
