import {__} from './main.js';

class ContextMenu extends preact.Component {
    // pos;
    /**
     * @param {{links: Array<ContextMenuLink>; onItemClicked: (link: ContextMenuLink) => void; onMenuClosed: () => void;)}} props
     */
    constructor(props) {
        super(props);
        this.state = {isOpen: false};
        this.pos = {left: 0, top: 0};
    }
    /**
     * Opens the context menu next to the top left corner of e.target.
     *
     * @param {Event} e
     * @access public
     */
    open(e) {
        if (this.state.isOpen) return;
        this.pos = e.target.getBoundingClientRect();
        this.setState({isOpen: true});
    }
    /**
     * @param {Event|null} e
     * @access public
     */
    close(e) {
        if (e) e.preventDefault();
        this.setState({isOpen: false});
        this.props.onMenuClosed();
    }
    /**
     * @access protected
     */
    render({links}, {isOpen}) {
        if (!isOpen) return;
        return <>
            <a href="#close" class="popup-close-area" onClick={ this.close.bind(this) }></a>
            <ul class="popup-menu menu" style={ `left:${this.pos.left+10}px;top:${this.pos.top+10}px` }>{ links.map(link =>
                <li class="menu-item"><a onClick={ e => this.emitItemClick(link, e) } href={ `#${link.id}` } title={ link.title }>{ link.text }</a></li>
            ) }</ul>
        </>;
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
