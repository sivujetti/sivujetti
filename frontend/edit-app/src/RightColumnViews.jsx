import {signals} from '@sivujetti-commons-for-edit-app';
import WebsiteEditBasicInfoView from './right-column/website/WebsiteEditBasicInfoView.jsx';
import PagesListView from './right-column/page/PagesListView.jsx';
import {isEditAppViewUrl} from './left-column/DefaultPanel.jsx';

const PreactRouter = preactRouter;

class RightColumnViews extends preact.Component {
    /**
     * @access protected
     */
    render() {
        return <PreactRouter history={ History.createHashHistory() } onChange={ this.onRouteChanged.bind(this) }>
            <WebsiteEditBasicInfoView path="/website/edit-basic-info"/>
            <PagesListView path="/pages"/>
        </PreactRouter>;
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
