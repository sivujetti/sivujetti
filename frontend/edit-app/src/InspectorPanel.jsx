import {__, signals} from '@sivujetti-commons';
import Icon from '../../commons/Icon.jsx';
import BlockEditForm from './BlockEditForm.jsx';

class InspectorPanel extends preact.Component {
    // rendererProps;
    // rendererKey;
    /**
     * @param {{rootEl: HTMLElement;}} props
     */
    constructor(props) {
        super(props);
        this.state = {Renderer: null};
        this.rendererProps = {};
        this.rendererKey = null;
        const openPanel = (block, blockTreeCmp, autoFocus = false) => {
            const blockTree = blockTreeCmp.state.blockTree;
            const blockTreeKind = blockTreeCmp.props.treeKind === 'pageBlocks' ? 'pageBlocks' : 'layoutBlocks';
            const newRendererKey = `edit-block-tree-${blockTreeKind}-${block.id}`;
            if (this.rendererKey === newRendererKey) return;
            this.rendererProps = {block, blockTree, blockTreeCmp, blockTreeKind, autoFocus};
            this.rendererKey = newRendererKey;
            this.setState({Renderer: BlockEditForm});
            this.props.rootEl.classList.add('inspector-panel-open');
        };
        signals.on('on-block-tree-item-clicked', openPanel);
        signals.on('on-block-tree-item-focus-requested', (a, b) => openPanel(a, b, true));
        signals.on('on-web-page-loaded', this.close.bind(this));
    }
    /**
     * @access protected
     */
    render(_, {Renderer}) {
        return <>
            <button onClick={ this.close.bind(this) } class="btn btn-link with-icon p-absolute p-1" title={ __('Close') } style="right:0;top:0" type="button">
                <Icon iconId="x-circle" className="size-xs"/>
            </button>
            { Renderer ? preact.createElement(Renderer, Object.assign({key: this.rendererKey, inspectorPanel: this}, this.rendererProps)) : null }
        </>;
    }
    /**
     * @access private
     */
    open() {
        if (!this.state.Renderer) return;
        this.setState({Renderer: null});
        this.props.rootEl.classList.remove('inspector-panel-open');
    }
    /**
     * @access private
     */
    close() {
        if (!this.state.Renderer) return;
        this.setState({Renderer: null});
        this.props.rootEl.classList.remove('inspector-panel-open');
        this.rendererKey = null;
        signals.emit('on-inspector-panel-closed', this);
    }
}

export default InspectorPanel;
