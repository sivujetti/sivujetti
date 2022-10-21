import {api, signals, env} from '@sivujetti-commons-for-edit-app';

/*
DefaultPanel
1. DefaultPanel lataa iframen
2. iframe kutsuu parentWindow.oneway(webPage)

Bb?
*/
class DefaultPanel extends preact.Component {
    /*constructor(props) {
        super(props);
        console.log('con a');
    }*/
    componentWillMount() {
        console.log('wm',this.props, env.window.location.hash);
        this.setState(createState(this.props.sections));
        this.unregisterSignalListener = signals.on('on-web-page-block-clicked', _visibleBlock => {
            if (this.state.sectionAIsCollapsed) this.setState({sectionAIsCollapsed: false});
        });
        this.sdsjdjn(!isAnotherAppView(env.window.location.hash.substring(1)) ? this.props.url : '/');
    }
    componentWillReceiveProps(props) {
        console.log('wmrp',this.props, env.window.location.hash);
        if (isAnotherAppView(env.window.location.hash.substring(1)) || isAnotherAppView(this.props.url))
            return;
        if (props.url !== this.props.url)
            this.sdsjdjn(props.url);
        /*? 
        if (props.sections.join(',') !== this.props.sections.join(','))
            this.setState(createState(props.sections));
        */
    }
    componentWillUnmount() {
        this.unregisterSignalListener();
    }
    sdsjdjn(slug) {
        api.webPageIframe.foo2(slug, _webPage => {
            this.setState({loadedPageSlug: slug});
        });
    }
    render(_, {sections, loadedPageSlug}) {
        return sections.map(sectionName => {
            const Renderer = api.mainPanel.getSection(sectionName);
            const t = Object.assign({loadedPageSlug}, this.props);
            return <Renderer {...t}/>;
        });
    }
}

function isAnotherAppView(slug) {
    return ['/website/edit-basic-info', '/pages'].indexOf(slug) > -1;
}

/**
 * @param {Array<String>} sectionsInput
 * @returns {{sections: Array<String>;}}
 */
function createState(sectionsInput) {
    return {sections: sectionsInput.slice(0)};
}

export default DefaultPanel;
