import {api, env} from '@sivujetti-commons-for-edit-app';

/**
 * The default left-panel ("#/", "#/some-page").
 */
class DefaultPanel extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState(createState(this.state));
        this.sdsjdjn(!isAnotherAppView(env.window.location.hash.substring(1)) ? this.props.url : '/');
    }
    /**
     * @param {{loadedPageSlug: String}} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (isAnotherAppView(env.window.location.hash.substring(1)) || isAnotherAppView(this.props.url))
            return;
        if (props.url !== this.props.url)
            this.sdsjdjn(props.url);
    }
    /**
     * @access protected
     */
    render(_, {sections, loadedPageSlug}) {
        return sections.map(sectionName => {
            const Renderer = api.mainPanel.getSection(sectionName);
            const t = {...{loadedPageSlug}, ...this.props};
            return <Renderer {...t}/>;
        });
    }
    /**
     * @param {String} slug
     * @access private
     */
    sdsjdjn(slug) {
        api.webPageIframe.foo2(slug, _webPage => {
            this.setState(createState({loadedPageSlug: slug}));
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
 * @returns {{loadedPageSlug?: String; sections: Array<String>;}}
 */
function createState(initial) {
    return {...initial, ...{sections: Array.from(api.mainPanel.getSections().keys()).slice(0)}};
}

export default DefaultPanel;
