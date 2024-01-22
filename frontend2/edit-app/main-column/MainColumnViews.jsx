import createHashHistory from '../includes/custom-history.js';
import {isEditAppViewUrl} from '../menu-column/DefaultState.jsx';
import UploadsListView from './upload/UploadsListView.jsx';

const historyInstance = createHashHistory();

class MyRouter extends preactRouter {
    /**
     * @param {String} url
     * @returns {Boolean|undefined}
     * @access public
     */
    routeTo(url) {
        if (historyInstance.doRevertNextHashChange)
            return;
        return super.routeTo(url);
    }
}

class MainColumnViews extends preact.Component {
    // boundOnChange;
    /**
     * @param {{rootEl: HTMLElement;}} props
     */
    constructor(props) {
        super(props);
        this.boundOnChange = this.onRouteChanged.bind(this);
    }
    /**
     * @access protected
     */
    render() {
        return <MyRouter history={ historyInstance } onChange={ this.boundOnChange }>
            {/*<WebsiteEditBasicInfoView path="/website/edit-basic-info"/>*/}
            {/*<WebsiteEditGlobalScriptsView path="/website/edit-global-scripts"/>*/}
            {/*<WebsiteApplyUpdatesView path="/website/updates"/>*/}
            {/*<PagesListView path="/pages"/>*/}
            <UploadsListView path="/uploads"/>
        </MyRouter>;
    }
    /**
     * @param {{url: String} & {[key: String]: any;}} e
     * @access private
     */
    onRouteChanged(e) {
        const {rootEl} = this.props;
        const a = isEditAppViewUrl(e.url);
        const b = rootEl.classList.contains('view-opened');
        if (a && !b)
            rootEl.classList.add('view-opened');
        else if (!a && b)
            rootEl.classList.remove('view-opened');
        // signals.emit('route-changed', e, a); ??
    }
}

export default MainColumnViews;
export {historyInstance, MyRouter};
