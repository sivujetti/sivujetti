import {__, env} from '@sivujetti-commons-for-edit-app';

let isGlobalEscKeyPressListenerHookedUp = false;
let openInstance = null;

class ContextMenu extends preact.Component {
    // pos;
    // doFilterLinks;
    /**
     * @param {{links: Array<ContextMenuLink>; onItemClicked: (link: ContextMenuLink) => void; onMenuClosed: () => void;)}} props
     */
    constructor(props) {
        super(props);
        this.state = {isOpen: false};
        this.pos = {left: 0, top: 0};
        this.doFilterLinks = null;
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
     * @param {(links: Array<ContextMenuLink>) => Array<ContextMenuLink>} getShowableLinks
     * @access public
     */
    open(e, getShowableLinks) {
        if (this.state.isOpen) return;
        const r = e.target.getBoundingClientRect();
        this.pos = {top: r.top, left: r.left};
        this.doFilterLinks = getShowableLinks || function(links) { return links; };
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
        this.props.onMenuClosed();
    }
    /**
     * @access protected
     */
    render({links}, {isOpen}) {
        if (!isOpen) return;
        return [
            <a href="#close" class="popup-close-area" onClick={ this.close.bind(this) }></a>,
            <ul class="popup-menu menu" style={ `left:${this.pos.left+10}px;top:${this.pos.top+10}px` } ref={ el => {
                if (!el) return;
                const hiddenPortionBottom = el.getBoundingClientRect().bottom - env.window.innerHeight;
                if (hiddenPortionBottom > 0) {
                    this.pos.top -= hiddenPortionBottom;
                    el.style.top = `${this.pos.top}px`;
                }
                const hiddenPortionRight = el.getBoundingClientRect().right - env.window.innerWidth;
                if (hiddenPortionRight > 0) {
                    this.pos.left -= (hiddenPortionRight + 12);
                    el.style.left = `${this.pos.left}px`;
                }
            } }>{ this.doFilterLinks(links).map(link =>
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
        if (this.props.onItemClicked(link) !== false)
            this.close();
    }
}

export default ContextMenu;
