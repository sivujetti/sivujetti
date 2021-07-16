import {__, http} from '../../commons/main.js';
import {urlUtils, stringUtils} from '../../commons/utils.js';
import toasters from '../../commons/Toaster.jsx';
import BlockTrees from './BlockTrees.jsx';

const tempPageTypes = {
    'Pages': {
        defaultOwnProps: {categories: '[]'},
    },
    'Categories': {
        defaultOwnProps: {},
    }
};

class AddPageMainPanelView extends preact.Component {
    // pageType;
    // blockTrees;
    /**
     * @param {{cancelAddPage: () => void; pageType: String; webPageIframe: WebPageIframe;}} props
     */
    constructor(props) {
        super(props);
        this.pageType = tempPageTypes[props.pageType];
        this.blockTrees = preact.createRef();
        this.state = {
            slug: '',
            title: '',
            layoutId: '1',
        };
    }
    /**
     * @access protected
     */
    componentDidMount() {
        this.handleTitleChanged({target: {value: __('New page')}});
    }
    /**
     * @access protected
     */
    render({cancelAddPage}, {layoutId, title, slug}) {
        return <form onSubmit={ this.handleFormSubmitted.bind(this) }>
            <h1>{ __('Create page') }</h1>
            <section class="panel-section">
                <h2>{ __('Layout') }</h2>
                <select
                    value={ layoutId }
                    onChange={ this.renderAnotherLayout.bind(this) }
                    class="form-select form-input tight">{ BlockTrees.currentWebPage.data.layouts.map(l =>
                    <option value={ l.id }>{ __(l.friendlyName) }</option>
                ) }</select>
            </section>
            <section class="panel-section">
                <h2>{ __('Default fields') }</h2>
                <div>
                    <div>
                        <input value={ title } onInput={ this.handleTitleChanged.bind(this) } class="form-input tight" placeholder={ __('Title') }/>
                    </div>
                    <div>
                        <input value={ slug } class="form-input tight" placeholder={ __('Slug') } disabled/>
                    </div>
                </div>
            </section>
            <section class="panel-section">
                <h2>{ __('Content') }</h2>
                <BlockTrees containingView="AddPageMainPanelView" ref={ this.blockTrees } hideTabs/>
            </section>
            <div class="float-bottom" style="position: fixed;bottom: 0px;padding: 0.4rem;width: 242px;background: var(--color-bg-dimmed);border-top: 1px solid var(--color-bg-dimmed2);">
                <button class="btn btn-sm btn-primary" type="submit">{ __('Create page') }</button>
                <button class="btn btn-sm btn-link" onClick={ cancelAddPage } type="button">{ __('Cancel') }</button>
            </div>
        </form>;
    }
    /**
     * @param {InputEvent} e
     * @access private
     */
    handleTitleChanged(e) {
        const title = e.target.value;
        this.setState({title, slug: `/${stringUtils.slugify(title) || '-'}`});
        BlockTrees.currentWebPage.updateTitle(title);
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleFormSubmitted(e) {
        e.preventDefault();
        const data = Object.assign({
            slug: this.state.slug,
            path: `${this.state.slug.substr(1)}/`,
            level: 1,
            title: this.state.title,
            layoutId: this.state.layoutId,
            blocks: this.blockTrees.current.getPageBlocksTree(),
            status: 0,
        }, this.pageType.defaultOwnProps);
        http.post('/api/pages/Pages', data)
            .then(resp => {
                if (resp.ok !== 'ok') throw new Error;
                urlUtils.redirect(`/_edit${data.slug}`);
            })
            .catch(err => {
                window.console.error(err);
                toasters.editAppMain(__('Something unexpected happened.'));
            });
    }
    /**
     * @param {InputEvent} e
     * @access private
     */
    renderAnotherLayout(e) {
        this.props.webPageIframe.openPlaceholderPage(e.target.value);
    }
}

export default AddPageMainPanelView;
