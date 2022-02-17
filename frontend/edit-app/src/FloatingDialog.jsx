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
     * @param {FloatingDialogSettingsInput & {[key: String]: any;}} settings
     * @param {any} rendererProps
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
        this.setState({Renderer: null, title: null, className: ''});
    }
    /**
     * @access protected
     */
    render(_, {Renderer, title, className, width}) {
        return Renderer
            ? <div class={ 'floating-dialog' + (!className ? '' : ` ${className}`) } ref={ handleDialogElChanged }>
                <div class="box" style={ `width: ${width}px;transform: translate(200px, 60px);` }>
                    { title.length ? <h2>{ title }</h2> : null }
                    <div class="main">{
                        preact.createElement(Renderer, this.rendererProps)
                    }</div>
                </div>
            </div>
            : null;
    }
}

let last = null;
/**
 * @param {HTMLElement?} el
 */
function handleDialogElChanged(el) {
    if (el && el !== last) {
        last = el;
        new window.Draggabilly(el, {});
    }
}

/**
 * @param {FloatingDialogSettingsInput & {[key: String]: any;}} input
 * @param {{Renderer: preact.AnyComponent;}} out
 * @returns {{title: String; width: Number;}}
 */
function createState(input, out) {
    Object.assign(out, input);
    if (!out.width) out.width = 600;
    return out;
}

/**
 * @typedef FloatingDialogSettingsInput
 * @prop {String} title
 * @prop {Number?} width
 */

export default currentInstance;
export {FloatingDialog};
