import WebsiteEditBasicInfoView from './Website/WebsiteEditBasicInfoView.jsx';
import PagesListView from './Page/PagesListView.jsx';

const PreactRouter = preactRouter;

class EditAppViews extends preact.Component {
    /**
     * @access protected
     */
    render() {
        return <PreactRouter history={ History.createHashHistory() }>
            <WebsiteEditBasicInfoView path="/website/edit-basic-info"/>
            <PagesListView path="/pages"/>
        </PreactRouter>;
    }
}

export default EditAppViews;
