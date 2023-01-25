import {signals} from '@sivujetti-commons-for-edit-app';
import WebsiteEditBasicInfoView from './website/WebsiteEditBasicInfoView.jsx';
import PagesListView from './page/PagesListView.jsx';
import {isEditAppViewUrl} from '../left-column/DefaultPanel.jsx';
import createHashHistory from '../../custom-history.js';

const historyInstance = createHashHistory();

class MyRouter extends preactRouter {
    /**
     * @param {String} url
     * @access public
     */
    routeTo(url) {
        if (historyInstance.doRevertNextHashChange)
            return;
        return super.routeTo(url);
    }
}

class RightColumnViews extends preact.Component {
    /**
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
            <PagesListView path="/pages"/>
        </MyRouter>;
    }
    /**
     * @param {{url: String} & {[key: String]: any;}} e
     * @access private
     */
    onRouteChanged(e) {
        signals.emit('route-changed', e);
        const {rootEl} = this.props;
        const a = isEditAppViewUrl(e.url);
        const b = rootEl.classList.contains('view-opened');
        if (a && !b)
            rootEl.classList.add('view-opened');
        else if (!a && b)
            rootEl.classList.remove('view-opened');
    }
}

export default RightColumnViews;
export {historyInstance, MyRouter};
