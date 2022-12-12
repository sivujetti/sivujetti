import {api} from '@sivujetti-commons-for-edit-app';

/**
 * The default left-column ("#/", "#/some-page").
 */
class DefaultPanel extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        const toLoadInitial = this.props.url || '/';
        this.setState(createState({...this.state, ...{
            loadingPageSlug: toLoadInitial,
            loadedPageSlug: null
        }}));
        this.loadPageToPreviewIframe(toLoadInitial);
    }
    /**
     * @param {{url: String} & {[key: String}: any;} props
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
    render(_, {loadingPageSlug, loadedPageSlug, sections}) {
        return sections.map(sectionName => {
            const Renderer = api.mainPanel.getSection(sectionName);
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
    return ['/website/edit-basic-info', '/pages'].indexOf(slug) > -1;
}

/**
 * @param {{loadedPageSlug?: String;}} initial
 * @returns {{loadingPageSlug?: String; loadedPageSlug?: String; sections: Array<String>;}}
 */
function createState(initial) {
    return {...initial, ...{sections: Array.from(api.mainPanel.getSections().keys()).slice(0)}};
}

export default DefaultPanel;
export {isAnotherAppView as isEditAppViewUrl};
