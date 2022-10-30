import {__, api} from '@sivujetti-commons-for-edit-app';
import OnThisPageSection from './default-panel-sections/OnThisPageSection.jsx';

/**
 * Left-panel for "#/pages/:pageSlug/duplicate". todo käytä PageCreatePanel:ia?
 */
class PageDuplicatePanel extends preact.Component {
    componentWillMount() {
        const todo = 'Pages';
        const layoutId = '1';
        const ia = this.props.pageSlug;
        this.pageType = api.getPageTypes().find(({name}) => name === todo);
        api.webPageIframe.renderPlaceholderPage(todo, layoutId, ia).then(_webPage => {
            this.setState({temp: ':pseudo/new-page'});
        });
    }
    render(_, {temp}) {
        const name = this.pageType.friendlyName.toLowerCase();
        return <div>
            <header class="panel-section pb-0">
                <h1 class="mb-2">{ __('Create %s', name) }</h1>
                <button
                    onClick={ () => preactRouter.route('/') }
                    class="btn btn-link btn-sm"
                    title={ __('Cancel create %s', name) }
                    type="button">&lt; { __('Back') }</button>
            </header>
            { temp ? <OnThisPageSection loadedPageSlug={ temp }/> : null }
        </div>;
    }
}

export default PageDuplicatePanel;
