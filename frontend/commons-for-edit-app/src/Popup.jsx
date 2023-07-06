import {Icon} from './Icon.jsx';

let __;
let signals;

class Popup extends preact.Component {
    // rendererCmp;
    // popper;
    // isUnmounted;
    // unregistrables;
    /**
     * @access public
     */
    static setDeps(___, _signals) {
        __ = ___;
        signals = _signals;
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.rendererCmp = preact.createRef();
        this.unregistrables = [];
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.isUnmounted = true;
        this.unregistrables.forEach(unreg => unreg());
    }
    /**
     * @param {{Renderer: preact.Component; btn: HTMLElement; close: () => void; rendererProps?: {[key: String]: any;};}} props
     * @access protected
     */
    render({Renderer, rendererProps, close}) {
        return <div id="tooltip" class="tooltip-light" role="tooltip" ref={ this.handleOuterElRefd.bind(this) }>
            <Renderer { ...rendererProps } ref={ this.rendererCmp }/>
            <div id="arrow" data-popper-arrow></div>
            <button
                onClick={ close }
                class="btn btn-link btn-sm p-1 p-absolute"
                title={ __('Close') }
                style="right:0;top:0;background:0 0"
                type="button">
                <Icon iconId="x" className="size-xs"/>
            </button>
        </div>;
    }
    /**
     * @param {HTMLDivElement} el
     * @access private
     */
    handleOuterElRefd(el) {
        if (el && this.rendererCmp.current && !this.popper) {
            this.isUnmounted = false;
            this.popper = window.Popper.createPopper(this.props.btn, el, {
                modifiers: [{
                    name: 'offset',
                    options: {offset: [0, 16]},
                }, {name: 'eventListeners', enabled: true}],
            });
            const updatePopper = () => {
                if (!this.isUnmounted && this.popper)
                    this.popper.update();
            };
            this.unregistrables = [
                signals.on('left-column-width-changed', updatePopper),
                signals.on('inspector-panel-height-changed', updatePopper)
            ];
        }
    }
}

export default Popup;
