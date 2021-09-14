let currentInstance = {
    open: null,
    close: null
};

class FloatingDialog extends preact.Component {
    /**
     * @param {any} props
     */
    constructor(props) {
        super(props);
        this.rendererProps = null;
        this.state = {Renderer: null};
        currentInstance.open = this.open.bind(this);
        currentInstance.close = this.close.bind(this);
    }
    /**
     * @param {any} Renderer
     * @param {any} rendererProps
     * @access public
     */
    open(Renderer, rendererProps) {
        this.rendererProps = rendererProps;
        this.setState({Renderer});
    }
    /**
     * @access public
     */
    close() {
        this.setState({Renderer: null});
    }
    /**
     * @access protected
     */
    render() {
        return this.state.Renderer
            ? preact.createElement(this.state.Renderer, this.rendererProps)
            : null;
    }
}

export default currentInstance;
export {FloatingDialog};
