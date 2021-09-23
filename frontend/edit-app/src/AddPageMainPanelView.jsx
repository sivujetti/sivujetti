import {__, http, urlUtils, signals, env} from '@sivujetti-commons';
import toasters from '../../commons/Toaster.jsx';
import BlockTrees from './BlockTrees.jsx';
import store, {deleteItemsFromOpQueueAfter, setOpQueue} from './store.js';

class AddPageMainPanelView extends preact.Component {
    // initialPageData;
    // pageMetaData;
    // pageType;
    // blockTrees;
    // unregisterSignalListener;
    /**
     * @param {{cancelAddPage: () => void; initialPageData: {id: String; slug: String; path: String; level: Number; type: String; title: String; layoutId: String; status: Number; blocks: Array<RawBlock>; isPlaceholderPage: Boolean;}; pageType: PageType; webPageIframe: WebPageIframe;}} props
     */
    constructor(props) {
        super(props);
        this.initialPageData = props.initialPageData;
        this.pageMetaData = {};
        this.blockTrees = preact.createRef();
        this.state = {layoutId: '1'};
        this.unregisterSignalListener = signals.on('on-page-info-form-value-changed',
        /**
         * @param {{title: String; slug: String;}} newValues
         */
        newValues => {
            this.pageMetaData = {title: newValues.title, slug: newValues.slug};
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
        setTimeout(() => {
            env.document.querySelectorAll('.block-tree li .block-handle')[1].click();
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
    render({cancelAddPage}, {layoutId}) {
        return <form onSubmit={ this.handleFormSubmitted.bind(this) }>
            <header class="panel-section mb-2">
                <h1 class="mb-2">{ __('Create %s', this.props.pageType.name) }</h1>
                <button
                    onClick={ cancelAddPage }
                    class="btn btn-link btn-sm"
                    title={ __('Cancel add %s', this.props.pageType.name) }
                    type="button">&lt; { __('Back') }</button>
            </header>
            {/*<section class="panel-section open pt-0">
                <button class="d-flex col-12 flex-centered pr-2" onClick={ () => '{ this.setState({sectionAIsCollapsed: !sectionAIsCollapsed}); }' } type="button">
                    <Icon iconId="layout" className="size-sm mr-2 color-dimmed"/>
                    <span class="pl-1 color-default">{ __('Layout') }</span>
                    <Icon iconId="chevron-right" className="col-ml-auto size-xs"/>
                </button>
                { BlockTrees.currentWebPage ?
                <select
                    value={ layoutId }
                    onChange={ this.renderAnotherLayout.bind(this) }
                    class="form-select form-input tight">{ BlockTrees.currentWebPage.data.layouts.map(l =>
                    <option value={ l.id }>{ __(l.friendlyName) }</option>
                ) }</select> : null }
            </section>*/}
            <section>
                <BlockTrees containingView="AddPageMainPanelView" ref={ this.blockTrees }/>
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
        const data = {
            slug: this.pageMetaData.slug,
            path: `${this.pageMetaData.slug.substr(1)}/`,
            level: 1,
            title: this.pageMetaData.title,
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

export default AddPageMainPanelView;
