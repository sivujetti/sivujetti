import {__, http} from '../../commons/main.js';
import {hookForm, InputGroup, InputError, Input} from '../../commons/Form.jsx';
import {urlUtils, stringUtils} from '../../commons/utils.js';
import toasters from '../../commons/Toaster.jsx';
import BlockTrees from './BlockTrees.jsx';
import store, {pushItemToOpQueue, deleteItemsFromOpQueueAfter} from './store.js';

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
        this.state = Object.assign({
            layoutId: '1',
            slug: '',
        }, hookForm(this, {
            title: '',
        }));
    }
    /**
     * @access protected
     */
    componentDidMount() {
        this.form.triggerChange(__('New page'), 'title');
        store.dispatch(pushItemToOpQueue('create-new-page', this.handleFormSubmitted.bind(this)));
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
            <h1>{ __('Create page') }</h1>
            <button
                onClick={ cancelAddPage }
                class="btn btn-link btn-sm mb-2"
                title={ __('Cancel add page') }
                type="button">&lt; { __('Back') }</button>
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
            this.setState({slug: `/${stringUtils.slugify(title) || '-'}`});
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
        const data = Object.assign({
            slug: this.state.slug,
            path: `${this.state.slug.substr(1)}/`,
            level: 1,
            title: this.state.values.title,
            layoutId: this.state.layoutId,
            blocks: this.blockTrees.current.getPageBlocksTree(),
            status: 0,
        }, this.pageType.defaultOwnProps);
        return http.post('/api/pages/Pages', data)
            .then(resp => {
                if (resp.ok !== 'ok') throw new Error('-');
                urlUtils.redirect(`/_edit${data.slug}`);
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
        this.props.webPageIframe.openPlaceholderPage(e.target.value);
    }
}

export default AddPageMainPanelView;
