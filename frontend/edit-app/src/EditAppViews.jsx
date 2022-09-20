import WebsiteEditBasicInfoView from './Website/WebsiteEditBasicInfoView.jsx';

const PreactRouter = preactRouter;

class EditAppViews extends preact.Component {
    /**
     * @access protected
     */
    render() {
        return <PreactRouter history={ History.createHashHistory() }>
            <WebsiteEditBasicInfoView path="/website/edit-basic-info"/>
        </PreactRouter>;
    }
}

export default EditAppViews;
