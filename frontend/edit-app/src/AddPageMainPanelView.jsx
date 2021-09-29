import {__, http, urlUtils, signals, env} from '@sivujetti-commons';
import {InputGroupInline} from '../../commons/Form.jsx';
import toasters from '../../commons/Toaster.jsx';
import BlockTrees from './BlockTrees.jsx';
import store, {deleteItemsFromOpQueueAfter, setOpQueue} from './store.js';

class AddPageMainPanelView extends preact.Component {
    // pageMetaData;
    // pageType;
    // blockTrees;
    // unregisterSignalListener;
    /**
     * @param {{cancelAddPage: () => void; pageType: PageType; reRenderWithAnotherLayout: (layoutId: String) => void; page: Page; noAutoFocus?: Boolean;}} props
     */
    constructor(props) {
        super(props);
        this.pageMetaData = {};
        this.blockTrees = preact.createRef();
        this.state = {layouts: BlockTrees.currentWebPage ? BlockTrees.currentWebPage.data.layouts : null};
        this.unregisterSignalListener = signals.on('on-page-info-form-value-changed',
        /**
         * @param {PageMetaRaw} pageMeta
         */
        pageMeta => {
            this.pageMetaData = pageMeta;
        });
    }
    /**
     * @access protected
     */
    componentDidMount() {
        store.dispatch(setOpQueue([{opName: 'create-new-page', command: {
            doHandle: this.handleFormSubmitted.bind(this),
            args: []
        }}]));
        if (!this.props.noAutoFocus) setTimeout(() => {
            env.document.querySelector('.block-tree li[data-block-type="PageInfo"] .block-handle').click();
            const unregisterListener = signals.on('on-inspector-panel-revealed', () => {
                env.document.querySelector('input[name="title"]').focus();
                unregisterListener();
            });
        }, 1);
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        store.dispatch(deleteItemsFromOpQueueAfter('create-new-page'));
        this.unregisterSignalListener();
    }
    /**
     * @access protected
     */
    render({cancelAddPage}, {layouts}) {
        return <form onSubmit={ this.handleFormSubmitted.bind(this) }>
            <header class="panel-section mb-2">
                <h1 class="mb-2">{ __('Create %s', this.props.pageType.name) }</h1>
                <button
                    onClick={ cancelAddPage }
                    class="btn btn-link btn-sm"
                    title={ __('Cancel add %s', this.props.pageType.name) }
                    type="button">&lt; { __('Back') }</button>
            </header>
            { layouts && layouts.length > 1 ?
            <section class="panel-section open pt-0"><div class="form-horizontal pt-0">
                <InputGroupInline>
                    <label class="form-label" htmlFor="pageLayout">{ __('Layout') }</label>
                    <select
                        value={ BlockTrees.currentWebPage.data.page.layoutId }
                        onChange={ e => this.props.reRenderWithAnotherLayout(e.target.value) }
                        class="form-select form-input tight"
                        name="pageLayout"
                        id="pageLayout">{ layouts.map(l =>
                        <option value={ l.id }>{ __(l.friendlyName) }</option>
                    ) }</select>
                </InputGroupInline>
            </div></section> : null }
            <section>
                <BlockTrees
                    onWebPageLoadHandled={ () => { this.setState({layouts: BlockTrees.currentWebPage.data.layouts}); }}
                    containingView="AddPageMainPanelView"
                    ref={ this.blockTrees }/>
            </section>
        </form>;
    }
    /**
     * @param {Event|undefined} e
     * @returns {Promise<Boolean>}
     * @access private
     */
    handleFormSubmitted(e) {
        if (e) e.preventDefault();
        // {title, slug, customField1, customField2 ...}
        const data = Object.assign({}, this.pageMetaData);
        data.path = `${data.slug.substr(1)}/`;
        data.level = 1;
        data.layoutId = BlockTrees.currentWebPage.data.page.layoutId;
        data.blocks = this.blockTrees.current.getPageBlocks();
        data.status = 0;
        //
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
}

export default AddPageMainPanelView;
