import {env} from '@sivujetti-commons-for-web-pages';

let isGlobalEscKeyPressListenerHookedUp = false;
let openInstance = null;

class ContextMenu extends preact.Component {
    // controller;
    // pos;
    /**
     * @param {any} props
     */
    constructor(props) {
        super(props);
        this.state = {isOpen: false};
        this.pos = {left: 0, top: 0};
        this.controller = null;
        if (!isGlobalEscKeyPressListenerHookedUp) {
            env.window.addEventListener('keydown', e => {
                if (openInstance && e.key === 'Escape')
                    openInstance.close();
            });
            isGlobalEscKeyPressListenerHookedUp = true;
        }
    }
    /**
     * Opens a context menu next to the top left corner of e.target.
     *
     * @param {Event} e
     * @param {ContextMenuController} controller
     * @access public
     */
    open(e, controller) {
        if (this.state.isOpen) return;
        const rect = e.target.getBoundingClientRect();
        this.pos = {top: rect.top, left: rect.left};
        this.controller = controller;
        this.setState({isOpen: true});
        openInstance = this;
    }
    /**
     * @param {Event|null} e
     * @access public
     */
    close(e) {
        openInstance = null;
        if (e) e.preventDefault();
        this.setState({isOpen: false});
        this.controller.onMenuClosed();
    }
    /**
     * @access protected
     */
    render(_, {isOpen}) {
        if (!isOpen) return;
        return [
            <a href="#close" class="popup-close-area" onClick={ this.close.bind(this) }></a>,
            <ul class="popup-menu menu" style={ `left:${this.pos.left+10}px;top:${this.pos.top+10}px` } ref={ el => {
                if (!el) return;
                const margin = 12;
                if (this.controller.placement === 'right') {
                    this.pos.left -= (el.getBoundingClientRect().width - margin / 2);
                    el.style.left = `${this.pos.left}px`;
                }
                const hiddenPortionBottom = el.getBoundingClientRect().bottom - env.window.innerHeight;
                if (hiddenPortionBottom > 0) {
                    this.pos.top -= hiddenPortionBottom;
                    el.style.top = `${this.pos.top}px`;
                }
                const hiddenPortionRight = el.getBoundingClientRect().right - env.window.innerWidth;
                if (hiddenPortionRight > 0) {
                    this.pos.left -= (hiddenPortionRight + margin);
                    el.style.left = `${this.pos.left}px`;
                }
                const {zIndex} = this.controller;
                if (typeof zIndex === 'number') {
                    el.style.zIndex = zIndex;
                }
            } }>{ this.controller.getLinks().map(link =>
                <li class="menu-item"><a onClick={ e => this.emitItemClick(link, e) } href={ `#${link.id}` } title={ link.title }>{ link.text }</a></li>
            ) }</ul>
        ];
    }
    /**
     * @param {ContextMenuLink} link
     * @param {Event} e
     * @access private
     */
    emitItemClick(link, e) {
        e.preventDefault();
        if (this.controller.onItemClicked(link) !== false)
            this.close();
    }
}

export default ContextMenu;
