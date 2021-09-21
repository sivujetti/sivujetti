import {__, http, urlUtils} from '@sivujetti-commons';
import {hookForm, InputGroup, InputError, Input} from '../../commons/Form.jsx';
import toasters from '../../commons/Toaster.jsx';
import BlockTrees from './BlockTrees.jsx';
import store, {deleteItemsFromOpQueueAfter, setOpQueue} from './store.js';
import {stringUtils} from './utils.js';

class AddPageMainPanelView extends preact.Component {
    // initialPageData;
    // pageType;
    // blockTrees;
    /**
     * @param {{cancelAddPage: () => void; initialPageData: Object; pageType: PageType; webPageIframe: WebPageIframe;}} props
     */
    constructor(props) {
        super(props);
        this.initialPageData = props.initialPageData;
        this.blockTrees = preact.createRef();
        const title = __(this.initialPageData.title);
        this.state = Object.assign({
            layoutId: '1',
            slug: makeSlug(title),
        }, hookForm(this, {
            title,
        }));
    }
    /**
     * @access protected
     */
    componentDidMount() {
        store.dispatch(setOpQueue([{opName: 'create-new-page', handler: this.handleFormSubmitted.bind(this)}]));
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        store.dispatch(deleteItemsFromOpQueueAfter('create-new-page'));
    }
    /**
     * @access protected
     */
    render({cancelAddPage}, {errors, classes, slug, layoutId}) {
        return <form onSubmit={ this.handleFormSubmitted.bind(this) }>
            <header class="panel-section mb-2">
                <h1 class="mb-2">{ __('Create %s', this.props.pageType.name) }</h1>
                <button
                    onClick={ cancelAddPage }
                    class="btn btn-link btn-sm"
                    title={ __('Cancel add %s', this.props.pageType.name) }
                    type="button">&lt; { __('Back') }</button>
            </header>
            <section class="panel-section mt-0">
                <h2>{ __('Layout') }</h2>
                { BlockTrees.currentWebPage ?
                <select
                    value={ layoutId }
                    onChange={ this.renderAnotherLayout.bind(this) }
                    class="form-select form-input tight">{ BlockTrees.currentWebPage.data.layouts.map(l =>
                    <option value={ l.id }>{ __(l.friendlyName) }</option>
                ) }</select> : null }
            </section>
            <section class="panel-section">
                <h2>{ __('Default fields') }</h2>
                <div>
                    <InputGroup classes={ classes.title }>
                        <label htmlFor="title" class="form-label">{ __('Title') }</label>
                        <Input vm={ this } name="title" id="title" errorLabel={ __('Title') }
                            validations={ [['required']] } myOnChange={ this.handleTitleChanged.bind(this) } className="tight"/>
                        <InputError error={ errors.title }/>
                    </InputGroup>
                    <InputGroup>
                        <input value={ slug } class="form-input tight" placeholder={ __('Slug') } disabled/>
                    </InputGroup>
                </div>
            </section>
            <section class="panel-section">
                <h2>{ __('Content') }</h2>
                <BlockTrees containingView="AddPageMainPanelView" ref={ this.blockTrees } hideTabs/>
            </section>
        </form>;
    }
    /**
     * @param {Object} state
     * @access private
     */
    handleTitleChanged(state) {
        const title = state.values.title;
        if (title.length) {
            this.setState({slug: makeSlug(title)});
            BlockTrees.currentWebPage.updateTitle(title);
        }
        return state;
    }
    /**
     * @param {Event|undefined} e
     * @returns {Promise<Boolean>}
     * @access private
     */
    handleFormSubmitted(e) {
        if (!this.form.handleSubmit(e))
            return Promise.resolve(false);
        //
        const data = {
            slug: this.state.slug,
            path: `${this.state.slug.substr(1)}/`,
            level: 1,
            title: this.state.values.title,
            layoutId: this.state.layoutId,
            blocks: this.blockTrees.current.getPageBlocks(),
            status: 0,
        };
        for (const fieldDef of this.props.pageType.ownFields) {
            data[fieldDef.name] = fieldDef.defaultValue;
        }
        return http.post(`/api/pages/${this.props.pageType.name}`, data)
            .then(resp => {
                if (resp.ok !== 'ok') throw new Error('-');
                if (this.props.pageType.name === 'Pages')
                    urlUtils.redirect(`/_edit${data.slug}`);
                else
                    window.console.log('todo');
                return true;
            })
            .catch(err => {
                window.console.error(err);
                toasters.editAppMain(__('Something unexpected happened.'));
                this.form.setIsSubmitting(false);
                return false;
            });
    }
    /**
     * @param {InputEvent} e
     * @access private
     */
    renderAnotherLayout(e) {
        this.props.webPageIframe.openPlaceholderPage(this.initialPageData.type, e.target.value);
    }
}

function makeSlug(title) {
    return `/${stringUtils.slugify(title) || '-'}`;
}

export default AddPageMainPanelView;
