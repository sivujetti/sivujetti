import {__, http, env, Icon} from '@sivujetti-commons-for-edit-app';
import toasters from '../commons/Toaster.jsx';
import store, {deleteItemsFromOpQueueAfter, setOpQueue, observeStore, selectOpQueue, createSelectBlockTree} from '../store.js';
import OnThisPageSection from '../DefaultView/OnThisPageSection.jsx';
import PageTypeBasicInfoConfigurationForm from './PageTypeBasicInfoConfigurationForm.jsx';
import PageTypeOwnFieldsConfigurationForm from './PageTypeOwnFieldsConfigurationForm.jsx';

class PageTypeCreateMainPanelView extends preact.Component {
    // basicInfoWorkingCopy;
    // fieldsWorkingCopy;
    // formWasSubmitted;
    // submitData;
    /**
     * @param {{cancelAddPageType: () => void; pageType: PageType|null; blockTreesRef: preact.Ref;}} props
     */
    constructor(props) {
        super(props);
        this.state = {layouts: [], webpageIsLoaded: false, sectionBIsCollapsed: false, sectionCIsCollapsed: false};
        http.get('/api/layouts')
            .then(layouts => { this.setState({layouts}); })
            .catch(env.window.console.error);
    }
    /**
     * @access protected
     */
    componentDidMount() {
        this.formWasSubmitted = false;
    }
    /**
     * @access protected
     */
    componentWillReceiveProps(props) {
        const {pageType} = props;
        if (!pageType || this.state.webpageIsLoaded) return;
        this.basicInfoWorkingCopy = {
            name: undefined,
            friendlyName: undefined,
            friendlyNamePlural: undefined,
            description: undefined,
            slug: undefined,
            defaultLayoutId: pageType.defaultLayoutId,
            status: pageType.status,
            isListable: pageType.isListable,
        };
        this.lastCommittedName = pageType.name;
        this.fieldsWorkingCopy = pageType.ownFields.map(f => Object.assign({}, f));
        this.setState({webpageIsLoaded: true});
        store.dispatch(setOpQueue([{opName: 'create-new-page-type', command: {
            doHandle: () => {
                this.unreg = observeStore(selectOpQueue, queue => {
                    if (queue.length !== 0) return;
                    this.props.onPageTypeCreated(this.submitData);
                    this.unreg();
                });
                return this.handleFormSubmitted();
            },
            args: []
        }}]));
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        if (this.formWasSubmitted) return;
        store.dispatch(deleteItemsFromOpQueueAfter('create-new-page-type'));
        http.delete(`/api/page-types/${this.lastCommittedName}/as-placeholder`)
            .then(resp => { if (resp.ok !== 'ok') throw new Error('-'); })
            .catch(env.window.console.error);
    }
    /**
     * @access protected
     */
    render({cancelAddPageType, blockTreesRef},
           {webpageIsLoaded, layouts, sectionBIsCollapsed, sectionCIsCollapsed}) {
        return <form>
            <header class="panel-section pb-0">
                <h1 class="mb-2">{ __('Create %s', __('page type')) }</h1>
                <button
                    onClick={ cancelAddPageType }
                    class="btn btn-link btn-sm"
                    title={ __('Cancel add %s', __('page type')) }
                    type="button">&lt; { __('Back') }</button>
            </header>
            <OnThisPageSection containingView="CreatePageType" blockTreesRef={ blockTreesRef } initiallyIsCollapsed={ false }/>
            <section class={ `on-this-page panel-section pl-0${sectionBIsCollapsed ? '' : ' open'}` }>
                <button
                    class="flex-centered pr-2 pl-1 section-title col-12"
                    onClick={ () => this.toggleIsCollapsed('sectionBIsCollapsed') }
                    type="button">
                    <Icon iconId="pencil" className="p-absolute size-sm mr-2 color-blue"/>
                    <span class="pl-1 d-block col-12 color-default">
                        { __('Settings') }
                        <span class="text-ellipsis text-tiny col-12">{ __('Uuden sivutyypin perustiedot') }</span>
                    </span>
                    <Icon iconId="chevron-right" className="p-absolute size-xs"/>
                </button>
                { webpageIsLoaded ? <PageTypeBasicInfoConfigurationForm
                    data={ this.basicInfoWorkingCopy }
                    onPropChanged={ (key, val) => {
                        this.basicInfoWorkingCopy = Object.assign({},
                            this.basicInfoWorkingCopy, {[key]: val}); }
                    }
                    layouts={ layouts }/> : null }
            </section>
            <section class={ `on-this-page panel-section pl-0${sectionCIsCollapsed ? '' : ' open'}` }>
                <button
                    class="flex-centered pr-2 pl-1 section-title col-12"
                    onClick={ () => this.toggleIsCollapsed('sectionCIsCollapsed') }
                    type="button">
                    <Icon iconId="layout-list" className="p-absolute size-sm mr-2 color-orange"/>
                    <span class="pl-1 d-block col-12 color-default">
                        { __('Fields') }
                        <span class="text-ellipsis text-tiny col-12">{ __('Uuden sivutyypin omat kentät') }</span>
                    </span>
                    <Icon iconId="chevron-right" className="p-absolute size-xs"/>
                </button>
                { webpageIsLoaded ? <PageTypeOwnFieldsConfigurationForm
                    fields={ this.fieldsWorkingCopy }
                    onFieldsChanged={ newFields => { this.fieldsWorkingCopy = newFields.map(f => Object.assign({}, f)); } }/> : null }
            </section>
        </form>;
    }
    /**
     * @param {'sectionCIsCollapsed'|'sectionBIsCollapsed'} e
     * @access private
     */
    toggleIsCollapsed(prop) {
        this.setState({[prop]: !this.state[prop]});
    }
    /**
     * @param {Event|undefined} e
     * @returns {Promise<Boolean>}
     * @access private
     */
    handleFormSubmitted(e) {
        if (e) e.preventDefault();
        const l = this.state.layouts.find(({id}) => id === this.basicInfoWorkingCopy.defaultLayoutId);
        // {name, friendlyName ...}
        const data = Object.assign({}, this.basicInfoWorkingCopy);
        if (!data.description) data.description = '';
        const belongsToLayout = b => b.type === 'PageInfo' ||
            (b.type === 'GlobalBlockReference' && l.structure.some(p =>
                p.type === 'globalBlockTree' &&
                p.globalBlockTreeId === b.globalBlockTreeId
            ));
        data.blockFields = createSelectBlockTree('main')(store.getState()).tree.filter(b => !belongsToLayout(b));
        data.defaultFields = this.props.pageType.defaultFields;
        data.ownFields = this.fieldsWorkingCopy;
        //
        this.formWasSubmitted = true;
        return http.put(`/api/page-types/${this.lastCommittedName}`, data)
            .then(resp => {
                if (resp.ok !== 'ok') throw new Error('-');
                this.submitData = data;
                return true;
            })
            .catch(err => {
                window.console.error(err);
                toasters.editAppMain(__('Something unexpected happened.'), 'error');
                return false;
            });
    }
}

/**
 * @returns {Promise<PageType|null>}
 */
function createPlaceholderPageType() {
    return http.post(`/api/page-types/as-placeholder`, {dum: 'my'})
        .then(resp => {
            if (resp.ok !== 'ok') throw new Error('-');
            return resp.newEntity;
        })
        .catch(err => {
            window.console.error(err);
            return null;
        });
}

export {createPlaceholderPageType};

export default PageTypeCreateMainPanelView;
