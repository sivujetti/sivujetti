import {__, signals} from '@sivujetti-commons-for-edit-app';
import OnThisPageSection from './OnThisPageSection.jsx';
import ContentSection from './ContentSection.jsx';
import GlobalStylesSection from './GlobalStylesSection.jsx';

const sectionRenderers = {
    'onThisPage': OnThisPageSection,
    'content': ContentSection,
    'globalStyles': GlobalStylesSection,
};

class DefaultMainPanelView extends preact.Component {
    // unregisterSignalListener;
    /**
     * @param {{sections: Array<String>; startAddPageMode: () => void; startAddPageTypeMode: () => void; blockTreesRef: preact.Ref; currentWebPage: EditAppAwareWebPage;}} props
     */
    constructor(props) {
        super(props);
        this.state = createState(props.sections);
        this.unregisterSignalListener = null;
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.unregisterSignalListener = signals.on('on-web-page-block-clicked', _visibleBlock => {
            if (this.state.sectionAIsCollapsed) this.setState({sectionAIsCollapsed: false});
        });
    }
    /**
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.sections.join(',') !== this.props.sections.join(',')) {
            this.setState(createState(props.sections));
        }
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
    render(_, {sections}) {
        return <>{ sections.map(sectionName => {
            const Renderer = sectionRenderers[sectionName];
            return <Renderer {...this.props}/>;
        }) }</>;
    }
}

/**
 * @param {Array<String>} sectionsInput
 * @returns {{sections: Array<String>;}}
 */
function createState(sectionsInput) {
    return {sections: ['onThisPage'].concat(sectionsInput)};
}

export default DefaultMainPanelView;
