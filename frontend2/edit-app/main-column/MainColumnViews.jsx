import createHashHistory from '../includes/custom-history.js';
import PagesListView from './page/PagesListView.jsx';
import UploadsListView from './upload/UploadsListView.jsx';
import WebsiteApplyUpdatesView from './website/WebsiteApplyUpdatesView.jsx';
import WebsiteEditBasicInfoView from './website/WebsiteEditBasicInfoView.jsx';
import WebsiteEditGlobalScriptsView from './website/WebsiteEditGlobalScriptsView.jsx';

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
            <WebsiteEditBasicInfoView path="/website/edit-basic-info"/>
            <WebsiteEditGlobalScriptsView path="/website/edit-global-scripts"/>
            <WebsiteApplyUpdatesView path="/website/updates"/>
            <PagesListView path="/pages"/>
            <UploadsListView path="/uploads"/>
        </MyRouter>;
    }
    /**
     * @param {{url: String} & {[key: String]: any;}} e
     * @access private
     */
    onRouteChanged(e) {
        const {rootEl} = this.props;
        const a = isMainColumnViewUrl(e.url);
        const b = rootEl.classList.contains('view-opened');
        if (a && !b)
            rootEl.classList.add('view-opened');
        else if (!a && b)
            rootEl.classList.remove('view-opened');
        // signals.emit('route-changed', e, a); ??
    }
}

/**
 * @param {String} slug
 * @returns {Boolean}
 */
function isMainColumnViewUrl(slug) {
    return [
        '/uploads',
        '/website/edit-basic-info',
        '/website/edit-global-scripts',
        '/website/updates',
        '/pages',
    ].indexOf(slug) > -1;
}

export default MainColumnViews;
export {historyInstance, MyRouter, isMainColumnViewUrl};
