import {__, api, FloatingDialog, Popup} from '@sivujetti-commons-for-edit-app';
import MainColumnViews from './main-column/MainColumnViews.jsx';
import toasters, {Toaster} from './includes/toasters.jsx';
import ContextMenu from './includes/ContextMenu.jsx';

/** @extends {preact.Component<{rootEl: HTMLElement;}, any>} */
class ViewAndContextMenuLayer extends preact.Component {
    /**
     * @access protected
     */
    componentDidMount() {
        const qstr = (window.location.search || ' '); // '?q=/_edit&show-message=page-type-created' or '?show-message=page-type-created'
        const qvars = qstr.substring(1).split('&').map(pair => pair.split('=')).filter(pair => pair.length === 2);
        const messageKey = (qvars.find(([q]) => q === 'show-message') || [])[1];
        const messageCreators = {
            'page-type-created': () => __('Created new %s', __('page type')),
            'page-deleted': () => __('Deleted page "%s".', '').replace(' ""', ''),
        };
        const createMessage = messageKey ? messageCreators[messageKey] : null;
        if (!createMessage) return;
        toasters.editAppMain(
            createMessage(),
            (qvars.find(([q]) => q === 'message-level') || ['', 'success'])[1]
        );
        const pcs = qstr.split('/_edit'); // ['?q=', '&show-message=page-type-created'] or ['?show-message=page-type-created']
        history.replaceState(null, null, location.href.replace(pcs[1] || pcs[0], ''));
    }
    /**
     * @access protected
     */
    render({rootEl}) { return [
        <ContextMenu ref={ cmp => {
            if (cmp && api.contextMenu.initialized === false) api.contextMenu = cmp;
        } }/>,
        <MainPopper ref={ cmp => {
            if (cmp && !api.mainPopper.render) { api.mainPopper = cmp;}
        } }/>,
        <div id="view">
            <MainColumnViews rootEl={ rootEl }/>
            <FloatingDialog/>
        </div>,
        <Toaster id="editAppMain"/>
    ]; }
}

class MainPopper extends preact.Component {
    // settings;
    /**
     * @param {preact.Component} Renderer
     * @param {HTMLElement} arrowRefEl
     * @param {Object} rendererProps = {}
     * @param {{maxWidth?: number; offsetY?: number;}} settings = {}
     * @access public
     */
    open(Renderer, arrowRefEl, rendererProps = {}, settings = {}) {
        this.settings = settings;
        this.setState({Renderer, arrowRefEl, rendererProps});
    }
    /**
     * @access public
     */
    close() {
        if (this.settings.onClose) this.settings.onClose();
        this.setState({Renderer: null, arrowRefEl: null, rendererProps: null});
    }
    /**
     * @access protected
     */
    render(_, {Renderer, arrowRefEl, rendererProps}) {
        return !Renderer ? null : <Popup
            Renderer={ Renderer }
            rendererProps={ rendererProps }
            btn={ arrowRefEl }
            close={ this.close.bind(this) }
            settings={ this.settings }/>;
    }
}

export default ViewAndContextMenuLayer;
