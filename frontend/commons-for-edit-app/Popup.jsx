import {Icon} from './Icon.jsx';
import {__, events} from './edit-app-singletons.js';

class Popup extends preact.Component {
    // rendererCmp;
    // popperInstance; // public
    // isUnmounted;
    // unregistrables;
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
     * @param {{Renderer: preact.Component; btn: HTMLElement; close: () => void; rendererProps?: {[key: String]: any;}; placement?: 'top-start'; className?: String; settings?: {maxWidth?: Number; offsetY?: Number;};}} props
     * @access protected
     */
    render({Renderer, rendererProps, close, className, settings}) {
        const {maxWidth} = settings || {};
        return <div
            class={ 'my-tooltip' + (className ? ` ${className}` : '') }
            role="tooltip"
            ref={ this.handleOuterElRefd.bind(this) }
            { ...(maxWidth ? {style: `max-width: ${parseFloat(maxWidth)}px`} : {}) }>
            <Renderer { ...rendererProps } ref={ this.rendererCmp }/>
            <div class="popper-arrow" data-popper-arrow></div>
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
        if (el && this.rendererCmp.current && !this.popperInstance) {
            this.isUnmounted = false;
            const {placement, btn, settings} = this.props;
            this.popperInstance = window.Popper.createPopper(btn, el, {...{
                modifiers: [
                    // Distance between the arrow reference element
                    {name: 'offset', options: {offset: [0, (settings?.offsetY || 0) + 8]}},
                    // Distance from the edge of the browser window
                    {name: 'preventOverflow', options: {altAxis: true, padding: 4}},
                    {name: 'eventListeners', enabled: true},
                ],
            }, ...(placement ? {placement} : {})});
            const updatePopper = () => {
                if (!this.isUnmounted && this.popperInstance)
                    this.popperInstance.update();
            };
            this.unregistrables = [
                events.on('left-column-width-changed', updatePopper),
                events.on('inspector-panel-height-changed', updatePopper)
            ];
        }
    }
}

export default Popup;
