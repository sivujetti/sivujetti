import {api, signals} from '@sivujetti-commons-for-edit-app';

/**
 * The default left-column ("#/", "#/some-page").
 */
class DefaultPanel extends preact.Component {
    // unregisterSignalListener;
    /**
     * @access protected
     */
    componentWillMount() {
        const url = this.props.url || '/';
        const toLoadInitial = !isAnotherAppView(url) ? url : '/';
        this.setState({
            loadingPageSlug: toLoadInitial,
            loadedPageSlug: null,
            sections: getRegisteredMainPanelSectionNames(),
        });
        this.loadPageToPreviewIframe(toLoadInitial);
        this.unregisterSignalListener = signals.on('edit-app-plugins-loaded', () => {
            const maybeUpdated = getRegisteredMainPanelSectionNames();
            if (maybeUpdated.length > this.state.sections.length)
                this.setState({sections: maybeUpdated});
        });
    }
    /**
     * @param {{url: String} & {[key]: String}: any;} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (isAnotherAppView(props.url))
            return;
        if (props.url !== this.props.url)
            this.loadPageToPreviewIframe(props.url);
    }
    /**
     * @access protected
     */
    shouldComponentUpdate(_nextProps, _nextState) {
        if (this.state.loadedPageSlug && // Previous page is already loaded to iframe and ..
            this.state.loadingPageSlug === null) // .. new page has started loading
            return false;
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unregisterSignalListener();
    }
    /**
     * @access protected
     */
    render(_, {loadingPageSlug, loadedPageSlug, sections}) {
        return sections.map(sectionName => {
            const Renderer = api.mainPanel.getSection(sectionName, true);
            const t = {...{loadingPageSlug, loadedPageSlug}, ...this.props};
            return <Renderer {...t}/>;
        });
    }
    /**
     * @param {String} slug
     * @access private
     */
    loadPageToPreviewIframe(slug) {
        //
        this.setState({loadingPageSlug: slug});
        //
        api.webPageIframe.renderNormalPage(slug).then(_webPage => {
            this.setState({loadedPageSlug: slug, loadingPageSlug: null});
        });
    }
}

/**
 * @param {String} slug
 * @returns {Boolean}
 */
function isAnotherAppView(slug) {
    return ['/uploads', '/website/edit-basic-info', '/pages'].indexOf(slug) > -1;
}

/**
 * @returns {Array<String>}
 */
function getRegisteredMainPanelSectionNames() {
    return Array.from(api.mainPanel.getSections().keys());
}

export default DefaultPanel;
export {isAnotherAppView as isEditAppViewUrl};
