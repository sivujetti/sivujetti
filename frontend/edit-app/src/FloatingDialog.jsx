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
        this.state = {Renderer: null, title: null};
        currentInstance.open = this.open.bind(this);
        currentInstance.close = this.close.bind(this);
    }
    /**
     * @param {any} Renderer
     * @param {{title: String;} & {[key: String]: any;}} settings
     * @param {any} rendererProps
     * @access public
     */
    open(Renderer, settings, rendererProps) {
        this.rendererProps = rendererProps;
        this.setState(Object.assign({Renderer}, settings));
    }
    /**
     * @access public
     */
    close() {
        this.setState({Renderer: null, title: null});
    }
    /**
     * @access protected
     */
    render(_, {Renderer, title, className}) {
        return Renderer
            ? <div class={ 'floating-dialog' + (!className ? '' : ` ${className}`) } style="width: 600px;transform: translate(200px, 60px);">
                <div class="box">
                    <h2>{ title }</h2>
                    <div class="main">{
                        preact.createElement(Renderer, this.rendererProps)
                    }</div>
                </div>
            </div>
            : null;
    }
}

export default currentInstance;
export {FloatingDialog};
