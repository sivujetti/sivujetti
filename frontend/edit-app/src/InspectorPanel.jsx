import {__, signals} from '@kuura-commons';
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
        signals.on('on-block-tree-item-clicked', (block, blockTree, blockTreeKind = 'Pages') => {
            const newRendererKey = `edit-block-tree-${blockTreeKind}-${block.id}`;
            if (this.rendererKey === newRendererKey) return;
            this.rendererProps = {block, blockTree};
            this.rendererKey = newRendererKey;
            this.setState({Renderer: BlockEditForm});
            this.props.rootEl.classList.add('inspector-panel-open');
        });
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
            { Renderer ? preact.createElement(Renderer, Object.assign({key: this.rendererKey}, this.rendererProps)) : null }
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
    }
}

export default InspectorPanel;
