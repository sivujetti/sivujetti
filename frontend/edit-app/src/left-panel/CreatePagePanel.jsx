import {api} from '@sivujetti-commons-for-edit-app';
import OnThisPageSection from './default-panel-sections/OnThisPageSection.jsx';

class CreatePagePanel extends preact.Component {
    componentWillMount() {
        const pageTypeName = 'Pages';
        const layoutId = '1';
        const ia = '';
        api.webPageIframe.foo(pageTypeName, layoutId, ia, _webPage => {
            this.setState({temp: ':pseudo/new-page'});
        });
    }
    render(_, {temp}) {
        if (!temp) return;
        return <div>
        <p>Sivuyn luonti</p>
        <OnThisPageSection loadedPageSlug={ temp }/>
        </div>;
    }
}

/**
 * @param {String} path
 * @param {String} fallback = '/'
 * @returns {String} 'foo/' -> '/foo'
 */
function pathToFullSlug(path, fallback = '/') {
    return path !== '/'
        ? `/${path.substring(0, path.length - 1)}` // 'foo/' -> '/foo'
        : fallback;
}

export default CreatePagePanel;
export {pathToFullSlug};
