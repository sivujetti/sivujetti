import {api} from '@sivujetti-commons-for-edit-app';
import OnThisPageSection from './default-panel-sections/OnThisPageSection.jsx';

/**
 * Left-panel for "#/pages/:pageSlug/duplicate".
 */
class PageDuplicatePanel extends preact.Component {
    componentWillMount() {
        const pageTypeName = 'Pages';
        const layoutId = '1';
        console.log('p', this.props);
        const ia = this.props.pageSlug;
        api.webPageIframe.foo(pageTypeName, layoutId, ia, _webPage => {
            this.setState({temp: ':pseudo/new-page'}); // duplicate-page ? 
        });
    }
    render(_, {temp}) {
        if (!temp) return;
        return <div>
        <p>Sivuyn duplicate</p>
        <OnThisPageSection loadedPageSlug={ temp }/>
        </div>;
    }
}

export default PageDuplicatePanel;
